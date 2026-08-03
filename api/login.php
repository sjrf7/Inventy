<?php
// Punto de entrada de la API para la autenticación de usuarios de Inventy

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

// Manejo de la pre-petición CORS (Preflight request)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Cuerpo de solicitud vacío o inválido"]);
            exit;
        }

        $username = trim($data['username'] ?? '');
        $password = $data['password'] ?? '';

        if (empty($username) || empty($password)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "El usuario y la contraseña son obligatorios"]);
            exit;
        }

        $pdo = getDB();
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        // Valida la contraseña contrastándola contra el hash seguro encriptado
        if ($user && password_verify($password, $user['password'])) {
            echo json_encode([
                "success" => true,
                "user" => [
                    "username" => $user['username'],
                    "fullname" => $user['fullname'],
                    "role" => $user['role']
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(["success" => false, "error" => "Usuario o contraseña incorrectos"]);
        }
    } catch (Throwable $e) {
        logDatabaseError("Error en proceso de autenticación de usuario", $e);
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Error del servidor: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Método no permitido"]);
}
