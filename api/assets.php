<?php
// Punto de entrada de la API para la gestión de bienes y activos de Inventy

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

// Manejo de la pre-petición CORS (Preflight request)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/db.php';
$pdo = getDB();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        // Obtiene la lista completa de bienes ordenados por fecha de registro descendente
        $stmt = $pdo->query("SELECT * FROM assets ORDER BY created_at DESC");
        $assets = $stmt->fetchAll();
        
        $result = [];
        foreach ($assets as $a) {
            // Consulta el historial de movimientos y cambios asociados al equipo
            $stmtHist = $pdo->prepare("SELECT id, date, type, user, details FROM history WHERE asset_id = ? ORDER BY date DESC");
            $stmtHist->execute([$a['id']]);
            $history = $stmtHist->fetchAll();
            
            // Consulta los reportes de soporte técnico registrados para el equipo
            $stmtRep = $pdo->prepare("SELECT id, date, technician, diagnosis, actionTaken, statusBefore, statusAfter FROM reports WHERE asset_id = ? ORDER BY date DESC");
            $stmtRep->execute([$a['id']]);
            $reports = $stmtRep->fetchAll();
            
            $result[] = [
                "id" => $a['id'],
                "nroBien" => $a['nroBien'],
                "name" => $a['name'],
                "description" => $a['description'],
                "status" => $a['status'],
                "condition" => $a['condition'],
                "department" => $a['department'],
                "photo" => $a['photo'],
                "technicalSpecs" => [
                    "brand" => $a['brand'],
                    "model" => $a['model'],
                    "serialNumber" => $a['serialNumber'],
                    "processor" => $a['processor'],
                    "ram" => $a['ram'],
                    "storage" => $a['storage']
                ],
                "history" => $history,
                "reports" => $reports
            ];
        }
        
        echo json_encode($result);
    } catch (Throwable $e) {
        logDatabaseError("Error obteniendo lista de bienes", $e);
        http_response_code(500);
        echo json_encode(["error" => "Error obteniendo bienes: " . $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            http_response_code(400);
            echo json_encode(["error" => "Cuerpo de solicitud inválido o vacío"]);
            exit;
        }

        $id = trim($data['id'] ?? '');
        $nroBien = trim($data['nroBien'] ?? '');
        $name = trim($data['name'] ?? '');
        $description = trim($data['description'] ?? '');
        $status = trim($data['status'] ?? 'activo');
        $condition = trim($data['condition'] ?? 'bueno');
        $department = trim($data['department'] ?? '');
        $photo = trim($data['photo'] ?? '');
        
        $specs = $data['technicalSpecs'] ?? [];
        $brand = trim($specs['brand'] ?? '');
        $model = trim($specs['model'] ?? '');
        $serialNumber = trim($specs['serialNumber'] ?? '');
        $processor = trim($specs['processor'] ?? '');
        $ram = trim($specs['ram'] ?? '');
        $storage = trim($specs['storage'] ?? '');

        if (empty($nroBien) || empty($name) || empty($department)) {
            http_response_code(400);
            echo json_encode(["error" => "Faltan campos obligatorios (nroBien, name, department)"]);
            exit;
        }

        if (!empty($id)) {
            // Lógica de ACTUALIZACIÓN de un bien existente
            // Verifica que el activo realmente exista en base de datos
            $stmt = $pdo->prepare("SELECT * FROM assets WHERE id = ?");
            $stmt->execute([$id]);
            $existing = $stmt->fetch();
            if (!$existing) {
                http_response_code(404);
                echo json_encode(["error" => "Bien no encontrado para actualizar"]);
                exit;
            }

            // Actualiza la información del registro del bien
            $stmtUpdate = $pdo->prepare("UPDATE assets SET 
                name = ?, description = ?, status = ?, department = ?, photo = ?, 
                brand = ?, model = ?, serialNumber = ?, processor = ?, ram = ?, storage = ?, `condition` = ?
                WHERE id = ?");
            $stmtUpdate->execute([
                $name, $description, $status, $department, $photo,
                $brand, $model, $serialNumber, $processor, $ram, $storage, $condition, $id
            ]);

            // Sincroniza nuevos movimientos históricos si se enviaron en la petición
            if (isset($data['history']) && is_array($data['history'])) {
                foreach ($data['history'] as $h) {
                    $stmtCheck = $pdo->prepare("SELECT id FROM history WHERE id = ?");
                    $stmtCheck->execute([$h['id']]);
                    if (!$stmtCheck->fetch()) {
                        $stmtInsHist = $pdo->prepare("INSERT INTO history (id, asset_id, date, type, user, details) VALUES (?, ?, ?, ?, ?, ?)");
                        $stmtInsHist->execute([
                            $h['id'], $id, $h['date'], $h['type'], $h['user'], $h['details']
                        ]);
                    }
                }
            }

            // Sincroniza nuevos reportes de soporte si se adjuntaron en la petición
            if (isset($data['reports']) && is_array($data['reports'])) {
                foreach ($data['reports'] as $r) {
                    $stmtCheck = $pdo->prepare("SELECT id FROM reports WHERE id = ?");
                    $stmtCheck->execute([$r['id']]);
                    if (!$stmtCheck->fetch()) {
                        $stmtInsRep = $pdo->prepare("INSERT INTO reports (id, asset_id, date, technician, diagnosis, actionTaken, statusBefore, statusAfter) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                        $stmtInsRep->execute([
                            $r['id'], $id, $r['date'], $r['technician'], $r['diagnosis'], $r['actionTaken'], $r['statusBefore'], $r['statusAfter']
                        ]);
                    }
                }
            }

            $responseId = $id;
        } else {
            // Lógica de REGISTRO de un nuevo bien (Inserción)
            // Evita la duplicación del número identificador de Bien Nacional
            $stmtDup = $pdo->prepare("SELECT id FROM assets WHERE LOWER(nroBien) = LOWER(?)");
            $stmtDup->execute([$nroBien]);
            if ($stmtDup->fetch()) {
                http_response_code(409);
                echo json_encode(["error" => "Ya existe un equipo registrado con el NRO de Bien '$nroBien'"]);
                exit;
            }

            // Genera una clave única correlativa para el activo
            $stmtCount = $pdo->query("SELECT COUNT(*) as cnt FROM assets");
            $count = $stmtCount->fetch()['cnt'];
            $newId = "INV-" . date("Y") . "-" . str_pad($count + 1, 3, "0", STR_PAD_LEFT);

            // Inserta el nuevo activo en la base de datos
            $stmtIns = $pdo->prepare("INSERT INTO assets (id, nroBien, name, description, status, department, photo, brand, model, serialNumber, processor, ram, storage, `condition`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmtIns->execute([
                $newId, $nroBien, $name, $description, $status, $department, $photo,
                $brand, $model, $serialNumber, $processor, $ram, $storage, $condition
            ]);

            // Genera y guarda automáticamente la bitácora del registro original
            $histId = "H-" . round(microtime(true) * 1000);
            $histDate = date('c'); // Formato ISO 8601 estándar
            $stmtHist = $pdo->prepare("INSERT INTO history (id, asset_id, date, type, user, details) VALUES (?, ?, ?, ?, ?, ?)");
            $stmtHist->execute([
                $histId, $newId, $histDate, "registro", "Samuel (Soporte)", "Incorporación del bien al inventario general asignado a la $department."
            ]);

            $responseId = $newId;
        }

        // Recupera la estructura del bien recién guardado o actualizado para retornar la respuesta
        $stmtFinal = $pdo->prepare("SELECT * FROM assets WHERE id = ?");
        $stmtFinal->execute([$responseId]);
        $asset = $stmtFinal->fetch();

        $stmtHistFinal = $pdo->prepare("SELECT id, date, type, user, details FROM history WHERE asset_id = ? ORDER BY date DESC");
        $stmtHistFinal->execute([$responseId]);
        $hists = $stmtHistFinal->fetchAll();

        $stmtRepFinal = $pdo->prepare("SELECT id, date, technician, diagnosis, actionTaken, statusBefore, statusAfter FROM reports WHERE asset_id = ? ORDER BY date DESC");
        $stmtRepFinal->execute([$responseId]);
        $reps = $stmtRepFinal->fetchAll();

        echo json_encode([
            "id" => $asset['id'],
            "nroBien" => $asset['nroBien'],
            "name" => $asset['name'],
            "description" => $asset['description'],
            "status" => $asset['status'],
            "condition" => $asset['condition'],
            "department" => $asset['department'],
            "photo" => $asset['photo'],
            "technicalSpecs" => [
                "brand" => $asset['brand'],
                "model" => $asset['model'],
                "serialNumber" => $asset['serialNumber'],
                "processor" => $asset['processor'],
                "ram" => $asset['ram'],
                "storage" => $asset['storage']
            ],
            "history" => $hists,
            "reports" => $reps
        ]);

    } catch (Throwable $e) {
        logDatabaseError("Error guardando bien (crear/actualizar)", $e);
        http_response_code(500);
        echo json_encode(["error" => "Error guardando bien: " . $e->getMessage()]);
    }
}
