<?php
/**
 * Generador de CAPTCHA de Inventy.
 *
 * Cada petición crea un código nuevo, lo guarda en la sesión (solo su hash) y
 * devuelve una imagen PNG con ruido y caracteres rotados. El código caduca a
 * los CAPTCHA_TTL_SECONDS segundos y solo puede usarse una vez.
 */

require_once __DIR__ . '/security.php';
inventy_session_start();

header('Content-Type: image/png');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
header('X-Content-Type-Options: nosniff');

$code = captcha_generate_code();
captcha_store($code);

$width = 190;
$height = 58;

// Si la extensión GD no está disponible, se ofrece un SVG de respaldo para no
// dejar el inicio de sesión inutilizable.
if (!function_exists('imagecreatetruecolor')) {
    header('Content-Type: image/svg+xml');
    $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' . $width . '" height="' . $height . '" viewBox="0 0 ' . $width . ' ' . $height . '">';
    $svg .= '<rect width="100%" height="100%" rx="10" fill="#F2F6FC"/>';
    $chars = str_split($code);
    foreach ($chars as $i => $char) {
        $x = 20 + ($i * 33);
        $y = random_int(34, 44);
        $angle = random_int(-14, 14);
        $svg .= '<text x="' . $x . '" y="' . $y . '" transform="rotate(' . $angle . ' ' . $x . ' ' . $y . ')"'
            . ' font-family="Arial, sans-serif" font-size="27" font-weight="700" fill="#1E3A5F">'
            . htmlspecialchars($char, ENT_QUOTES, 'UTF-8') . '</text>';
    }
    $svg .= '</svg>';
    echo $svg;
    exit;
}

$image = imagecreatetruecolor($width, $height);
if (function_exists('imageantialias')) {
    imageantialias($image, true);
}

// Fondo claro y neutro, legible en los temas claro y oscuro de la app.
$background = imagecolorallocate($image, 242, 246, 252);
imagefilledrectangle($image, 0, 0, $width, $height, $background);

// Puntos de ruido
for ($i = 0; $i < 320; $i++) {
    $dot = imagecolorallocate(
        $image,
        random_int(140, 215),
        random_int(155, 220),
        random_int(170, 230)
    );
    imagesetpixel($image, random_int(0, $width - 1), random_int(0, $height - 1), $dot);
}

// Líneas onduladas de fondo
for ($line = 0; $line < 3; $line++) {
    $stroke = imagecolorallocate(
        $image,
        random_int(90, 160),
        random_int(120, 185),
        random_int(175, 225)
    );
    imagesetthickness($image, random_int(1, 2));

    $prevX = 0;
    $prevY = random_int(8, $height - 8);
    for ($x = 6; $x <= $width; $x += 6) {
        $y = max(4, min($height - 4, $prevY + random_int(-5, 5)));
        imageline($image, $prevX, $prevY, $x, $y, $stroke);
        $prevX = $x;
        $prevY = $y;
    }
}

// Caracteres del código, con tamaño, posición y rotación variables.
$font = captcha_font_path();
$slot = (int) floor(($width - 24) / CAPTCHA_LENGTH);
$chars = str_split($code);

foreach ($chars as $index => $char) {
    $ink = imagecolorallocate(
        $image,
        random_int(18, 48),
        random_int(38, 72),
        random_int(75, 120)
    );

    $x = 14 + ($index * $slot) + random_int(-2, 2);

    if ($font !== null) {
        $y = random_int(38, 48);
        imagettftext($image, random_int(21, 25), random_int(-18, 18), $x, $y, $ink, $font, $char);
    } else {
        // Respaldo con la fuente integrada de GD, ampliada para que se lea.
        $y = random_int(22, 28);
        $tmp = imagecreatetruecolor(10, 16);
        $transparent = imagecolorallocate($tmp, 0, 0, 0);
        imagecolortransparent($tmp, $transparent);
        imagefilledrectangle($tmp, 0, 0, 10, 16, $transparent);
        $tmpInk = imagecolorallocate($tmp, 30, 55, 90);
        imagestring($tmp, 5, 0, 4, $char, $tmpInk);
        imagecopyresized($image, $tmp, $x, $y, 0, 0, 18, 29, 10, 16);
        imagedestroy($tmp);
    }
}

// Una línea tenue sobre el texto dificulta la separación automática de glifos.
$overlay = imagecolorallocatealpha($image, 110, 145, 190, 85);
imagesetthickness($image, 1);
imagesetpixel($image, 0, 0, $overlay);
imageline($image, 0, random_int(24, 34), $width, random_int(24, 34), $overlay);

imagepng($image);
imagedestroy($image);

/**
 * Busca una tipografía TrueType disponible en el sistema.
 * Devuelve null si no encuentra ninguna y hay que usar la fuente de GD.
 *
 * @return string|null
 */
function captcha_font_path() {
    static $font = false;
    if ($font !== false) {
        return $font;
    }

    // Sin FreeType, imagettftext no existe: se usa la fuente integrada de GD.
    if (!function_exists('imagettftext')) {
        $font = null;
        return $font;
    }

    $candidates = [
        __DIR__ . '/fonts/DejaVuSans-Bold.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
        '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf',
        'C:\\Windows\\Fonts\\arialbd.ttf',
        'C:\\Windows\\Fonts\\arial.ttf',
    ];

    foreach ($candidates as $candidate) {
        if (is_readable($candidate)) {
            $font = $candidate;
            return $font;
        }
    }

    $font = null;
    return $font;
}
