import { ASSET_SVGS } from '../../seed-data.js';

/**
 * Funciones de utilidad de Inventy
 */

/**
 * Determina la imagen de ficha (SVG de respaldo) según el tipo de equipo,
 * a partir del nombre del bien.
 * @param {string} name - Nombre del bien
 * @returns {string} URL del SVG de ficha correspondiente
 */
export function getAssetFallbackImage(name = "") {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("laptop") || lowerName.includes("portatil") || lowerName.includes("notebook")) {
    return ASSET_SVGS.laptop;
  } else if (lowerName.includes("servidor") || lowerName.includes("server") || lowerName.includes("rack")) {
    return ASSET_SVGS.server;
  } else if (lowerName.includes("impresora") || lowerName.includes("printer") || lowerName.includes("multifuncional")) {
    return ASSET_SVGS.printer;
  } else if (lowerName.includes("ipad") || lowerName.includes("tablet") || lowerName.includes("tableta")) {
    return ASSET_SVGS.tablet;
  } else if (lowerName.includes("switch") || lowerName.includes("router") || lowerName.includes("hub") || lowerName.includes("cisco")) {
    return ASSET_SVGS.network;
  }
  return ASSET_SVGS.desktop; // Valor por defecto
}

/**
 * Devuelve los metadatos de un estado, con una etiqueta legible para estados
 * no contemplados en la lista base.
 * @param {string} status - Clave del estado
 * @param {Object} statuses - Mapa de estados disponibles
 * @returns {{label: string, color: string, bg: string}}
 */
export function getStatusInfo(status, statuses) {
  if (statuses && statuses[status]) return statuses[status];

  const fallbackLabel = String(status || "Sin estado")
    .replace(/_/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase());

  return { label: fallbackLabel, color: "var(--text-muted)", bg: "var(--bg-tertiary)" };
}

/**
 * Combina el catálogo institucional de direcciones con las direcciones que
 * realmente existen en el inventario, sin duplicados.
 * @param {Array} assets - Bienes registrados
 * @param {Array} canonicalDepartments - Catálogo base de direcciones
 * @returns {Array<string>}
 */
export function getDepartmentOptions(assets = [], canonicalDepartments = []) {
  const seen = new Set();
  const present = [];

  // Las direcciones con bienes registrados aparecen primero, en orden alfabético.
  assets.forEach(asset => {
    const name = String(asset.department || "").trim();
    if (!name || seen.has(name)) return;
    seen.add(name);
    present.push(name);
  });
  present.sort((a, b) => a.localeCompare(b, "es"));

  // El catálogo institucional completa la lista sin duplicar direcciones existentes.
  const remaining = [];
  canonicalDepartments.forEach(dept => {
    const name = String(dept || "").trim();
    if (!name || seen.has(name)) return;
    seen.add(name);
    remaining.push(name);
  });

  return [...present, ...remaining];
}

/**
 * Indica si un bien requiere atención del área de soporte.
 * @param {string} status - Clave del estado
 * @returns {boolean}
 */
export function isInSupport(status) {
  return status !== "activo" && status !== "desincorporado";
}

/**
 * Escapa un valor para insertarlo de forma segura dentro de un atributo HTML.
 * Evita que las comillas o símbolos de un SVG (data URI) rompan el atributo.
 * @param {string} value - Valor a escapar
 * @returns {string} Valor escapado
 */
export function escapeAttr(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Formatea una cadena de fecha ISO a una representación de fecha/hora legible en español.
 * @param {string} dateStr - Cadena de fecha en formato ISO
 * @returns {string} Cadena formateada
 */
export function formatDate(dateStr) {
  if (!dateStr) return "Sin fecha";
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES") + " " + date.toLocaleTimeString("es-ES", {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Convierte un objeto File en una cadena codificada en Base64.
 * @param {File} file - Objeto File proveniente del campo de entrada
 * @returns {Promise<string>} Cadena en Base64
 */
export function convertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

/**
 * Genera una cadena ISO local corregida según el desfase de la zona horaria.
 * @param {Date} date - Objeto Date
 * @returns {string} Cadena de fecha-hora ISO local
 */
export function getLocalISOTime(date = new Date()) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
}
