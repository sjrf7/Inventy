-- Base de Datos Inventy - Esquema Optimizado y Normalizado
-- Diseñado para MySQL/MariaDB en XAMPP (Compatible también con SQLite)

CREATE DATABASE IF NOT EXISTS `inventy` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `inventy`;

-- --------------------------------------------------------
-- 1. Tabla de Bienes (Assets)
-- Contiene la información principal y especificaciones de los equipos.
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `assets` (
  `id` VARCHAR(50) NOT NULL,
  `nroBien` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL,
  `condition` VARCHAR(50) NOT NULL DEFAULT 'bueno',
  `department` VARCHAR(255) NOT NULL,
  `photo` LONGTEXT DEFAULT NULL,
  `brand` VARCHAR(100) DEFAULT NULL,
  `model` VARCHAR(100) DEFAULT NULL,
  `serialNumber` VARCHAR(100) DEFAULT NULL,
  `processor` VARCHAR(100) DEFAULT NULL,
  `ram` VARCHAR(50) DEFAULT NULL,
  `storage` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_nro_bien` (`nroBien`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices optimizados para búsquedas rápidas y filtros comunes
CREATE INDEX `idx_assets_name` ON `assets` (`name`);
CREATE INDEX `idx_assets_status` ON `assets` (`status`);
CREATE INDEX `idx_assets_department` ON `assets` (`department`);

-- --------------------------------------------------------
-- 2. Tabla de Historial (History)
-- Registra los movimientos, asignaciones y cambios de oficina de cada bien.
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `history` (
  `id` VARCHAR(50) NOT NULL,
  `asset_id` VARCHAR(50) NOT NULL,
  `date` VARCHAR(50) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `user` VARCHAR(255) NOT NULL,
  `details` TEXT NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_history_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índice para acelerar el cargado de la ficha e historial del equipo
CREATE INDEX `idx_history_asset_id` ON `history` (`asset_id`);

-- --------------------------------------------------------
-- 3. Tabla de Informes de Soporte Técnico (Reports)
-- Contiene las revisiones técnicas, diagnósticos y acciones de mantenimiento.
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reports` (
  `id` VARCHAR(50) NOT NULL,
  `asset_id` VARCHAR(50) NOT NULL,
  `date` VARCHAR(50) NOT NULL,
  `technician` VARCHAR(255) NOT NULL,
  `diagnosis` TEXT NOT NULL,
  `actionTaken` TEXT NOT NULL,
  `statusBefore` VARCHAR(50) NOT NULL,
  `statusAfter` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_reports_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índice para acelerar el listado de diagnósticos
CREATE INDEX `idx_reports_asset_id` ON `reports` (`asset_id`);

-- --------------------------------------------------------
-- 4. Tabla de Usuarios (Users)
-- Contiene las credenciales de acceso para el personal autorizado.
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(50) NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `fullname` VARCHAR(255) DEFAULT NULL,
  `role` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_users_username` ON `users` (`username`);


-- ========================================================
-- INSERCIÓN DE DATOS DE SEMILLA (Seed Data)
-- ========================================================

-- Variables temporales de imágenes base64 para los inserts
SET @desktop_svg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="16" fill="url(%23grad-desktop)"/><defs><linearGradient id="grad-desktop" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%231E293B"/><stop offset="100%" stop-color="%230F172A"/></linearGradient><linearGradient id="glow-desktop" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%23F43F5E"/><stop offset="100%" stop-color="%23E11D48"/></linearGradient></defs><rect x="20" y="20" width="60" height="40" rx="4" fill="%231E293B" stroke="url(%23glow-desktop)" stroke-width="2"/><path d="M44 60h12v12H44z" fill="%23334155"/><rect x="35" y="72" width="30" height="4" rx="2" fill="%23475569"/></svg>';
SET @laptop_svg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="16" fill="url(%23grad-laptop)"/><defs><linearGradient id="grad-laptop" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%231E293B"/><stop offset="100%" stop-color="%230F172A"/></linearGradient><linearGradient id="glow-laptop" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%236366F1"/><stop offset="100%" stop-color="%234F46E5"/></linearGradient></defs><rect x="25" y="30" width="50" height="32" rx="3" fill="%231E293B" stroke="url(%23glow-laptop)" stroke-width="2"/><path d="M15 65h70v4a2 2 0 0 1-2 2H17a2 2 0 0 1-2-2v-4Z" fill="%23334155"/><rect x="42" y="66" width="16" height="3" rx="1.5" fill="%231E293B"/></svg>';
SET @server_svg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="16" fill="url(%23grad-server)"/><defs><linearGradient id="grad-server" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%231E293B"/><stop offset="100%" stop-color="%230F172A"/></linearGradient><linearGradient id="glow-server" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%2310B981"/><stop offset="100%" stop-color="%23059669"/></linearGradient></defs><rect x="20" y="22" width="60" height="16" rx="2" fill="%231E293B" stroke="url(%23glow-server)" stroke-width="2"/><circle cx="28" cy="30" r="1.5" fill="%2310B981"/><line x1="36" y1="30" x2="68" y2="30" stroke="%23475569" stroke-width="2"/><rect x="20" y="42" width="60" height="16" rx="2" fill="%231E293B" stroke="url(%23glow-server)" stroke-width="2"/><circle cx="28" cy="50" r="1.5" fill="%2310B981"/><line x1="36" y1="50" x2="68" y2="50" stroke="%23475569" stroke-width="2"/><rect x="20" y="62" width="60" height="16" rx="2" fill="%231E293B" stroke="url(%23glow-server)" stroke-width="2"/><circle cx="28" cy="70" r="1.5" fill="%23EF4444"/><line x1="36" y1="70" x2="68" y2="70" stroke="%23475569" stroke-width="2"/></svg>';
SET @printer_svg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="16" fill="url(%23grad-printer)"/><defs><linearGradient id="grad-printer" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%231E293B"/><stop offset="100%" stop-color="%230F172A"/></linearGradient><linearGradient id="glow-printer" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%23F59E0B"/><stop offset="100%" stop-color="%23D97706"/></linearGradient></defs><rect x="24" y="38" width="52" height="26" rx="2" fill="%231E293B" stroke="url(%23glow-printer)" stroke-width="2"/><path d="M32 38V22h36v16H32Z" fill="%23334155"/><path d="M30 64v14h40V64H30Z" fill="%23475569"/><rect x="36" y="68" width="28" height="2" rx="1" fill="%23E2E8F0"/></svg>';
SET @tablet_svg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="16" fill="url(%23grad-tablet)"/><defs><linearGradient id="grad-tablet" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%231E293B"/><stop offset="100%" stop-color="%230F172A"/></linearGradient><linearGradient id="glow-tablet" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%23EC4899"/><stop offset="100%" stop-color="%23DB2777"/></linearGradient></defs><rect x="22" y="16" width="56" height="68" rx="6" fill="%231E293B" stroke="url(%23glow-tablet)" stroke-width="2"/><circle cx="50" cy="78" r="2.5" fill="%23475569"/><circle cx="50" cy="22" r="1" fill="%23475569"/></svg>';
SET @network_svg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="16" fill="url(%23grad-network)"/><defs><linearGradient id="grad-network" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%231E293B"/><stop offset="100%" stop-color="%230F172A"/></linearGradient><linearGradient id="glow-network" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%2306B6D4"/><stop offset="100%" stop-color="%230891B2"/></linearGradient></defs><rect x="18" y="38" width="64" height="24" rx="3" fill="%23334155" stroke="url(%23glow-network)" stroke-width="2"/><circle cx="26" cy="50" r="2" fill="%2310B981"/><circle cx="32" cy="50" r="2" fill="%2310B981"/><rect x="40" y="46" width="6" height="8" rx="1" fill="%231E293B" stroke="%23475569" stroke-width="1"/><rect x="49" y="46" width="6" height="8" rx="1" fill="%231E293B" stroke="%23475569" stroke-width="1"/><rect x="58" y="46" width="6" height="8" rx="1" fill="%231E293B" stroke="%23475569" stroke-width="1"/><rect x="67" y="46" width="6" height="8" rx="1" fill="%231E293B" stroke="%23475569" stroke-width="1"/><circle cx="77" cy="50" r="1.5" fill="%2360A5FA"/></svg>';

-- Insertar Bienes
INSERT INTO `assets` (`id`, `nroBien`, `name`, `description`, `status`, `condition`, `department`, `photo`, `brand`, `model`, `serialNumber`, `processor`, `ram`, `storage`) VALUES
('INV-2026-001', 'BIEN-002849', 'iMac 24" M3 Retina', 'Computador de escritorio premium todo-en-uno, utilizado por el diseñador institucional para material gráfico y de prensa.', 'activo', 'bueno', 'Relaciones Interinstitucionales', @desktop_svg, 'Apple', 'iMac 24 M3 (2024)', 'C02FK982Q05D', 'Apple M3 8-núcleos (CPU/GPU)', '16 GB Memoria Unificada', '512 GB SSD PCIe'),
('INV-2026-002', 'BIEN-004829', 'Laptop Dell Latitude 5420', 'Computadora portátil corporativa asignada al equipo de desarrollo y soporte de sistemas internos.', 'activo', 'bueno', 'Centralizada', @laptop_svg, 'Dell', 'Latitude 5420', '5HG89B2', 'Intel Core i5-1145G7 @ 2.60GHz', '16 GB DDR4 (Expandido)', '512 GB NVMe Class 40 SSD'),
('INV-2026-003', 'BIEN-009104', 'Servidor Dell PowerEdge R750', 'Servidor de base de datos local e integraciones. Actualmente con problemas térmicos en el módulo de ventilación secundario.', 'reparacion', 'mejorable', 'Centralizada', @server_svg, 'Dell', 'PowerEdge R750 Rack Server', 'DELL-R750-88X29', 'Dual Intel Xeon Silver 4314 (32 núcleos totales)', '64 GB DDR4 ECC Reg', '4x 1.2TB SAS HDD HW RAID-5'),
('INV-2026-004', 'BIEN-003312', 'Impresora Multifuncional HP LaserJet Pro', 'Impresora departamental de alto tráfico. Presenta atascamiento persistente en la bandeja de salida trasera.', 'reparacion', 'mejorable', 'Administración', @printer_svg, 'HP', 'LaserJet Pro M428fdw', 'CNB8M9093L', '1200 MHz Integrado', '512 MB', 'No Aplica'),
('INV-2026-005', 'BIEN-007740', 'iPad Air 10.9" (M1)', 'Dispositivo móvil táctil utilizado por el Director General para revisiones de documentos de firmas digitales en reuniones ejecutivas.', 'activo', 'bueno', 'Dirección de Despacho', @tablet_svg, 'Apple', 'iPad Air (5ta Generación)', 'DMPYG9K117PM', 'Apple M1 8-core', '8 GB RAM', '256 GB NVMe'),
('INV-2026-006', 'BIEN-010534', 'Switch Cisco Catalyst 9200L', 'Switch de comunicaciones principal del ala C. Inoperativo luego de fuerte sobretensión eléctrica por tormenta local.', 'desincorporado', 'obsoleto', 'Centralizada', @network_svg, 'Cisco Systems', 'Catalyst 9200L 48p PoE+', 'FDO2532E20Y', 'ARM Quad-Core @ 1.4GHz', '4 GB DDR3', '4 GB Flash');

-- Insertar Historial
INSERT INTO `history` (`id`, `asset_id`, `date`, `type`, `user`, `details`) VALUES
('H1', 'INV-2026-001', '2026-01-15T09:00:00Z', 'registro', 'Samuel - Administrador', 'Ingreso al inventario general y etiquetado con NRO de Bien BIEN-002849.'),
('H2', 'INV-2026-001', '2026-01-15T10:30:00Z', 'traspaso', 'Samuel - Administrador', 'Asignación inicial a Relaciones Interinstitucionales para la jefatura de prensa.'),
('H3', 'INV-2026-002', '2026-02-10T08:15:00Z', 'registro', 'Marta R. - Inventarios', 'Registro e incorporación al inventario tecnológico nacional.'),
('H4', 'INV-2026-002', '2026-03-05T14:00:00Z', 'mantenimiento', 'Soporte Técnico - Carlos', 'Instalación de suite de desarrollo y ampliación de RAM de 8GB a 16GB.'),
('H5', 'INV-2026-003', '2026-03-20T10:00:00Z', 'registro', 'Samuel - Administrador', 'Instalación física en Rack 02 del Data Center Principal.'),
('H6', 'INV-2026-003', '2026-07-28T16:30:00Z', 'cambio_estado', 'Monitoreo Data Center', 'Alarma por altas temperaturas (78°C) en Procesador 2. Se apaga de emergencia y se traslada a laboratorio técnico.'),
('H7', 'INV-2026-004', '2026-01-20T08:00:00Z', 'registro', 'Marta R. - Inventarios', 'Ingreso e instalación en el pasillo principal del área de Administración.'),
('H8', 'INV-2026-004', '2026-07-30T11:20:00Z', 'cambio_estado', 'Administrador - Soporte', 'Reporte recurrente de atoramiento de papel. Se pasa a estado \'En Reparación\' tras evaluar desgaste físico de los rodillos.'),
('H9', 'INV-2026-005', '2026-02-15T09:10:00Z', 'registro', 'Samuel - Administrador', 'Incorporación al almacén central de tecnología.'),
('H10', 'INV-2026-005', '2026-03-01T11:00:00Z', 'traspaso', 'Samuel - Administrador', 'Traspaso aprobado de Centralizada a la Dirección de Despacho para uso directo de Presidencia.'),
('H11', 'INV-2026-006', '2026-04-12T10:00:00Z', 'registro', 'Tecnología Redes', 'Instalación en Rack de Enlaces de Comunicaciones.'),
('H12', 'INV-2026-006', '2026-07-26T21:00:00Z', 'cambio_estado', 'Soporte Técnico - Samuel', 'Falla de red completa en el ala C. El equipo no enciende y emite olor a componente quemado. Se retira para evaluación.'),
('H13', 'INV-2026-006', '2026-07-27T10:00:00Z', 'desincorporacion', 'Samuel - Director Tecnología', 'Se declara pérdida total debido a daño severo en la tarjeta lógica principal. Se procede a la desincorporación física del inventario nacional.');

-- Insertar Informes de Soporte
INSERT INTO `reports` (`id`, `asset_id`, `date`, `technician`, `diagnosis`, `actionTaken`, `statusBefore`, `statusAfter`) VALUES
('REP-001', 'INV-2026-002', '2026-03-05T13:45:00Z', 'Carlos J. - Soporte Técnico', 'Usuario requiere mayor capacidad para virtualización ligera de pruebas.', 'Se instala módulo adicional de 8GB RAM DDR4 3200MHz. Se corren pruebas de diagnóstico e integraciones con éxito.', 'activo', 'activo'),
('REP-002', 'INV-2026-003', '2026-07-29T10:00:00Z', 'Samuel - Jefe de Soporte', 'Falla de rodamiento en el extractor 3 del banco de ventiladores principal, provocando caída del flujo de aire y recalentamiento del CPU2.', 'Limpieza interna profunda de disipadores. Se gestiona la compra del repuesto de ventilador hot-swap Dell R750.', 'activo', 'reparacion'),
('REP-003', 'INV-2026-004', '2026-07-30T14:00:00Z', 'Andrés F. - Técnico Impresión', 'Engranaje de arrastre de la bandeja de duplex dañado y rodillo de presión desgastado por uso excesivo.', 'Se desarma unidad de fusión. Se determinó la necesidad de reemplazar el kit de rodillos de alimentación (Feed Roller Kit) y el piñón duplex. Se ingresó solicitud de compra de repuestos.', 'reparacion', 'reparacion'),
('REP-004', 'INV-2026-006', '2026-07-27T09:30:00Z', 'Samuel - Especialista de Redes', 'Cortocircuito masivo en fuente de poder integrada y quemado de múltiples transistores en la placa madre tras impacto de descarga eléctrica en la línea de datos. Inviable económicamente para reparación.', 'Diagnóstico final emitido. Se firma el acta de desincorporación y se retira el número de bien nacional BIEN-010534.', 'reparacion', 'desincorporado');

-- Insertar Usuarios por Defecto
INSERT INTO `users` (`id`, `username`, `password`, `fullname`, `role`) VALUES
('U1', 'admin', '$2y$10$7Wd83xqccHD89OQnGy7JCek7vgE8f5WlQQLPv.oTGbKtjl/UTmWNa', 'Samuel', 'Soporte TI');
