<?php
// Punto de entrada de la API para el calendario de mantenimientos de Inventy.
// Gestiona el cronograma anual de intervenciones preventivas y correctivas.

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");

// Manejo de la pre-petición CORS (Preflight request)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/db.php';
$pdo = getDB();

$method = $_SERVER['REQUEST_METHOD'];

/**
 * Convierte una fila de la tabla en el formato que consume la interfaz.
 *
 * @param array $row
 * @return array
 */
function maintenance_event_response(array $row) {
    return [
        "id" => $row['id'],
        "assetId" => $row['asset_id'],
        "assetName" => $row['asset_name'],
        "title" => $row['title'],
        "type" => $row['type'],
        "status" => $row['status'],
        "date" => $row['date'],
        "time" => $row['time'],
        "technician" => $row['technician'],
        "department" => $row['department'],
        "details" => $row['details'],
    ];
}

/**
 * Indica si una cadena es una fecha real en formato YYYY-MM-DD.
 *
 * @param string $value
 * @return bool
 */
function maintenance_valid_date($value) {
    if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $value, $parts)) {
        return false;
    }
    return checkdate((int) $parts[2], (int) $parts[3], (int) $parts[1]);
}

/**
 * Indica si una cadena es una hora válida en formato HH:MM.
 *
 * @param string $value
 * @return bool
 */
function maintenance_valid_time($value) {
    return (bool) preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $value);
}

/**
 * Devuelve una respuesta de error uniforme y termina la petición.
 *
 * @param int $status
 * @param string $message
 */
function maintenance_error($status, $message) {
    http_response_code($status);
    echo json_encode(["error" => $message]);
    exit;
}

if ($method === 'GET') {
    try {
        $year = isset($_GET['year']) ? (int) $_GET['year'] : (int) date('Y');

        if ($year < 1900 || $year > 2100) {
            maintenance_error(400, "El año solicitado no es válido.");
        }

        $stmt = $pdo->prepare("SELECT * FROM maintenance_events
            WHERE YEAR(`date`) = ?
            ORDER BY `date` ASC, `time` ASC, title ASC");
        $stmt->execute([$year]);

        $events = array_map('maintenance_event_response', $stmt->fetchAll());
        echo json_encode($events);
    } catch (Throwable $e) {
        logDatabaseError("Error obteniendo el calendario de mantenimientos", $e);
        maintenance_error(500, "Error obteniendo el calendario: " . $e->getMessage());
    }
} elseif ($method === 'POST') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data)) {
            maintenance_error(400, "Cuerpo de solicitud inválido o vacío.");
        }

        $id = trim((string) ($data['id'] ?? ''));
        $title = trim((string) ($data['title'] ?? ''));
        $type = trim((string) ($data['type'] ?? 'preventivo'));
        $status = trim((string) ($data['status'] ?? 'programado'));
        $date = trim((string) ($data['date'] ?? ''));
        $time = trim((string) ($data['time'] ?? ''));
        $assetId = trim((string) ($data['assetId'] ?? ''));
        $assetName = trim((string) ($data['assetName'] ?? ''));
        $technician = trim((string) ($data['technician'] ?? ''));
        $department = trim((string) ($data['department'] ?? ''));
        $details = trim((string) ($data['details'] ?? ''));

        if ($title === '') {
            maintenance_error(400, "El título del mantenimiento es obligatorio.");
        }
        if (!maintenance_valid_date($date)) {
            maintenance_error(400, "La fecha debe tener el formato AAAA-MM-DD y ser válida.");
        }

        if (!in_array($type, ['preventivo', 'correctivo'], true)) {
            maintenance_error(400, "El tipo debe ser «preventivo» o «correctivo».");
        }

        if (!in_array($status, ['programado', 'en_proceso', 'completado', 'cancelado'], true)) {
            maintenance_error(400, "El estado del mantenimiento no es válido.");
        }

        if ($time !== '' && !maintenance_valid_time($time)) {
            maintenance_error(400, "La hora debe tener el formato HH:MM.");
        }

        if (strlen($title) > 255) {
            maintenance_error(400, "El título no puede superar los 255 caracteres.");
        }

        // Completa el nombre y la dirección desde el inventario cuando sea posible.
        if ($assetId !== '') {
            $stmtAsset = $pdo->prepare("SELECT name, department FROM assets WHERE id = ?");
            $stmtAsset->execute([$assetId]);
            $asset = $stmtAsset->fetch();

            if ($asset) {
                if ($assetName === '') $assetName = $asset['name'];
                if ($department === '') $department = $asset['department'];
            }
        }

        $values = [
            $title,
            $type,
            $status,
            $date,
            $time !== '' ? $time : null,
            $assetId !== '' ? $assetId : null,
            $assetName !== '' ? $assetName : null,
            $technician !== '' ? $technician : null,
            $department !== '' ? $department : null,
            $details !== '' ? $details : null,
        ];

        if ($id !== '') {
            // Actualización de un mantenimiento existente.
            $stmtCheck = $pdo->prepare("SELECT id FROM maintenance_events WHERE id = ?");
            $stmtCheck->execute([$id]);
            if (!$stmtCheck->fetch()) {
                maintenance_error(404, "El mantenimiento no existe o ya fue eliminado.");
            }

            $stmtUpdate = $pdo->prepare("UPDATE maintenance_events SET
                title = ?, type = ?, status = ?, `date` = ?, `time` = ?,
                asset_id = ?, asset_name = ?, technician = ?, department = ?, details = ?
                WHERE id = ?");
            $stmtUpdate->execute([...$values, $id]);
        } else {
            // Inserción con un identificador legible y único.
            do {
                $id = 'MNT-' . date('Y') . '-' . strtoupper(bin2hex(random_bytes(3)));
                $stmtCheck = $pdo->prepare("SELECT id FROM maintenance_events WHERE id = ?");
                $stmtCheck->execute([$id]);
            } while ($stmtCheck->fetch());

            $stmtInsert = $pdo->prepare("INSERT INTO maintenance_events
                (title, type, status, `date`, `time`, asset_id, asset_name, technician, department, details, id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmtInsert->execute([...$values, $id]);
        }

        $stmtRow = $pdo->prepare("SELECT * FROM maintenance_events WHERE id = ?");
        $stmtRow->execute([$id]);
        echo json_encode(maintenance_event_response($stmtRow->fetch()));
    } catch (Throwable $e) {
        logDatabaseError("Error guardando un mantenimiento del calendario", $e);
        maintenance_error(500, "Error guardando el mantenimiento: " . $e->getMessage());
    }
} elseif ($method === 'DELETE') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = trim((string) ($_GET['id'] ?? (is_array($data) ? ($data['id'] ?? '') : '')));

        if ($id === '') {
            maintenance_error(400, "Debes indicar el mantenimiento que deseas eliminar.");
        }

        $stmt = $pdo->prepare("DELETE FROM maintenance_events WHERE id = ?");
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            maintenance_error(404, "El mantenimiento no existe o ya fue eliminado.");
        }

        echo json_encode(["success" => true, "id" => $id]);
    } catch (Throwable $e) {
        logDatabaseError("Error eliminando un mantenimiento del calendario", $e);
        maintenance_error(500, "Error eliminando el mantenimiento: " . $e->getMessage());
    }
} else {
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido."]);
}
