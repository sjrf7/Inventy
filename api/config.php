<?php
// Configuración de Conexión de Base de Datos - Inventy (MySQL / XAMPP)

// --- Configuración de MySQL / MariaDB (XAMPP) ---
define('MYSQL_HOST', 'localhost');
define('MYSQL_PORT', '3306');
define('MYSQL_DB', 'inventy');
define('MYSQL_USER', 'root');
define('MYSQL_PASS', ''); // Por defecto XAMPP viene sin contraseña

// --- Seguridad del inicio de sesión ---
// El CAPTCHA se genera y valida en el servidor (sin servicios externos).
define('CAPTCHA_LENGTH', 5);              // Cantidad de caracteres del código
define('CAPTCHA_TTL_SECONDS', 300);       // Vigencia del código: 5 minutos
// Permite desactivar el CAPTCHA en pruebas automatizadas locales.
// Uso: INVENTY_CAPTCHA_DISABLED=1 php -S 0.0.0.0:8000
define('CAPTCHA_DISABLED', getenv('INVENTY_CAPTCHA_DISABLED') === '1');

// Límite de intentos fallidos por dirección IP para frenar ataques automatizados.
define('LOGIN_MAX_ATTEMPTS', 10);         // Intentos permitidos dentro de la ventana
define('LOGIN_ATTEMPT_WINDOW', 600);      // Ventana de conteo: 10 minutos
define('LOGIN_LOCKOUT_SECONDS', 600);     // Bloqueo tras superar el límite: 10 minutos
