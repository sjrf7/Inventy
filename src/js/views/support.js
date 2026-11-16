import { enhanceSelectWithSearch } from '../components/searchableSelect.js';
import { getStatusInfo, isInSupport, escapeAttr, escapeHtml } from '../utils.js';

/**
 * Configura y rellena los campos de entrada de la vista de soporte técnico.
 * @param {Array} assets - Lista de bienes actuales
 * @param {Object} STATUSES - Mapa de metadatos de estados
 */
export function setupSupportView(assets, STATUSES) {
  const supportSelect = document.getElementById("support-asset-id");
  const previewBox = document.getElementById("support-asset-preview");
  
  if (!supportSelect) return;
  
  supportSelect.innerHTML = '<option value="">Seleccione equipo bajo atención…</option>';
  
  assets.forEach(asset => {
    const option = document.createElement("option");
    option.value = asset.id;
    const statusLabel = STATUSES[asset.status]?.label || asset.status;
    option.textContent = `${asset.nroBien} - ${asset.name} [${statusLabel}]`;
    supportSelect.appendChild(option);
  });

  // Mejora el desplegable con búsqueda
  enhanceSelectWithSearch(supportSelect, assets, STATUSES);
  
  if (previewBox) previewBox.style.display = "none";
  
  // Renderiza la lista de mantenimiento pendiente a la derecha
  renderPendingSupportList(assets, STATUSES);
}

/**
 * Filtra y dibuja las fallas pendientes de mantenimiento.
 * @param {Array} assets - Lista de bienes actuales
 * @param {Object} STATUSES - Mapa de metadatos de estados
 */
export function renderPendingSupportList(assets, STATUSES) {
  const container = document.getElementById("support-pending-container");
  const counterEl = document.getElementById("support-pending-count");
  if (!container) return;

  container.innerHTML = "";
  
  const pendingAssets = assets.filter(a => isInSupport(a.status));
  if (counterEl) counterEl.textContent = pendingAssets.length;
  
  if (pendingAssets.length === 0) {
    container.innerHTML = `
      <div class="support-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08 12 19 9 16"/><circle cx="12" cy="12" r="10"/>
        </svg>
        <h4>Al día</h4>
        <p>No hay equipos con fallas pendientes en laboratorio.</p>
      </div>
    `;
    return;
  }
  
  pendingAssets.forEach(asset => {
    const card = document.createElement("div");
    card.className = "issue-card";
    
    const statusInfo = getStatusInfo(asset.status, STATUSES);
    const lastReport = asset.reports && asset.reports.length > 0 ? asset.reports[asset.reports.length - 1] : null;
    const lastDiagnosis = lastReport ? lastReport.diagnosis : "Sin diagnóstico registrado.";
    
    card.innerHTML = `
      <div class="issue-header">
        <span class="issue-asset-nro ${escapeAttr(`status-${asset.status}`)}">
          ${escapeHtml(statusInfo.label)}
        </span>
        <span style="font-size:12px; font-weight:700; color:var(--text-muted);">${escapeHtml(asset.nroBien)}</span>
      </div>
      <div>
        <h4 class="issue-title">${escapeHtml(asset.name)}</h4>
        <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
          <strong>Falla:</strong> ${escapeHtml(lastDiagnosis)}
        </p>
      </div>
      <div class="issue-meta">
        <span>Ubicación: ${escapeHtml(asset.department)}</span>
        <button class="btn btn-primary btn-sm btn-solve-issue" data-id="${escapeAttr(asset.id)}">Atender / Resolver</button>
      </div>
    `;
    
    card.querySelector(".btn-solve-issue").addEventListener("click", () => {
      const supportSelect = document.getElementById("support-asset-id");
      if (supportSelect) {
        supportSelect.value = asset.id;
        supportSelect.dispatchEvent(new Event("change"));
      }
      
      const diagnosisEl = document.getElementById("support-diagnosis");
      const actionEl = document.getElementById("support-action");
      if (diagnosisEl) diagnosisEl.value = lastDiagnosis;
      if (actionEl) actionEl.focus();
    });
    
    container.appendChild(card);
  });
}
