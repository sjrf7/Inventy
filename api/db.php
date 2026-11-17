<?php
// Controlador de Base de Datos de Inventy - Motor MySQL de XAMPP

require_once __DIR__ . '/config.php';

/**
 * Registra un error detallado en el archivo de log y en el log del servidor PHP.
 * 
 * @param string $message Mensaje explicativo del contexto del error.
 * @param Throwable|null $e Excepción que causó el error para volcar detalles técnicos.
 */
function logDatabaseError($message, Throwable $e = null) {
    try {
        $logFile = __DIR__ . '/db_errors.log';
        $timestamp = date('Y-m-d H:i:s');
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'CLI/Local';
        $method = $_SERVER['REQUEST_METHOD'] ?? 'N/A';
        $uri = $_SERVER['REQUEST_URI'] ?? 'N/A';
        
        $dbInfo = "Host: " . (defined('MYSQL_HOST') ? MYSQL_HOST : 'localhost') . ":" . (defined('MYSQL_PORT') ? MYSQL_PORT : '3306') . ", BD: " . (defined('MYSQL_DB') ? MYSQL_DB : 'inventy');

        $logEntry = "================================================================================\n";
        $logEntry .= "FECHA/HORA: $timestamp | IP: $ip\n";
        $logEntry .= "PETICIÓN: $method $uri\n";
        $logEntry .= "MOTOR BD: MySQL ($dbInfo)\n";
        $logEntry .= "MENSAJE: $message\n";
        
        if ($e !== null) {
            $logEntry .= "TIPO EXCEPCIÓN: " . get_class($e) . "\n";
            $logEntry .= "DETALLE TÉCNICO: " . $e->getMessage() . "\n";
            $logEntry .= "ARCHIVO: " . $e->getFile() . " en la línea " . $e->getLine() . "\n";
            $logEntry .= "PILA DE EJECUCIÓN (TRACE):\n" . $e->getTraceAsString() . "\n";
        }
        $logEntry .= "================================================================================\n\n";
        
        // Escribe al archivo del log de base de datos de manera segura
        @file_put_contents($logFile, $logEntry, FILE_APPEND);
        
        // También reporta al log estándar del servidor web
        error_log("Inventy DB Error: " . $message . ($e ? " (" . $e->getMessage() . ")" : ""));
    } catch (Throwable $ex) {
        error_log("Error crítico en logger de base de datos: " . $ex->getMessage());
    }
}

/**
 * Retorna un mensaje amigable y accionable en español de acuerdo al error de base de datos MySQL.
 * 
 * @param Throwable $e Excepción de la cual se analiza el error.
 * @return string Mensaje amigable para el usuario.
 */
function getHumanFriendlyDbErrorMessage(Throwable $e) {
    $message = $e->getMessage();
    
    // Error de host no encontrado / conexión rechazada (MySQL apagado)
    if (stripos($message, 'Connection refused') !== false || 
        stripos($message, '2002') !== false || 
        stripos($message, 'Can\'t connect') !== false ||
        stripos($message, 'Unknown MySQL server host') !== false) {
        return "No se pudo conectar al servidor MySQL. Por favor, asegúrate de que el módulo MySQL de XAMPP esté INICIADO en tu panel de control de XAMPP. Si estás en Linux, puedes iniciarlo con 'sudo /opt/lampp/lampp startmysql'.";
    }
    
    // Error de base de datos inexistente (1049)
    if (stripos($message, 'Unknown database') !== false || stripos($message, '1049') !== false) {
        $dbName = defined('MYSQL_DB') ? MYSQL_DB : 'inventy';
        return "La base de datos '$dbName' no existe en tu servidor local. Por favor, abre phpMyAdmin (http://localhost/phpmyadmin) y crea una base de datos vacía llamada '$dbName' para que el sistema pueda autoconfigurarse.";
    }
    
    // Error de autenticación / acceso denegado (1045)
    if (stripos($message, 'Access denied') !== false || stripos($message, '1045') !== false) {
        $user = defined('MYSQL_USER') ? MYSQL_USER : 'root';
        return "Acceso denegado al servidor MySQL para el usuario '$user'. Revisa que las credenciales configuradas en el archivo 'api/config.php' coincidan con los accesos definidos en tu panel de base de datos de XAMPP.";
    }
    
    return "Ocurrió un error al interactuar con MySQL: " . $message;
}

/**
 * Obtiene la conexión activa a la base de datos MySQL (PDO).
 * Inicializa automáticamente el esquema y los datos semilla si la base de datos está vacía.
 */
function getDB() {
    try {
        $dsn = "mysql:host=" . MYSQL_HOST . ";port=" . MYSQL_PORT . ";dbname=" . MYSQL_DB . ";charset=utf8mb4";
        $pdo = new PDO($dsn, MYSQL_USER, MYSQL_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        
        // Crea las tablas y siembra datos iniciales de prueba si la base de datos MySQL está recién creada
        $stmt = $pdo->query("SHOW TABLES LIKE 'assets'");
        if ($stmt->rowCount() === 0) {
            createSchema($pdo);
            seedDatabase($pdo);
        }
        migrateDatabase($pdo);
        return $pdo;
    } catch (Throwable $e) {
        $friendlyMessage = getHumanFriendlyDbErrorMessage($e);
        logDatabaseError("Error de inicialización o conexión de base de datos MySQL", $e);
        
        header('Content-Type: application/json', true, 500);
        echo json_encode([
            "error" => $friendlyMessage,
            "technical_error" => $e->getMessage()
        ]);
        exit;
    }
}

function createSchema($pdo) {
    $timeType = 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP';
    
    // Creación de la tabla de activos (bienes nacionales)
    $pdo->exec("CREATE TABLE IF NOT EXISTS assets (
        id VARCHAR(50) NOT NULL,
        nroBien VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL,
        department VARCHAR(255) NOT NULL,
        photo LONGTEXT,
        brand VARCHAR(100),
        model VARCHAR(100),
        serialNumber VARCHAR(100),
        processor VARCHAR(100),
        ram VARCHAR(50),
        storage VARCHAR(50),
        `condition` VARCHAR(50) NOT NULL DEFAULT 'bueno',
        created_at $timeType,
        PRIMARY KEY (id),
        UNIQUE (nroBien)
    )");

    // Creación de la tabla de historial de movimientos y traspasos
    $pdo->exec("CREATE TABLE IF NOT EXISTS history (
        id VARCHAR(50) NOT NULL,
        asset_id VARCHAR(50) NOT NULL,
        date VARCHAR(50) NOT NULL,
        type VARCHAR(50) NOT NULL,
        user VARCHAR(255) NOT NULL,
        details TEXT NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
    )");

    // Creación de la tabla de reportes de soporte técnico
    $pdo->exec("CREATE TABLE IF NOT EXISTS reports (
        id VARCHAR(50) NOT NULL,
        asset_id VARCHAR(50) NOT NULL,
        date VARCHAR(50) NOT NULL,
        technician VARCHAR(255) NOT NULL,
        diagnosis TEXT NOT NULL,
        actionTaken TEXT NOT NULL,
        statusBefore VARCHAR(50) NOT NULL,
        statusAfter VARCHAR(50) NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
    )");

    // Creación de la tabla de usuarios autorizados
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) NOT NULL,
        username VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        fullname VARCHAR(255),
        role VARCHAR(50),
        created_at $timeType,
        PRIMARY KEY (id),
        UNIQUE (username)
    )");

    // Agrega índices para optimizar búsquedas en MySQL
    try {
        @$pdo->exec("CREATE INDEX idx_assets_name ON assets (name)");
        @$pdo->exec("CREATE INDEX idx_assets_status ON assets (status)");
        @$pdo->exec("CREATE INDEX idx_assets_department ON assets (department)");
        @$pdo->exec("CREATE INDEX idx_history_asset_id ON history (asset_id)");
        @$pdo->exec("CREATE INDEX idx_reports_asset_id ON reports (asset_id)");
        @$pdo->exec("CREATE INDEX idx_users_username ON users (username)");
    } catch (Exception $e) {
        // Los índices pueden ya existir
    }
}

function seedDatabase($pdo) {
    // SVGs representativos embebidos como marcadores de posición visuales de los equipos
    $laptop_svg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="16" fill="url(%23grad-laptop)"/><defs><linearGradient id="grad-laptop" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%231E293B"/><stop offset="100%" stop-color="%230F172A"/></linearGradient><linearGradient id="glow-laptop" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%236366F1"/><stop offset="100%" stop-color="%234F46E5"/></linearGradient></defs><rect x="25" y="30" width="50" height="32" rx="3" fill="%231E293B" stroke="url(%23glow-laptop)" stroke-width="2"/><path d="M15 65h70v4a2 2 0 0 1-2 2H17a2 2 0 0 1-2-2v-4Z" fill="%23334155"/><rect x="42" y="66" width="16" height="3" rx="1.5" fill="%231E293B"/></svg>';
    $desktop_svg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="16" fill="url(%23grad-desktop)"/><defs><linearGradient id="grad-desktop" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%231E293B"/><stop offset="100%" stop-color="%230F172A"/></linearGradient><linearGradient id="glow-desktop" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%23F43F5E"/><stop offset="100%" stop-color="%23E11D48"/></linearGradient></defs><rect x="20" y="20" width="60" height="40" rx="4" fill="%231E293B" stroke="url(%23glow-desktop)" stroke-width="2"/><path d="M44 60h12v12H44z" fill="%23334155"/><rect x="35" y="72" width="30" height="4" rx="2" fill="%23475569"/></svg>';
    $server_svg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="16" fill="url(%23grad-server)"/><defs><linearGradient id="grad-server" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%231E293B"/><stop offset="100%" stop-color="%230F172A"/></linearGradient><linearGradient id="glow-server" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%2310B981"/><stop offset="100%" stop-color="%23059669"/></linearGradient></defs><rect x="20" y="22" width="60" height="16" rx="2" fill="%231E293B" stroke="url(%23glow-server)" stroke-width="2"/><circle cx="28" cy="30" r="1.5" fill="%2310B981"/><line x1="36" y1="30" x2="68" y2="30" stroke="%23475569" stroke-width="2"/><rect x="20" y="42" width="60" height="16" rx="2" fill="%231E293B" stroke="url(%23glow-server)" stroke-width="2"/><circle cx="28" cy="50" r="1.5" fill="%2310B981"/><line x1="36" y1="50" x2="68" y2="50" stroke="%23475569" stroke-width="2"/><rect x="20" y="62" width="60" height="16" rx="2" fill="%231E293B" stroke="url(%23glow-server)" stroke-width="2"/><circle cx="28" cy="70" r="1.5" fill="%23EF4444"/><line x1="36" y1="70" x2="68" y2="70" stroke="%23475569" stroke-width="2"/></svg>';
    $printer_svg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="16" fill="url(%23grad-printer)"/><defs><linearGradient id="grad-printer" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%231E293B"/><stop offset="100%" stop-color="%230F172A"/></linearGradient><linearGradient id="glow-printer" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%23F59E0B"/><stop offset="100%" stop-color="%23D97706"/></linearGradient></defs><rect x="24" y="38" width="52" height="26" rx="2" fill="%231E293B" stroke="url(%23glow-printer)" stroke-width="2"/><path d="M32 38V22h36v16H32Z" fill="%23334155"/><path d="M30 64v14h40V64H30Z" fill="%23475569"/><rect x="36" y="68" width="28" height="2" rx="1" fill="%23E2E8F0"/></svg>';
    $tablet_svg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="16" fill="url(%23grad-tablet)"/><defs><linearGradient id="grad-tablet" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%231E293B"/><stop offset="100%" stop-color="%230F172A"/></linearGradient><linearGradient id="glow-tablet" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%23EC4899"/><stop offset="100%" stop-color="%23DB2777"/></linearGradient></defs><rect x="22" y="16" width="56" height="68" rx="6" fill="%231E293B" stroke="url(%23glow-tablet)" stroke-width="2"/><circle cx="50" cy="78" r="2.5" fill="%23475569"/><circle cx="50" cy="22" r="1" fill="%23475569"/></svg>';
    $network_svg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="16" fill="url(%23grad-network)"/><defs><linearGradient id="grad-network" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%231E293B"/><stop offset="100%" stop-color="%230F172A"/></linearGradient><linearGradient id="glow-network" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%2306B6D4"/><stop offset="100%" stop-color="%230891B2"/></linearGradient></defs><rect x="18" y="38" width="64" height="24" rx="3" fill="%23334155" stroke="url(%23glow-network)" stroke-width="2"/><circle cx="26" cy="50" r="2" fill="%2310B981"/><circle cx="32" cy="50" r="2" fill="%2310B981"/><rect x="40" y="46" width="6" height="8" rx="1" fill="%231E293B" stroke="%23475569" stroke-width="1"/><rect x="49" y="46" width="6" height="8" rx="1" fill="%231E293B" stroke="%23475569" stroke-width="1"/><rect x="58" y="46" width="6" height="8" rx="1" fill="%231E293B" stroke="%23475569" stroke-width="1"/><rect x="67" y="46" width="6" height="8" rx="1" fill="%231E293B" stroke="%23475569" stroke-width="1"/><circle cx="77" cy="50" r="1.5" fill="%2360A5FA"/></svg>';

    $assets = [
        [
            "id" => "INV-2026-001",
            "nroBien" => "BIEN-002849",
            "name" => "iMac 24\" M3 Retina",
            "description" => "Computador de escritorio premium todo-en-uno, utilizado por el diseñador institucional para material gráfico y de prensa.",
            "status" => "activo",
            "department" => "Relaciones Interinstitucionales",
            "photo" => $desktop_svg,
            "brand" => "Apple",
            "model" => "iMac 24 M3 (2024)",
            "serialNumber" => "C02FK982Q05D",
            "processor" => "Apple M3 8-núcleos (CPU/GPU)",
            "ram" => "16 GB Memoria Unificada",
            "storage" => "512 GB SSD PCIe"
        ],
        [
            "id" => "INV-2026-002",
            "nroBien" => "BIEN-004829",
            "name" => "Laptop Dell Latitude 5420",
            "description" => "Computadora portátil corporativa asignada al equipo de desarrollo y soporte de sistemas internos.",
            "status" => "activo",
            "department" => "Centralizada",
            "photo" => $laptop_svg,
            "brand" => "Dell",
            "model" => "Latitude 5420",
            "serialNumber" => "5HG89B2",
            "processor" => "Intel Core i5-1145G7 @ 2.60GHz",
            "ram" => "16 GB DDR4 (Expandido)",
            "storage" => "512 GB NVMe Class 40 SSD"
        ],
        [
            "id" => "INV-2026-003",
            "nroBien" => "BIEN-009104",
            "name" => "Servidor Dell PowerEdge R750",
            "description" => "Servidor de base de datos local e integraciones. Actualmente con problemas térmicos en el módulo de ventilación secundario.",
            "status" => "reparacion",
            "department" => "Centralizada",
            "photo" => $server_svg,
            "brand" => "Dell",
            "model" => "PowerEdge R750 Rack Server",
            "serialNumber" => "DELL-R750-88X29",
            "processor" => "Dual Intel Xeon Silver 4314 (32 núcleos totales)",
            "ram" => "64 GB DDR4 ECC Reg",
            "storage" => "4x 1.2TB SAS HDD HW RAID-5"
        ],
        [
            "id" => "INV-2026-004",
            "nroBien" => "BIEN-003312",
            "name" => "Impresora Multifuncional HP LaserJet Pro",
            "description" => "Impresora departamental de alto tráfico. Presenta atascamiento persistente en la bandeja de salida trasera.",
            "status" => "reparacion",
            "department" => "Administración",
            "photo" => $printer_svg,
            "brand" => "HP",
            "model" => "LaserJet Pro M428fdw",
            "serialNumber" => "CNB8M9093L",
            "processor" => "1200 MHz Integrado",
            "ram" => "512 MB",
            "storage" => "No Aplica"
        ],
        [
            "id" => "INV-2026-005",
            "nroBien" => "BIEN-007740",
            "name" => "iPad Air 10.9\" (M1)",
            "description" => "Dispositivo móvil táctil utilizado por el Director General para revisiones de documentos de firmas digitales en reuniones ejecutivas.",
            "status" => "activo",
            "department" => "Dirección de Despacho",
            "photo" => $tablet_svg,
            "brand" => "Apple",
            "model" => "iPad Air (5ta Generación)",
            "serialNumber" => "DMPYG9K117PM",
            "processor" => "Apple M1 8-core",
            "ram" => "8 GB RAM",
            "storage" => "256 GB NVMe"
        ],
        [
            "id" => "INV-2026-006",
            "nroBien" => "BIEN-010534",
            "name" => "Switch Cisco Catalyst 9200L",
            "description" => "Switch de comunicaciones principal del ala C. Inoperativo luego de fuerte sobretensión eléctrica por tormenta local.",
            "status" => "desincorporado",
            "department" => "Centralizada",
            "photo" => $network_svg,
            "brand" => "Cisco Systems",
            "model" => "Catalyst 9200L 48p PoE+",
            "serialNumber" => "FDO2532E20Y",
            "processor" => "ARM Quad-Core @ 1.4GHz",
            "ram" => "4 GB DDR3",
            "storage" => "4 GB Flash"
        ]
    ];

    $history = [
        ["id" => "H1", "asset_id" => "INV-2026-001", "date" => "2026-01-15T09:00:00Z", "type" => "registro", "user" => "Samuel - Administrador", "details" => "Ingreso al inventario general y etiquetado con NRO de Bien BIEN-002849."],
        ["id" => "H2", "asset_id" => "INV-2026-001", "date" => "2026-01-15T10:30:00Z", "type" => "traspaso", "user" => "Samuel - Administrador", "details" => "Asignación inicial a Relaciones Interinstitucionales para la jefatura de prensa."],
        ["id" => "H3", "asset_id" => "INV-2026-002", "date" => "2026-02-10T08:15:00Z", "type" => "registro", "user" => "Marta R. - Inventarios", "details" => "Registro e incorporación al inventario tecnológico nacional."],
        ["id" => "H4", "asset_id" => "INV-2026-002", "date" => "2026-03-05T14:00:00Z", "type" => "mantenimiento", "user" => "Soporte Técnico - Carlos", "details" => "Instalación de suite de desarrollo y ampliación de RAM de 8GB a 16GB."],
        ["id" => "H5", "asset_id" => "INV-2026-003", "date" => "2026-03-20T10:00:00Z", "type" => "registro", "user" => "Samuel - Administrador", "details" => "Instalación física en Rack 02 del Data Center Principal."],
        ["id" => "H6", "asset_id" => "INV-2026-003", "date" => "2026-07-28T16:30:00Z", "type" => "cambio_estado", "user" => "Monitoreo Data Center", "details" => "Alarma por altas temperaturas (78°C) en Procesador 2. Se apaga de emergencia y se traslada a laboratorio técnico."],
        ["id" => "H7", "asset_id" => "INV-2026-004", "date" => "2026-01-20T08:00:00Z", "type" => "registro", "user" => "Marta R. - Inventarios", "details" => "Ingreso e instalación en el pasillo principal del área de Administración."],
        ["id" => "H8", "asset_id" => "INV-2026-004", "date" => "2026-07-30T11:20:00Z", "type" => "cambio_estado", "user" => "Administrador - Soporte", "details" => "Reporte recurrente de atoramiento de papel. Se pasa a estado 'En Reparación' tras evaluar desgaste físico de los rodillos."],
        ["id" => "H9", "asset_id" => "INV-2026-005", "date" => "2026-02-15T09:10:00Z", "type" => "registro", "user" => "Samuel - Administrador", "details" => "Incorporación al almacén central de tecnología."],
        ["id" => "H10", "asset_id" => "INV-2026-005", "date" => "2026-03-01T11:00:00Z", "type" => "traspaso", "user" => "Samuel - Administrador", "details" => "Traspaso aprobado de Centralizada a la Dirección de Despacho para uso directo de Presidencia."],
        ["id" => "H11", "asset_id" => "INV-2026-006", "date" => "2026-04-12T10:00:00Z", "type" => "registro", "user" => "Tecnología Redes", "details" => "Instalación en Rack de Enlaces de Comunicaciones."],
        ["id" => "H12", "asset_id" => "INV-2026-006", "date" => "2026-07-26T21:00:00Z", "type" => "cambio_estado", "user" => "Soporte Técnico - Samuel", "details" => "Falla de red completa en el ala C. El equipo no enciende y emite olor a componente quemado. Se retira para evaluación."],
        ["id" => "H13", "asset_id" => "INV-2026-006", "date" => "2026-07-27T10:00:00Z", "type" => "desincorporacion", "user" => "Samuel - Director Tecnología", "details" => "Se declara pérdida total debido a daño severo en la tarjeta lógica principal. Se procede a la desincorporación física del inventario nacional."]
    ];

    $reports = [
        [
            "id" => "REP-001",
            "asset_id" => "INV-2026-002",
            "date" => "2026-03-05T13:45:00Z",
            "technician" => "Carlos J. - Soporte Técnico",
            "diagnosis" => "Usuario requiere mayor capacidad para virtualización ligera de pruebas.",
            "actionTaken" => "Se instala módulo adicional de 8GB RAM DDR4 3200MHz. Se corren pruebas de diagnóstico e integraciones con éxito.",
            "statusBefore" => "activo",
            "statusAfter" => "activo"
        ],
        [
            "id" => "REP-002",
            "asset_id" => "INV-2026-003",
            "date" => "2026-07-29T10:00:00Z",
            "technician" => "Samuel - Jefe de Soporte",
            "diagnosis" => "Falla de rodamiento en el extractor 3 del banco de ventiladores principal, provocando caída del flujo de aire y recalentamiento del CPU2.",
            "actionTaken" => "Limpieza interna profunda de disipadores. Se gestiona la compra del repuesto de ventilador hot-swap Dell R750.",
            "statusBefore" => "activo",
            "statusAfter" => "reparacion"
        ],
        [
            "id" => "REP-003",
            "asset_id" => "INV-2026-004",
            "date" => "2026-07-30T14:00:00Z",
            "technician" => "Andrés F. - Técnico Impresión",
            "diagnosis" => "Engranaje de arrastre de la bandeja de duplex dañado y rodillo de presión desgastado por uso excesivo.",
            "actionTaken" => "Se desarma unidad de fusión. Se determinó la necesidad de reemplazar el kit de rodillos de alimentación (Feed Roller Kit) y el piñón duplex. Se ingresó solicitud de compra de repuestos.",
            "statusBefore" => "reparacion",
            "statusAfter" => "reparacion"
        ],
        [
            "id" => "REP-004",
            "asset_id" => "INV-2026-006",
            "date" => "2026-07-27T09:30:00Z",
            "technician" => "Samuel - Especialista de Redes",
            "diagnosis" => "Cortocircuito masivo en fuente de poder integrada y quemado de múltiples transistores en la placa madre tras impacto de descarga eléctrica en la línea de datos. Inviable económicamente para reparación.",
            "actionTaken" => "Diagnóstico final emitido. Se firma el acta de desincorporación y se retira el número de bien nacional BIEN-010534.",
            "statusBefore" => "reparacion",
            "statusAfter" => "desincorporado"
        ]
    ];

    // Inserta los activos iniciales en lote
    $stmt = $pdo->prepare("INSERT INTO assets (id, nroBien, name, description, status, department, photo, brand, model, serialNumber, processor, ram, storage, `condition`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($assets as $a) {
        $stmt->execute([
            $a["id"], $a["nroBien"], $a["name"], $a["description"], $a["status"], $a["department"], $a["photo"],
            $a["brand"], $a["model"], $a["serialNumber"], $a["processor"], $a["ram"], $a["storage"], $a["condition"] ?? "bueno"
        ]);
    }

    // Inserta el historial inicial de movimientos
    $stmtHist = $pdo->prepare("INSERT INTO history (id, asset_id, date, type, user, details) VALUES (?, ?, ?, ?, ?, ?)");
    foreach ($history as $h) {
        $stmtHist->execute([
            $h["id"], $h["asset_id"], $h["date"], $h["type"], $h["user"], $h["details"]
        ]);
    }

    // Inserta los reportes técnicos iniciales de soporte
    $stmtRep = $pdo->prepare("INSERT INTO reports (id, asset_id, date, technician, diagnosis, actionTaken, statusBefore, statusAfter) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($reports as $r) {
        $stmtRep->execute([
            $r["id"], $r["asset_id"], $r["date"], $r["technician"], $r["diagnosis"], $r["actionTaken"], $r["statusBefore"], $r["statusAfter"]
        ]);
    }

    // Inserta el usuario administrador por defecto
    $stmtUser = $pdo->prepare("INSERT INTO users (id, username, password, fullname, role) VALUES (?, ?, ?, ?, ?)");
    $stmtUser->execute([
        "U1",
        "admin",
        password_hash("admin", PASSWORD_DEFAULT),
        "Samuel",
        "Soporte TI"
    ]);
}

/**
 * Crea la tabla del calendario de mantenimientos preventivos y correctivos.
 * Se mantiene separada de `reports` porque el calendario planifica trabajo
 * futuro, mientras que los informes registran intervenciones ya realizadas.
 *
 * @param PDO $pdo
 */
function ensureMaintenanceTable($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS maintenance_events (
        id VARCHAR(50) NOT NULL,
        asset_id VARCHAR(50) DEFAULT NULL,
        asset_name VARCHAR(255) DEFAULT NULL,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'preventivo',
        status VARCHAR(20) NOT NULL DEFAULT 'programado',
        `date` DATE NOT NULL,
        `time` VARCHAR(10) DEFAULT NULL,
        technician VARCHAR(255) DEFAULT NULL,
        department VARCHAR(255) DEFAULT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_maintenance_date (`date`),
        INDEX idx_maintenance_type (type),
        INDEX idx_maintenance_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

/**
 * Siembra un cronograma de ejemplo para 2026. Solo se ejecuta cuando la tabla
 * se acaba de crear, de modo que borrar eventos no los vuelve a insertar.
 *
 * @param PDO $pdo
 */
function seedMaintenanceEvents($pdo) {
    $today = date('Y-m-d');

    $assets = [];
    try {
        $assets = $pdo->query("SELECT id, name, department FROM assets")->fetchAll();
    } catch (Throwable $e) {
        // Sin inventario se siembran eventos genéricos, igualmente útiles.
    }

    $assetsById = [];
    foreach ($assets as $asset) {
        $assetsById[$asset['id']] = $asset;
    }

    $statusForDate = function ($date) use ($today) {
        if ($date < $today) return 'completado';
        if ($date === $today) return 'en_proceso';
        return 'programado';
    };

    $rows = [];
    $counter = 0;

    $push = function ($date, $time, $title, $type, $status, $assetId, $technician, $details, $departmentFallback = '') use (&$rows, &$counter, $assetsById) {
        $counter++;
        $asset = ($assetId !== null && isset($assetsById[$assetId])) ? $assetsById[$assetId] : null;

        $rows[] = [
            'id' => sprintf('MNT-%s-%03d', substr($date, 0, 4), $counter),
            'asset_id' => $asset ? $asset['id'] : ($assetId ?: null),
            'asset_name' => $asset ? $asset['name'] : null,
            'title' => $title,
            'type' => $type,
            'status' => $status,
            'date' => $date,
            'time' => $time,
            'technician' => $technician,
            'department' => $asset ? $asset['department'] : $departmentFallback,
            'details' => $details,
        ];
    };

    // Preventivo mensual de la impresora departamental: todos los días 8.
    for ($month = 1; $month <= 12; $month++) {
        $date = sprintf('2026-%02d-08', $month);
        $push(
            $date,
            '09:00',
            'Mantenimiento preventivo de la impresora LaserJet',
            'preventivo',
            $statusForDate($date),
            'INV-2026-004',
            'Carlos J. - Soporte Técnico',
            'Limpieza de rodillos y bandejas, revisión del tóner y prueba de impresión.',
            'Administración'
        );
    }

    // Preventivo trimestral del servidor: enero, abril, julio y octubre.
    foreach ([1, 4, 7, 10] as $month) {
        $date = sprintf('2026-%02d-15', $month);
        $push(
            $date,
            '22:00',
            'Mantenimiento preventivo trimestral del servidor',
            'preventivo',
            $statusForDate($date),
            'INV-2026-003',
            'Samuel - Jefe de Soporte',
            'Limpieza de ventiladores, revisión SMART de discos y actualización de firmware.',
            'Centralizada'
        );
    }

    // Revisión de batería del portátil: tres controles al año.
    foreach ([2, 6, 10] as $month) {
        $date = sprintf('2026-%02d-20', $month);
        $push(
            $date,
            '11:00',
            'Revisión preventiva de la batería del portátil',
            'preventivo',
            $statusForDate($date),
            'INV-2026-002',
            'Marta R. - Inventarios',
            'Medición de ciclos de carga, calibración y revisión del cargador.',
            'Centralizada'
        );
    }

    // Intervenciones correctivas puntuales.
    $push('2026-05-12', '14:30', 'Sustitución de la fuente de poder del iMac', 'correctivo', 'completado', 'INV-2026-001', 'Carlos J. - Soporte Técnico', 'Apagados repentinos. Se reemplaza la fuente interna y se validan temperaturas.', 'Relaciones Interinstitucionales');
    $push('2026-07-28', '16:30', 'Reemplazo del ventilador hot-swap del servidor', 'correctivo', 'completado', 'INV-2026-003', 'Samuel - Jefe de Soporte', 'Alarma térmica en el CPU 2. Se sustituye el extractor 3 y se estabiliza el flujo de aire.', 'Centralizada');
    $push('2026-07-30', '11:20', 'Desatasco y cambio de rodillos de la impresora', 'correctivo', 'completado', 'INV-2026-004', 'Carlos J. - Soporte Técnico', 'Atascos recurrentes en la bandeja trasera por desgaste de rodillos.', 'Administración');
    $push('2026-08-05', '09:00', 'Diagnóstico del switch Cisco del ala C', 'correctivo', 'cancelado', 'INV-2026-006', 'Samuel - Jefe de Soporte', 'Equipo declarado pérdida total por sobretensión; se cancela la reparación y se gestiona reemplazo.', 'Centralizada');
    $push('2026-09-03', '10:00', 'Cambio de batería del iPad Air', 'correctivo', 'completado', 'INV-2026-005', 'Carlos J. - Soporte Técnico', 'Autonomía reducida a menos de dos horas. Se instala batería de reemplazo.', 'Dirección de Despacho');
    $push('2026-11-24', '15:00', 'Reemplazo del cargador del iPad Air', 'correctivo', 'programado', 'INV-2026-005', 'Carlos J. - Soporte Técnico', 'Cargador con contacto intermitente reportado por la Dirección de Despacho.', 'Dirección de Despacho');
    $push('2026-12-02', '14:00', 'Sustitución preventiva de rodillos de la impresora', 'correctivo', 'programado', 'INV-2026-004', 'Carlos J. - Soporte Técnico', 'Cambio programado antes del cierre de año para evitar atascos.', 'Administración');

    // Jornada de hoy: queda en proceso para demostrar el estado intermedio.
    $push('2026-11-16', '10:00', 'Revisión preventiva de la batería del portátil', 'preventivo', 'en_proceso', 'INV-2026-002', 'Samuel - Jefe de Soporte', 'Diagnóstico de autonomía y calibración del controlador de carga.', 'Centralizada');

    // Cierre anual sin equipo asociado.
    $push('2026-12-18', '10:00', 'Revisión de cierre anual y etiquetado del inventario tecnológico', 'preventivo', 'programado', null, 'Marta R. - Inventarios', 'Verificación física de etiquetas, ubicaciones y estado general de los equipos.', 'Centralizada');

    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("INSERT IGNORE INTO maintenance_events
            (id, asset_id, asset_name, title, type, status, `date`, `time`, technician, department, details)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        foreach ($rows as $row) {
            $stmt->execute([
                $row['id'],
                $row['asset_id'],
                $row['asset_name'],
                $row['title'],
                $row['type'],
                $row['status'],
                $row['date'],
                $row['time'],
                $row['technician'],
                $row['department'],
                $row['details'],
            ]);
        }

        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        logDatabaseError("Error sembrando el calendario de mantenimientos", $e);
    }
}

function migrateDatabase($pdo) {
    // 1. Verifica y añade la columna 'condition' si no existe (Migración en vivo para activos antiguos)
    try {
        $pdo->query("SELECT `condition` FROM assets LIMIT 1");
    } catch (Exception $e) {
        $pdo->exec("ALTER TABLE assets ADD COLUMN `condition` VARCHAR(50) NOT NULL DEFAULT 'bueno'");
    }

    // 2. Verifica y crea la tabla 'users' junto con el usuario admin si no existía previamente
    try {
        $pdo->query("SELECT 1 FROM users LIMIT 1");
    } catch (Exception $e) {
        $timeType = 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP';
        
        $pdo->exec("CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(50) NOT NULL,
            username VARCHAR(100) NOT NULL,
            password VARCHAR(255) NOT NULL,
            fullname VARCHAR(255),
            role VARCHAR(50),
            created_at $timeType,
            PRIMARY KEY (id),
            UNIQUE (username)
        )");

        try {
            $pdo->exec("CREATE INDEX idx_users_username ON users (username)");
        } catch (Exception $ex) {}

        // Siembra de inmediato las credenciales del primer usuario administrador
        $stmtUser = $pdo->prepare("INSERT INTO users (id, username, password, fullname, role) VALUES (?, ?, ?, ?, ?)");
        $stmtUser->execute([
            "U1",
            "admin",
            password_hash("admin", PASSWORD_DEFAULT),
            "Samuel",
            "Soporte TI"
        ]);
    }

    // 3. Crea y siembra el calendario de mantenimientos solo la primera vez.
    //    Así, si el usuario borra todos los eventos, no reaparecen.
    $maintenanceExists = true;
    try {
        $pdo->query("SELECT 1 FROM maintenance_events LIMIT 1");
    } catch (Exception $e) {
        $maintenanceExists = false;
    }

    if (!$maintenanceExists) {
        ensureMaintenanceTable($pdo);
        seedMaintenanceEvents($pdo);
    }
}
