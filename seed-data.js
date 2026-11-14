// Datos de siembra de Inventy: bienes y constantes por defecto

export const DEPARTMENTS = [
  "Servicios Generales",
  "Dirección de Despacho",
  "Administración",
  "Centralizada",
  "Descentralizada",
  "Auditoría Interna",
  "OAC",
  "Relaciones Interinstitucionales",
  "Potestad Investigativa",
  "Talento Humano",
  "Archivo Central",
  "Seguridad Física",
  "Dirección de Informática y Sistemas"
];

export const STATUSES = {
  activo: { label: "Activo", color: "#10B981", bg: "rgba(16, 185, 129, 0.15)" },
  reparacion: { label: "En Reparación", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.15)" },
  espera_repuesto: { label: "Espera de Repuesto", color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.15)" },
  desincorporado: { label: "Desincorporado", color: "#EF4444", bg: "rgba(239, 68, 68, 0.15)" }
};

// Iconos SVG integrados para los bienes
export const ASSET_SVGS = {
  laptop: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="16" fill="url(%23grad-laptop)"/><defs><linearGradient id="grad-laptop" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%231E293B"/><stop offset="100%" stop-color="%230F172A"/></linearGradient><linearGradient id="glow-laptop" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%2360A5FA"/><stop offset="100%" stop-color="%233B82F6"/></linearGradient></defs><rect x="25" y="32" width="50" height="32" rx="4" fill="%23334155" stroke="url(%23glow-laptop)" stroke-width="2"/><path d="M15 68 C 15 65, 20 64, 25 64 L 75 64 C 80 64, 85 65, 85 68 L 85 70 C 85 72, 80 72, 75 72 L 25 72 C 20 72, 15 72, 15 70 Z" fill="%23475569"/><rect x="42" y="65" width="16" height="2" rx="1" fill="%231E293B"/><circle cx="50" cy="37" r="1.5" fill="%2360A5FA"/></svg>`,
  
  desktop: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="16" fill="url(%23grad-desktop)"/><defs><linearGradient id="grad-desktop" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%231E293B"/><stop offset="100%" stop-color="%230F172A"/></linearGradient><linearGradient id="glow-desktop" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%2334D399"/><stop offset="100%" stop-color="%23059669"/></linearGradient></defs><rect x="20" y="24" width="60" height="38" rx="4" fill="%23334155" stroke="url(%23glow-desktop)" stroke-width="2"/><path d="M44 63 L 56 63 L 58 74 L 42 74 Z" fill="%23475569"/><rect x="36" y="74" width="28" height="3" rx="1" fill="%23334155"/><circle cx="50" cy="28" r="1.5" fill="%2334D399"/></svg>`,
  
  server: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="16" fill="url(%23grad-server)"/><defs><linearGradient id="grad-server" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%231E293B"/><stop offset="100%" stop-color="%230F172A"/></linearGradient><linearGradient id="glow-server" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%23F59E0B"/><stop offset="100%" stop-color="%23D97706"/></linearGradient></defs><rect x="22" y="20" width="56" height="16" rx="2" fill="%23334155" stroke="url(%23glow-server)" stroke-width="1.5"/><rect x="22" y="42" width="56" height="16" rx="2" fill="%23334155" stroke="url(%23glow-server)" stroke-width="1.5"/><rect x="22" y="64" width="56" height="16" rx="2" fill="%23334155" stroke="url(%23glow-server)" stroke-width="1.5"/><circle cx="30" cy="28" r="2" fill="%2310B981"/><circle cx="30" cy="50" r="2" fill="%2310B981"/><circle cx="30" cy="72" r="2" fill="%23EF4444"/><rect x="38" y="27" width="24" height="2" rx="1" fill="%23475569"/><rect x="38" y="49" width="24" height="2" rx="1" fill="%23475569"/><rect x="38" y="71" width="24" height="2" rx="1" fill="%23475569"/><circle cx="68" cy="28" r="1.5" fill="%2360A5FA"/><circle cx="72" cy="28" r="1.5" fill="%2360A5FA"/><circle cx="68" cy="50" r="1.5" fill="%2360A5FA"/><circle cx="72" cy="50" r="1.5" fill="%2360A5FA"/><circle cx="68" cy="72" r="1.5" fill="%2360A5FA"/><circle cx="72" cy="72" r="1.5" fill="%2360A5FA"/></svg>`,
  
  printer: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="16" fill="url(%23grad-printer)"/><defs><linearGradient id="grad-printer" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%231E293B"/><stop offset="100%" stop-color="%230F172A"/></linearGradient><linearGradient id="glow-printer" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%23A78BFA"/><stop offset="100%" stop-color="%237C3AED"/></linearGradient></defs><path d="M30 35 L 70 35 L 70 45 L 30 45 Z" fill="%23475569"/><rect x="22" y="42" width="56" height="26" rx="4" fill="%23334155" stroke="url(%23glow-printer)" stroke-width="2"/><path d="M30 60 L 70 60 L 70 78 L 30 78 Z" fill="%23E2E8F0"/><rect x="34" y="64" width="32" height="2" rx="0.5" fill="%2394A3B8"/><rect x="34" y="70" width="24" height="2" rx="0.5" fill="%2394A3B8"/><circle cx="28" cy="50" r="2" fill="%2310B981"/><circle cx="34" cy="50" r="1.5" fill="%233B82F6"/></svg>`,
  
  tablet: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="16" fill="url(%23grad-tablet)"/><defs><linearGradient id="grad-tablet" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%231E293B"/><stop offset="100%" stop-color="%230F172A"/></linearGradient><linearGradient id="glow-tablet" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%23F43F5E"/><stop offset="100%" stop-color="%23E11D48"/></linearGradient></defs><rect x="26" y="20" width="48" height="60" rx="6" fill="%23334155" stroke="url(%23glow-tablet)" stroke-width="2"/><circle cx="50" cy="74" r="2.5" fill="%23475569"/><circle cx="50" cy="25" r="1" fill="%2394A3B8"/></svg>`,

  network: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="16" fill="url(%23grad-network)"/><defs><linearGradient id="grad-network" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%231E293B"/><stop offset="100%" stop-color="%230F172A"/></linearGradient><linearGradient id="glow-network" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="%2306B6D4"/><stop offset="100%" stop-color="%230891B2"/></linearGradient></defs><rect x="18" y="38" width="64" height="24" rx="3" fill="%23334155" stroke="url(%23glow-network)" stroke-width="2"/><circle cx="26" cy="50" r="2" fill="%2310B981"/><circle cx="32" cy="50" r="2" fill="%2310B981"/><rect x="40" y="46" width="6" height="8" rx="1" fill="%231E293B" stroke="%23475569" stroke-width="1"/><rect x="49" y="46" width="6" height="8" rx="1" fill="%231E293B" stroke="%23475569" stroke-width="1"/><rect x="58" y="46" width="6" height="8" rx="1" fill="%231E293B" stroke="%23475569" stroke-width="1"/><rect x="67" y="46" width="6" height="8" rx="1" fill="%231E293B" stroke="%23475569" stroke-width="1"/><circle cx="77" cy="50" r="1.5" fill="%2360A5FA"/></svg>`
};

export const DEFAULT_ASSETS = [
  {
    id: "INV-2026-001",
    nroBien: "BIEN-002849",
    name: "iMac 24\" M3 Retina",
    description: "Computador de escritorio premium todo-en-uno, utilizado por el diseñador institucional para material gráfico y de prensa.",
    status: "activo",
    department: "Relaciones Interinstitucionales",
    photo: ASSET_SVGS.desktop,
    technicalSpecs: {
      brand: "Apple",
      model: "iMac 24 M3 (2024)",
      serialNumber: "C02FK982Q05D",
      processor: "Apple M3 8-núcleos (CPU/GPU)",
      ram: "16 GB Memoria Unificada",
      storage: "512 GB SSD PCIe"
    },
    history: [
      {
        id: "H1",
        date: "2026-01-15T09:00:00Z",
        type: "registro",
        user: "Samuel - Administrador",
        details: "Ingreso al inventario general y etiquetado con NRO de Bien BIEN-002849."
      },
      {
        id: "H2",
        date: "2026-01-15T10:30:00Z",
        type: "traspaso",
        user: "Samuel - Administrador",
        details: "Asignación inicial a Relaciones Interinstitucionales para la jefatura de prensa."
      }
    ],
    reports: []
  },
  {
    id: "INV-2026-002",
    nroBien: "BIEN-004829",
    name: "Laptop Dell Latitude 5420",
    description: "Computadora portátil corporativa asignada al equipo de desarrollo y soporte de sistemas internos.",
    status: "activo",
    department: "Centralizada",
    photo: ASSET_SVGS.laptop,
    technicalSpecs: {
      brand: "Dell",
      model: "Latitude 5420",
      serialNumber: "5HG89B2",
      processor: "Intel Core i5-1145G7 @ 2.60GHz",
      ram: "16 GB DDR4 (Expandido)",
      storage: "512 GB NVMe Class 40 SSD"
    },
    history: [
      {
        id: "H3",
        date: "2026-02-10T08:15:00Z",
        type: "registro",
        user: "Marta R. - Inventarios",
        details: "Registro e incorporación al inventario tecnológico nacional."
      },
      {
        id: "H4",
        date: "2026-03-05T14:00:00Z",
        type: "mantenimiento",
        user: "Soporte Técnico - Carlos",
        details: "Instalación de suite de desarrollo y ampliación de RAM de 8GB a 16GB."
      }
    ],
    reports: [
      {
        id: "REP-001",
        date: "2026-03-05T13:45:00Z",
        technician: "Carlos J. - Soporte Técnico",
        diagnosis: "Usuario requiere mayor capacidad para virtualización ligera de pruebas.",
        actionTaken: "Se instala módulo adicional de 8GB RAM DDR4 3200MHz. Se corren pruebas de diagnóstico e integraciones con éxito.",
        statusBefore: "activo",
        statusAfter: "activo"
      }
    ]
  },
  {
    id: "INV-2026-003",
    nroBien: "BIEN-009104",
    name: "Servidor Dell PowerEdge R750",
    description: "Servidor de base de datos local e integraciones. Actualmente con problemas térmicos en el módulo de ventilación secundario.",
    status: "reparacion",
    department: "Centralizada",
    photo: ASSET_SVGS.server,
    technicalSpecs: {
      brand: "Dell",
      model: "PowerEdge R750 Rack Server",
      serialNumber: "DELL-R750-88X29",
      processor: "Dual Intel Xeon Silver 4314 (32 núcleos totales)",
      ram: "64 GB DDR4 ECC Reg",
      storage: "4x 1.2TB SAS HDD HW RAID-5"
    },
    history: [
      {
        id: "H5",
        date: "2026-03-20T10:00:00Z",
        type: "registro",
        user: "Samuel - Administrador",
        details: "Instalación física en Rack 02 del Data Center Principal."
      },
      {
        id: "H6",
        date: "2026-07-28T16:30:00Z",
        type: "cambio_estado",
        user: "Monitoreo Data Center",
        details: "Alarma por altas temperaturas (78°C) en Procesador 2. Se apaga de emergencia y se traslada a laboratorio técnico."
      }
    ],
    reports: [
      {
        id: "REP-002",
        date: "2026-07-29T10:00:00Z",
        technician: "Samuel - Jefe de Soporte",
        diagnosis: "Falla de rodamiento en el extractor 3 del banco de ventiladores principal, provocando caída del flujo de aire y recalentamiento del CPU2.",
        actionTaken: "Limpieza interna profunda de disipadores. Se gestiona la compra del repuesto de ventilador hot-swap Dell R750.",
        statusBefore: "activo",
        statusAfter: "reparacion"
      }
    ]
  },
  {
    id: "INV-2026-004",
    nroBien: "BIEN-003312",
    name: "Impresora Multifuncional HP LaserJet Pro",
    description: "Impresora departamental de alto tráfico. Presenta atascamiento persistente en la bandeja de salida trasera.",
    status: "reparacion",
    department: "Administración",
    photo: ASSET_SVGS.printer,
    technicalSpecs: {
      brand: "HP",
      model: "LaserJet Pro M428fdw",
      serialNumber: "CNB8M9093L",
      processor: "1200 MHz Integrado",
      ram: "512 MB",
      storage: "No Aplica"
    },
    history: [
      {
        id: "H7",
        date: "2026-01-20T08:00:00Z",
        type: "registro",
        user: "Marta R. - Inventarios",
        details: "Ingreso e instalación en el pasillo principal del área de Administración."
      },
      {
        id: "H8",
        date: "2026-07-30T11:20:00Z",
        type: "cambio_estado",
        user: "Administrador - Soporte",
        details: "Reporte recurrente de atoramiento de papel. Se pasa a estado 'En Reparación' tras evaluar desgaste físico de los rodillos."
      }
    ],
    reports: [
      {
        id: "REP-003",
        date: "2026-07-30T14:00:00Z",
        technician: "Andrés F. - Técnico Impresión",
        diagnosis: "Engranaje de arrastre de la bandeja de duplex dañado y rodillo de presión desgastado por uso excesivo.",
        actionTaken: "Se desarma unidad de fusión. Se determinó la necesidad de reemplazar el kit de rodillos de alimentación (Feed Roller Kit) y el piñón duplex. Se ingresó solicitud de compra de repuestos.",
        statusBefore: "reparacion",
        statusAfter: "reparacion"
      }
    ]
  },
  {
    id: "INV-2026-005",
    nroBien: "BIEN-007740",
    name: "iPad Air 10.9\" (M1)",
    description: "Dispositivo móvil táctil utilizado por el Director General para revisiones de documentos de firmas digitales en reuniones ejecutivas.",
    status: "activo",
    department: "Dirección de Despacho",
    photo: ASSET_SVGS.tablet,
    technicalSpecs: {
      brand: "Apple",
      model: "iPad Air (5ta Generación)",
      serialNumber: "DMPYG9K117PM",
      processor: "Apple M1 8-core",
      ram: "8 GB RAM",
      storage: "256 GB NVMe"
    },
    history: [
      {
        id: "H9",
        date: "2026-02-15T09:10:00Z",
        type: "registro",
        user: "Samuel - Administrador",
        details: "Incorporación al almacén central de tecnología."
      },
      {
        id: "H10",
        date: "2026-03-01T11:00:00Z",
        type: "traspaso",
        user: "Samuel - Administrador",
        details: "Traspaso aprobado de Centralizada a la Dirección de Despacho para uso directo de Presidencia."
      }
    ],
    reports: []
  },
  {
    id: "INV-2026-006",
    nroBien: "BIEN-010534",
    name: "Switch Cisco Catalyst 9200L",
    description: "Switch de comunicaciones principal del ala C. Inoperativo luego de fuerte sobretensión eléctrica por tormenta local.",
    status: "desincorporado",
    department: "Centralizada",
    photo: ASSET_SVGS.network,
    technicalSpecs: {
      brand: "Cisco Systems",
      model: "Catalyst 9200L 48p PoE+",
      serialNumber: "FDO2532E20Y",
      processor: "ARM Quad-Core @ 1.4GHz",
      ram: "4 GB DDR3",
      storage: "4 GB Flash"
    },
    history: [
      {
        id: "H11",
        date: "2026-04-12T10:00:00Z",
        type: "registro",
        user: "Tecnología Redes",
        details: "Instalación en Rack de Enlaces de Comunicaciones."
      },
      {
        id: "H12",
        date: "2026-07-26T21:00:00Z",
        type: "cambio_estado",
        user: "Soporte Técnico - Samuel",
        details: "Falla de red completa en el ala C. El equipo no enciende y emite olor a componente quemado. Se retira para evaluación."
      },
      {
        id: "H13",
        date: "2026-07-27T10:00:00Z",
        type: "desincorporacion",
        user: "Samuel - Director Tecnología",
        details: "Se declara pérdida total debido a daño severo en la tarjeta lógica principal. Se procede a la desincorporación física del inventario nacional."
      }
    ],
    reports: [
      {
        id: "REP-004",
        date: "2026-07-27T09:30:00Z",
        technician: "Samuel - Especialista de Redes",
        diagnosis: "Cortocircuito masivo en fuente de poder integrada y quemado de múltiples transistores en la placa madre tras impacto de descarga eléctrica en la línea de datos. Inviable económicamente para reparación.",
        actionTaken: "Diagnóstico final emitido. Se firma el acta de desincorporación y se retira el número de bien nacional BIEN-010534.",
        statusBefore: "reparacion",
        statusAfter: "desincorporado"
      }
    ]
  }
];
