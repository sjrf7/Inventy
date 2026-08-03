-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 04-08-2026 a las 01:17:41
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `inventy`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `assets`
--

CREATE TABLE `assets` (
  `id` varchar(50) NOT NULL,
  `nroBien` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(50) NOT NULL,
  `department` varchar(255) NOT NULL,
  `photo` longtext DEFAULT NULL,
  `brand` varchar(100) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `serialNumber` varchar(100) DEFAULT NULL,
  `processor` varchar(100) DEFAULT NULL,
  `ram` varchar(50) DEFAULT NULL,
  `storage` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `assets`
--

INSERT INTO `assets` (`id`, `nroBien`, `name`, `description`, `status`, `department`, `photo`, `brand`, `model`, `serialNumber`, `processor`, `ram`, `storage`, `created_at`) VALUES
('INV-2026-001', 'BIEN-002849', 'iMac 24\" M3 Retina', 'Computador de escritorio premium todo-en-uno, utilizado por el diseñador institucional para material gráfico y de prensa.', 'activo', 'Dirección de Comunicaciones', 'data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" fill=\"none\"><rect width=\"100\" height=\"100\" rx=\"16\" fill=\"url(%23grad-desktop)\"/><defs><linearGradient id=\"grad-desktop\" x1=\"0\" y1=\"0\" x2=\"100\" y2=\"100\"><stop offset=\"0%\" stop-color=\"%231E293B\"/><stop offset=\"100%\" stop-color=\"%230F172A\"/></linearGradient><linearGradient id=\"glow-desktop\" x1=\"0\" y1=\"0\" x2=\"100\" y2=\"100\"><stop offset=\"0%\" stop-color=\"%23F43F5E\"/><stop offset=\"100%\" stop-color=\"%23E11D48\"/></linearGradient></defs><rect x=\"20\" y=\"20\" width=\"60\" height=\"40\" rx=\"4\" fill=\"%231E293B\" stroke=\"url(%23glow-desktop)\" stroke-width=\"2\"/><path d=\"M44 60h12v12H44z\" fill=\"%23334155\"/><rect x=\"35\" y=\"72\" width=\"30\" height=\"4\" rx=\"2\" fill=\"%23475569\"/></svg>', 'Apple', 'iMac 24 M3 (2024)', 'C02FK982Q05D', 'Apple M3 8-núcleos (CPU/GPU)', '16 GB Memoria Unificada', '512 GB SSD PCIe', '2026-08-01 00:04:18'),
('INV-2026-002', 'BIEN-004829', 'Laptop Dell Latitude 5420', 'Computadora portátil corporativa asignada al equipo de desarrollo y soporte de sistemas internos.', 'activo', 'Dirección de Tecnología', 'data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" fill=\"none\"><rect width=\"100\" height=\"100\" rx=\"16\" fill=\"url(%23grad-laptop)\"/><defs><linearGradient id=\"grad-laptop\" x1=\"0\" y1=\"0\" x2=\"100\" y2=\"100\"><stop offset=\"0%\" stop-color=\"%231E293B\"/><stop offset=\"100%\" stop-color=\"%230F172A\"/></linearGradient><linearGradient id=\"glow-laptop\" x1=\"0\" y1=\"0\" x2=\"100\" y2=\"100\"><stop offset=\"0%\" stop-color=\"%236366F1\"/><stop offset=\"100%\" stop-color=\"%234F46E5\"/></linearGradient></defs><rect x=\"25\" y=\"30\" width=\"50\" height=\"32\" rx=\"3\" fill=\"%231E293B\" stroke=\"url(%23glow-laptop)\" stroke-width=\"2\"/><path d=\"M15 65h70v4a2 2 0 0 1-2 2H17a2 2 0 0 1-2-2v-4Z\" fill=\"%23334155\"/><rect x=\"42\" y=\"66\" width=\"16\" height=\"3\" rx=\"1.5\" fill=\"%231E293B\"/></svg>', 'Dell', 'Latitude 5420', '5HG89B2', 'Intel Core i5-1145G7 @ 2.60GHz', '16 GB DDR4 (Expandido)', '512 GB NVMe Class 40 SSD', '2026-08-01 00:04:18'),
('INV-2026-003', 'BIEN-009104', 'Servidor Dell PowerEdge R750', 'Servidor de base de datos local e integraciones. Actualmente con problemas térmicos en el módulo de ventilación secundario.', 'reparacion', 'Dirección de Tecnología', 'data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" fill=\"none\"><rect width=\"100\" height=\"100\" rx=\"16\" fill=\"url(%23grad-server)\"/><defs><linearGradient id=\"grad-server\" x1=\"0\" y1=\"0\" x2=\"100\" y2=\"100\"><stop offset=\"0%\" stop-color=\"%231E293B\"/><stop offset=\"100%\" stop-color=\"%230F172A\"/></linearGradient><linearGradient id=\"glow-server\" x1=\"0\" y1=\"0\" x2=\"100\" y2=\"100\"><stop offset=\"0%\" stop-color=\"%2310B981\"/><stop offset=\"100%\" stop-color=\"%23059669\"/></linearGradient></defs><rect x=\"20\" y=\"22\" width=\"60\" height=\"16\" rx=\"2\" fill=\"%231E293B\" stroke=\"url(%23glow-server)\" stroke-width=\"2\"/><circle cx=\"28\" cy=\"30\" r=\"1.5\" fill=\"%2310B981\"/><line x1=\"36\" y1=\"30\" x2=\"68\" y2=\"30\" stroke=\"%23475569\" stroke-width=\"2\"/><rect x=\"20\" y=\"42\" width=\"60\" height=\"16\" rx=\"2\" fill=\"%231E293B\" stroke=\"url(%23glow-server)\" stroke-width=\"2\"/><circle cx=\"28\" cy=\"50\" r=\"1.5\" fill=\"%2310B981\"/><line x1=\"36\" y1=\"50\" x2=\"68\" y2=\"50\" stroke=\"%23475569\" stroke-width=\"2\"/><rect x=\"20\" y=\"62\" width=\"60\" height=\"16\" rx=\"2\" fill=\"%231E293B\" stroke=\"url(%23glow-server)\" stroke-width=\"2\"/><circle cx=\"28\" cy=\"70\" r=\"1.5\" fill=\"%23EF4444\"/><line x1=\"36\" y1=\"70\" x2=\"68\" y2=\"70\" stroke=\"%23475569\" stroke-width=\"2\"/></svg>', 'Dell', 'PowerEdge R750 Rack Server', 'DELL-R750-88X29', 'Dual Intel Xeon Silver 4314 (32 núcleos totales)', '64 GB DDR4 ECC Reg', '4x 1.2TB SAS HDD HW RAID-5', '2026-08-01 00:04:18'),
('INV-2026-004', 'BIEN-003312', 'Impresora Multifuncional HP LaserJet Pro', 'Impresora departamental de alto tráfico. Presenta atascamiento persistente en la bandeja de salida trasera.', 'espera_repuesto', 'Dirección de Administración', 'data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" fill=\"none\"><rect width=\"100\" height=\"100\" rx=\"16\" fill=\"url(%23grad-printer)\"/><defs><linearGradient id=\"grad-printer\" x1=\"0\" y1=\"0\" x2=\"100\" y2=\"100\"><stop offset=\"0%\" stop-color=\"%231E293B\"/><stop offset=\"100%\" stop-color=\"%230F172A\"/></linearGradient><linearGradient id=\"glow-printer\" x1=\"0\" y1=\"0\" x2=\"100\" y2=\"100\"><stop offset=\"0%\" stop-color=\"%23F59E0B\"/><stop offset=\"100%\" stop-color=\"%23D97706\"/></linearGradient></defs><rect x=\"24\" y=\"38\" width=\"52\" height=\"26\" rx=\"2\" fill=\"%231E293B\" stroke=\"url(%23glow-printer)\" stroke-width=\"2\"/><path d=\"M32 38V22h36v16H32Z\" fill=\"%23334155\"/><path d=\"M30 64v14h40V64H30Z\" fill=\"%23475569\"/><rect x=\"36\" y=\"68\" width=\"28\" height=\"2\" rx=\"1\" fill=\"%23E2E8F0\"/></svg>', 'HP', 'LaserJet Pro M428fdw', 'CNB8M9093L', '1200 MHz Integrado', '512 MB', 'No Aplica', '2026-08-01 00:04:18'),
('INV-2026-005', 'BIEN-007740', 'iPad Air 10.9\" (M1)', 'Dispositivo móvil táctil utilizado por el Director General para revisiones de documentos de firmas digitales en reuniones ejecutivas.', 'activo', 'Dirección General', 'data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" fill=\"none\"><rect width=\"100\" height=\"100\" rx=\"16\" fill=\"url(%23grad-tablet)\"/><defs><linearGradient id=\"grad-tablet\" x1=\"0\" y1=\"0\" x2=\"100\" y2=\"100\"><stop offset=\"0%\" stop-color=\"%231E293B\"/><stop offset=\"100%\" stop-color=\"%230F172A\"/></linearGradient><linearGradient id=\"glow-tablet\" x1=\"0\" y1=\"0\" x2=\"100\" y2=\"100\"><stop offset=\"0%\" stop-color=\"%23EC4899\"/><stop offset=\"100%\" stop-color=\"%23DB2777\"/></linearGradient></defs><rect x=\"22\" y=\"16\" width=\"56\" height=\"68\" rx=\"6\" fill=\"%231E293B\" stroke=\"url(%23glow-tablet)\" stroke-width=\"2\"/><circle cx=\"50\" cy=\"78\" r=\"2.5\" fill=\"%23475569\"/><circle cx=\"50\" cy=\"22\" r=\"1\" fill=\"%23475569\"/></svg>', 'Apple', 'iPad Air (5ta Generación)', 'DMPYG9K117PM', 'Apple M1 8-core', '8 GB RAM', '256 GB NVMe', '2026-08-01 00:04:18'),
('INV-2026-006', 'BIEN-010534', 'Switch Cisco Catalyst 9200L', 'Switch de comunicaciones principal del ala C. Inoperativo luego de fuerte sobretensión eléctrica por tormenta local.', 'desincorporado', 'Dirección de Tecnología', 'data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" fill=\"none\"><rect width=\"100\" height=\"100\" rx=\"16\" fill=\"url(%23grad-network)\"/><defs><linearGradient id=\"grad-network\" x1=\"0\" y1=\"0\" x2=\"100\" y2=\"100\"><stop offset=\"0%\" stop-color=\"%231E293B\"/><stop offset=\"100%\" stop-color=\"%230F172A\"/></linearGradient><linearGradient id=\"glow-network\" x1=\"0\" y1=\"0\" x2=\"100\" y2=\"100\"><stop offset=\"0%\" stop-color=\"%2306B6D4\"/><stop offset=\"100%\" stop-color=\"%230891B2\"/></linearGradient></defs><rect x=\"18\" y=\"38\" width=\"64\" height=\"24\" rx=\"3\" fill=\"%23334155\" stroke=\"url(%23glow-network)\" stroke-width=\"2\"/><circle cx=\"26\" cy=\"50\" r=\"2\" fill=\"%2310B981\"/><circle cx=\"32\" cy=\"50\" r=\"2\" fill=\"%2310B981\"/><rect x=\"40\" y=\"46\" width=\"6\" height=\"8\" rx=\"1\" fill=\"%231E293B\" stroke=\"%23475569\" stroke-width=\"1\"/><rect x=\"49\" y=\"46\" width=\"6\" height=\"8\" rx=\"1\" fill=\"%231E293B\" stroke=\"%23475569\" stroke-width=\"1\"/><rect x=\"58\" y=\"46\" width=\"6\" height=\"8\" rx=\"1\" fill=\"%231E293B\" stroke=\"%23475569\" stroke-width=\"1\"/><rect x=\"67\" y=\"46\" width=\"6\" height=\"8\" rx=\"1\" fill=\"%231E293B\" stroke=\"%23475569\" stroke-width=\"1\"/><circle cx=\"77\" cy=\"50\" r=\"1.5\" fill=\"%2360A5FA\"/></svg>', 'Cisco Systems', 'Catalyst 9200L 48p PoE+', 'FDO2532E20Y', 'ARM Quad-Core @ 1.4GHz', '4 GB DDR3', '4 GB Flash', '2026-08-01 00:04:18');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `history`
--

CREATE TABLE `history` (
  `id` varchar(50) NOT NULL,
  `asset_id` varchar(50) NOT NULL,
  `date` varchar(50) NOT NULL,
  `type` varchar(50) NOT NULL,
  `user` varchar(255) NOT NULL,
  `details` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `history`
--

INSERT INTO `history` (`id`, `asset_id`, `date`, `type`, `user`, `details`) VALUES
('H1', 'INV-2026-001', '2026-01-15T09:00:00Z', 'registro', 'Samuel - Administrador', 'Ingreso al inventario general y etiquetado con NRO de Bien BIEN-002849.'),
('H10', 'INV-2026-005', '2026-03-01T11:00:00Z', 'traspaso', 'Samuel - Administrador', 'Traspaso aprobado de Dirección de Tecnología a la Dirección General para uso directo de Presidencia.'),
('H11', 'INV-2026-006', '2026-04-12T10:00:00Z', 'registro', 'Tecnología Redes', 'Instalación en Rack de Enlaces de Comunicaciones.'),
('H12', 'INV-2026-006', '2026-07-26T21:00:00Z', 'cambio_estado', 'Soporte Técnico - Samuel', 'Falla de red completa en el ala C. El equipo no enciende y emite olor a componente quemado. Se retira para evaluación.'),
('H13', 'INV-2026-006', '2026-07-27T10:00:00Z', 'desincorporacion', 'Samuel - Director Tecnología', 'Se declara pérdida total debido a daño severo en la tarjeta lógica principal. Se procede a la desincorporación física del inventario nacional.'),
('H2', 'INV-2026-001', '2026-01-15T10:30:00Z', 'traspaso', 'Samuel - Administrador', 'Asignación inicial a la Dirección de Comunicaciones para la jefatura de prensa.'),
('H3', 'INV-2026-002', '2026-02-10T08:15:00Z', 'registro', 'Marta R. - Inventarios', 'Registro e incorporación al inventario tecnológico nacional.'),
('H4', 'INV-2026-002', '2026-03-05T14:00:00Z', 'mantenimiento', 'Soporte Técnico - Carlos', 'Instalación de suite de desarrollo y ampliación de RAM de 8GB a 16GB.'),
('H5', 'INV-2026-003', '2026-03-20T10:00:00Z', 'registro', 'Samuel - Administrador', 'Instalación física en Rack 02 del Data Center Principal.'),
('H6', 'INV-2026-003', '2026-07-28T16:30:00Z', 'cambio_estado', 'Monitoreo Data Center', 'Alarma por altas temperaturas (78°C) en Procesador 2. Se apaga de emergencia y se traslada a laboratorio técnico.'),
('H7', 'INV-2026-004', '2026-01-20T08:00:00Z', 'registro', 'Marta R. - Inventarios', 'Ingreso e instalación en el pasillo principal del ala de Administración.'),
('H8', 'INV-2026-004', '2026-07-30T11:20:00Z', 'cambio_estado', 'Administrador - Soporte', 'Reporte recurrente de atoramiento de papel. Se pasa a estado \'Espera de Repuestos\' tras evaluar desgaste físico de los rodillos.'),
('H9', 'INV-2026-005', '2026-02-15T09:10:00Z', 'registro', 'Samuel - Administrador', 'Incorporación al almacén central de tecnología.');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reports`
--

CREATE TABLE `reports` (
  `id` varchar(50) NOT NULL,
  `asset_id` varchar(50) NOT NULL,
  `date` varchar(50) NOT NULL,
  `technician` varchar(255) NOT NULL,
  `diagnosis` text NOT NULL,
  `actionTaken` text NOT NULL,
  `statusBefore` varchar(50) NOT NULL,
  `statusAfter` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `reports`
--

INSERT INTO `reports` (`id`, `asset_id`, `date`, `technician`, `diagnosis`, `actionTaken`, `statusBefore`, `statusAfter`) VALUES
('REP-001', 'INV-2026-002', '2026-03-05T13:45:00Z', 'Carlos J. - Soporte Técnico', 'Usuario requiere mayor capacidad para virtualización ligera de pruebas.', 'Se instala módulo adicional de 8GB RAM DDR4 3200MHz. Se corren pruebas de diagnóstico e integraciones con éxito.', 'activo', 'activo'),
('REP-002', 'INV-2026-003', '2026-07-29T10:00:00Z', 'Samuel - Jefe de Soporte', 'Falla de rodamiento en el extractor 3 del banco de ventiladores principal, provocando caída del flujo de aire y recalentamiento del CPU2.', 'Limpieza interna profunda de disipadores. Se gestiona la compra del repuesto de ventilador hot-swap Dell R750.', 'activo', 'reparacion'),
('REP-003', 'INV-2026-004', '2026-07-30T14:00:00Z', 'Andrés F. - Técnico Impresión', 'Engranaje de arrastre de la bandeja de duplex dañado y rodillo de presión desgastado por uso excesivo.', 'Se desarma unidad de fusión. Se determinó la necesidad de reemplazar el kit de rodillos de alimentación (Feed Roller Kit) y el piñón duplex. Se ingresó solicitud de compra de repuestos.', 'reparacion', 'espera_repuesto'),
('REP-004', 'INV-2026-006', '2026-07-27T09:30:00Z', 'Samuel - Especialista de Redes', 'Cortocircuito masivo en fuente de poder integrada y quemado de múltiples transistores en la placa madre tras impacto de descarga eléctrica en la línea de datos. Inviable económicamente para reparación.', 'Diagnóstico final emitido. Se firma el acta de desincorporación y se retira el número de bien nacional BIEN-010534.', 'reparacion', 'desincorporado');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `fullname` varchar(255) DEFAULT NULL,
  `role` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `fullname`, `role`, `created_at`) VALUES
('U1', 'admin', '$2y$10$7Wd83xqccHD89OQnGy7JCek7vgE8f5WlQQLPv.oTGbKtjl/UTmWNa', 'Samuel', 'Soporte TI', '2026-08-03 00:01:02');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `assets`
--
ALTER TABLE `assets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_nro_bien` (`nroBien`),
  ADD KEY `idx_assets_name` (`name`),
  ADD KEY `idx_assets_status` (`status`),
  ADD KEY `idx_assets_department` (`department`);

--
-- Indices de la tabla `history`
--
ALTER TABLE `history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_history_asset_id` (`asset_id`);

--
-- Indices de la tabla `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reports_asset_id` (`asset_id`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_users_username` (`username`),
  ADD KEY `idx_users_username` (`username`);

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `history`
--
ALTER TABLE `history`
  ADD CONSTRAINT `fk_history_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `fk_reports_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
