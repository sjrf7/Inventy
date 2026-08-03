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
