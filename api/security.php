<?php
/**
 * Utilidades de seguridad de Inventy: sesión, CAPTCHA y límite de intentos.
 *
 * El CAPTCHA se genera en el servidor y se guarda en la sesión como un hash,
 * nunca como texto plano. Cada código es de un solo uso y caduca a los
 * CAPTCHA_TTL_SECONDS segundos.
 */

require_once __DIR__ . '/config.php';

/**
 * Inicia la sesión con cookies seguras y un nombre propio de la aplicación.
 * Es idempotente: si la sesión ya está activa, no hace nada.
 */
function inventy_session_start() {
    if (session_status() === PHP_SESSION_ACTIVE || headers_sent()) {
        return;
    }

    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

    session_name('INVENTYSESS');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);

    session_start();
}

/**
 * Devuelve la dirección IP del cliente usada para el límite de intentos.
 * Solo se confía en REMOTE_ADDR para que un atacante no falsifique la IP
 * mediante cabeceras como X-Forwarded-For.
 *
 * @return string
 */
function inventy_client_ip() {
    return (string) ($_SERVER['REMOTE_ADDR'] ?? 'desconocida');
}

/* -------------------------------------------------------------------------- */
/* CAPTCHA                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Caracteres permitidos. Se excluyen los ambiguos (0/O, 1/I/L) para que el
 * código sea fácil de transcribir por una persona.
 *
 * @return string
 */
function captcha_charset() {
    return 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
}

/**
 * Genera un código aleatorio criptográficamente seguro.
 *
 * @param int $length
 * @return string
 */
function captcha_generate_code($length = CAPTCHA_LENGTH) {
    $charset = captcha_charset();
    $max = strlen($charset) - 1;
    $code = '';
    for ($i = 0; $i < $length; $i++) {
        $code .= $charset[random_int(0, $max)];
    }
    return $code;
}

/**
 * Normaliza lo que escribe el usuario: sin espacios y en mayúsculas.
 *
 * @param mixed $value
 * @return string
 */
function captcha_normalize($value) {
    $value = is_scalar($value) ? (string) $value : '';
    return strtoupper(preg_replace('/\s+/', '', trim($value)));
}

/**
 * Guarda en la sesión el hash del código vigente junto con su caducidad.
 *
 * @param string $code
 */
function captcha_store($code) {
    $_SESSION['captcha'] = [
        'hash' => hash('sha256', captcha_normalize($code)),
        'expires' => time() + CAPTCHA_TTL_SECONDS,
        'created' => time(),
    ];
}

/**
 * Elimina el CAPTCHA actual para que no pueda reutilizarse.
 */
function captcha_clear() {
    unset($_SESSION['captcha']);
}

/**
 * Valida el código enviado por el usuario y lo invalida siempre, incluso si
 * el intento es incorrecto. Así cada código sirve para un único intento.
 *
 * @param mixed $input Código escrito en el formulario.
 * @return array{ok: bool, reason: string}
 */
function captcha_verify($input) {
    if (CAPTCHA_DISABLED) {
        return ['ok' => true, 'reason' => 'disabled'];
    }

    $stored = $_SESSION['captcha'] ?? null;
    captcha_clear();

    if (!is_array($stored) || empty($stored['hash'])) {
        return ['ok' => false, 'reason' => 'missing'];
    }

    if (($stored['expires'] ?? 0) < time()) {
        return ['ok' => false, 'reason' => 'expired'];
    }

    $normalized = captcha_normalize($input);
    if ($normalized === '') {
        return ['ok' => false, 'reason' => 'empty'];
    }

    $matches = hash_equals($stored['hash'], hash('sha256', $normalized));
    return $matches
        ? ['ok' => true, 'reason' => 'ok']
        : ['ok' => false, 'reason' => 'invalid'];
}

/* -------------------------------------------------------------------------- */
/* Límite de intentos por IP                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Carpeta donde se guarda el estado del límite de intentos. Se ubica fuera
 * del directorio público para que los archivos no puedan descargarse desde
 * el navegador, y se crea con permisos restringidos.
 *
 * @return string
 */
function login_throttle_dir() {
    $dir = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'inventy-login-throttle';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    @chmod($dir, 0700);
    return $dir;
}

/**
 * Ruta del archivo de estado correspondiente a una IP.
 *
 * @param string $key
 * @return string
 */
function login_throttle_path($key) {
    return login_throttle_dir() . '/' . hash('sha256', $key) . '.json';
}

/**
 * Lee el estado del límite de intentos de una IP.
 *
 * @param string $key
 * @return array{attempts: int, first: int, locked_until: int}
 */
function login_throttle_read($key) {
    $default = ['attempts' => 0, 'first' => time(), 'locked_until' => 0];
    $handle = @fopen(login_throttle_path($key), 'c+');
    if (!$handle) {
        return $default;
    }

    @flock($handle, LOCK_SH);
    $raw = stream_get_contents($handle);
    @flock($handle, LOCK_UN);
    fclose($handle);

    $data = json_decode((string) $raw, true);
    return is_array($data) ? array_merge($default, $data) : $default;
}

/**
 * Escribe de forma atómica el estado del límite de intentos.
 *
 * @param string $key
 * @param array  $state
 */
function login_throttle_write($key, array $state) {
    $path = login_throttle_path($key);
    $handle = @fopen($path, 'c+');
    if (!$handle) {
        return;
    }

    @flock($handle, LOCK_EX);
    ftruncate($handle, 0);
    rewind($handle);
    fwrite($handle, json_encode($state));
    fflush($handle);
    @flock($handle, LOCK_UN);
    fclose($handle);
    @chmod($path, 0600);
}

/**
 * Segundos que le quedan a una IP bloqueada (0 si no está bloqueada).
 *
 * @param array $state
 * @return int
 */
function login_throttle_remaining(array $state) {
    return max(0, (int) ($state['locked_until'] ?? 0) - time());
}

/**
 * Registra un intento fallido y bloquea la IP si supera el máximo permitido.
 *
 * @param string $key
 * @return array Estado actualizado.
 */
function login_throttle_register_failure($key) {
    $now = time();
    $state = login_throttle_read($key);

    if (login_throttle_remaining($state) > 0) {
        return $state;
    }

    // Si la ventana anterior ya expiró, se reinicia el contador.
    if ((int) ($state['first'] ?? 0) + LOGIN_ATTEMPT_WINDOW < $now) {
        $state = ['attempts' => 0, 'first' => $now, 'locked_until' => 0];
    }

    $state['attempts'] = (int) ($state['attempts'] ?? 0) + 1;
    if ($state['attempts'] >= LOGIN_MAX_ATTEMPTS) {
        $state['locked_until'] = $now + LOGIN_LOCKOUT_SECONDS;
    }

    login_throttle_write($key, $state);
    login_throttle_cleanup();
    return $state;
}

/**
 * Borra el historial de fallos tras un inicio de sesión correcto.
 *
 * @param string $key
 */
function login_throttle_reset($key) {
    @unlink(login_throttle_path($key));
}

/**
 * Elimina archivos de estado antiguos para que la carpeta no crezca sin límite.
 */
function login_throttle_cleanup() {
    if (random_int(1, 50) !== 1) {
        return;
    }

    $files = glob(login_throttle_dir() . '/*.json') ?: [];
    $limit = time() - 86400;
    foreach ($files as $file) {
        if (@filemtime($file) < $limit) {
            @unlink($file);
        }
    }
}
