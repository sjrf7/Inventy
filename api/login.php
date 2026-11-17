<?php
// Punto de entrada de la API para la autenticación de usuarios de Inventy
// Incluye CAPTCHA de un solo uso y límite de intentos fallidos por IP.

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

// Manejo de la pre-petición CORS (Preflight request)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/security.php';
require_once __DIR__ . '/db.php';
inventy_session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Método no permitido"]);
    exit;
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Cuerpo de solicitud vacío o inválido"]);
        exit;
    }

    $throttleKey = inventy_client_ip();
    $throttle = login_throttle_read($throttleKey);
    $lockRemaining = login_throttle_remaining($throttle);

    // Si la IP está bloqueada, ni siquiera se procesa el CAPTCHA.
    if ($lockRemaining > 0) {
        http_response_code(429);
        echo json_encode([
            "success" => false,
            "error" => "Demasiados intentos fallidos. Espera " . (int) ceil($lockRemaining / 60) . " minuto(s) antes de volver a intentarlo.",
            "reason" => "locked",
            "captcha_required" => true,
            "retry_after" => $lockRemaining
        ]);
        exit;
    }

    // Valida el CAPTCHA antes de comprobar las credenciales.
    if (!CAPTCHA_DISABLED) {
        $verification = captcha_verify($data['captcha'] ?? '');
        if (!$verification['ok']) {
            $throttle = login_throttle_register_failure($throttleKey);
            $lockedFor = login_throttle_remaining($throttle);

            if ($lockedFor > 0) {
                http_response_code(429);
                $message = "Demasiados intentos fallidos. Espera " . (int) ceil($lockedFor / 60) . " minuto(s) antes de volver a intentarlo.";
            } else {
                http_response_code(400);
                $message = $verification['reason'] === 'expired'
                    ? "El código de verificación expiró. Escribe el código nuevo."
                    : "El código de verificación es incorrecto. Inténtalo de nuevo.";
            }

            echo json_encode([
                "success" => false,
                "error" => $message,
                "reason" => $lockedFor > 0 ? "locked" : "captcha",
                "captcha_required" => true,
                "retry_after" => $lockedFor
            ]);
            exit;
        }
    }

    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($username) || empty($password)) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error" => "El usuario y la contraseña son obligatorios",
            "reason" => "fields",
            "captcha_required" => true
        ]);
        exit;
    }

    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    // Valida la contraseña contrastándola contra el hash seguro encriptado
    if ($user && password_verify($password, $user['password'])) {
        login_throttle_reset($throttleKey);

        // Renueva el identificador de sesión para evitar fijación de sesión.
        session_regenerate_id(true);

        echo json_encode([
            "success" => true,
            "user" => [
                "username" => $user['username'],
                "fullname" => $user['fullname'],
                "role" => $user['role']
            ]
        ]);
    } else {
        $throttle = login_throttle_register_failure($throttleKey);
        $lockedFor = login_throttle_remaining($throttle);

        if ($lockedFor > 0) {
            http_response_code(429);
            $message = "Demasiados intentos fallidos. Espera " . (int) ceil($lockedFor / 60) . " minuto(s) antes de volver a intentarlo.";
        } else {
            http_response_code(401);
            $message = "Usuario o contraseña incorrectos";
        }

        echo json_encode([
            "success" => false,
            "error" => $message,
            "reason" => $lockedFor > 0 ? "locked" : "credentials",
            "captcha_required" => true,
            "retry_after" => $lockedFor
        ]);
    }
} catch (Throwable $e) {
    logDatabaseError("Error en proceso de autenticación de usuario", $e);
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Error del servidor: " . $e->getMessage(),
        "captcha_required" => true
    ]);
}
