import { formatDate, getLocalISOTime, escapeHtml } from '../utils.js';
import { enhanceSelectWithSearch } from '../components/searchableSelect.js';
import { STATUSES } from '../../../seed-data.js';

/**
 * Configura y rellena los campos de entrada de la vista de traspasos.
 * @param {Array} assets - Lista de bienes actuales
 * @param {Array} DEPARTMENTS - Lista de direcciones
 */
export function setupTransfersView(assets, DEPARTMENTS) {
  const transferSelect = document.getElementById("transfer-asset-id");
  const destSelect = document.getElementById("transfer-dest-dept");
  const dateInput = document.getElementById("transfer-date");
  const previewBox = document.getElementById("transfer-asset-preview");
  const originInput = document.getElementById("transfer-origin-dept");

  if (!transferSelect || !destSelect || !dateInput) return;

  // Rellena el desplegable de selección de equipos
  transferSelect.innerHTML = '<option value="">Seleccione un equipo…</option>';
  assets.filter(a => a.status !== "desincorporado").forEach(asset => {
    const option = document.createElement("option");
    option.value = asset.id;
    option.textContent = `${asset.nroBien} - ${asset.name} (${asset.department})`;
    transferSelect.appendChild(option);
  });

  // Mejora el desplegable con búsqueda
  enhanceSelectWithSearch(transferSelect, assets, STATUSES);
  
  // Rellena las direcciones de destino
  destSelect.innerHTML = '<option value="">Seleccione destino…</option>';
  DEPARTMENTS.forEach(dept => {
    const option = document.createElement("option");
    option.value = dept;
    option.textContent = dept;
    destSelect.appendChild(option);
  });
  
  // Restablece la vista previa y los campos
  if (previewBox) previewBox.style.display = "none";
  if (originInput) originInput.value = "";
  
  // Establece la fecha actual (aaaa-mm-ddThh:mm) sin pisar una fecha ya escrita
  if (!dateInput.value) {
    dateInput.value = getLocalISOTime();
  }
  
  // Renderiza la línea de tiempo
  renderTransfersTimeline(assets);
}

/**
 * Extrae y muestra la línea de tiempo del historial de traspasos.
 * @param {Array} assets - Lista de bienes actuales
 */
export function renderTransfersTimeline(assets) {
  const timeline = document.getElementById("general-transfers-timeline");
  if (!timeline) return;

  timeline.innerHTML = "";
  
  // Extrae los eventos de traspaso de todos los bienes
  let transfers = [];
  assets.forEach(asset => {
    if (asset.history) {
      asset.history.filter(h => h.type === "traspaso").forEach(h => {
        transfers.push({
          assetName: asset.name,
          assetNro: asset.nroBien,
          ...h
        });
      });
    }
  });
  
  transfers.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  if (transfers.length === 0) {
    timeline.innerHTML = `
      <div class="timeline-empty">
        No hay traspasos registrados aún.
      </div>
    `;
    return;
  }
  
  transfers.forEach(t => {
    const item = document.createElement("div");
    item.className = "timeline-item";
    item.innerHTML = `
      <div class="timeline-dot traspaso"></div>
      <div class="timeline-content">
        <div class="timeline-header">
          <span class="timeline-user">Autorizado por: ${escapeHtml(t.user)}</span>
          <span class="timeline-date">${formatDate(t.date)}</span>
        </div>
        <div class="timeline-body">
          <strong>${escapeHtml(t.assetName)} (${escapeHtml(t.assetNro)})</strong>: ${escapeHtml(t.details)}
        </div>
      </div>
    `;
    timeline.appendChild(item);
  });
}
