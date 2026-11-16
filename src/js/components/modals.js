/**
 * Controlador de modales de Inventy
 */

import { formatDate, getAssetFallbackImage, escapeHtml } from '../utils.js';
import { openModal, staggerChildren } from '../motion.js';

/**
 * Abre y rellena la vista detallada de un bien.
 * @param {string} id - ID del bien
 * @param {Array} assets - Lista de bienes actuales
 * @param {Object} STATUSES - Metadatos de estados
 * @param {Object} ASSET_SVGS - Mapa de SVGs de ejemplo
 */
export function openAssetDetailModal(id, assets, STATUSES, ASSET_SVGS) {
  const asset = assets.find(a => a.id === id);
  if (!asset) return;
  
  // Rellena los campos de texto
  const elNro = document.getElementById("detail-nro-bien");
  const elName = document.getElementById("detail-name");
  const elDept = document.getElementById("detail-department");
  const elDesc = document.getElementById("detail-description");
  const elImg = document.getElementById("detail-img");
  const statusLabel = document.getElementById("detail-status");

  if (elNro) elNro.textContent = asset.nroBien;
  if (elName) elName.textContent = asset.name;
  if (elDept) elDept.textContent = asset.department;
  if (elDesc) elDesc.textContent = asset.description || "Sin descripción.";
  if (elImg) {
    elImg.classList.toggle("fallback-img", !asset.photo);
    elImg.src = asset.photo || getAssetFallbackImage(asset.name);
    elImg.onerror = () => {
      elImg.onerror = null;
      elImg.classList.add("fallback-img");
      elImg.src = getAssetFallbackImage(asset.name);
    };
  }
  
  // Insignia de estado
  if (statusLabel) {
    const statusInfo = STATUSES[asset.status] || { label: asset.status };
    statusLabel.textContent = statusInfo.label;
    statusLabel.className = `asset-badge status-${asset.status}`;
  }
  
  // Insignia de condición
  const conditionLabel = document.getElementById("detail-condition");
  if (conditionLabel) {
    const condition = (asset.condition || "bueno").toLowerCase();
    let cond = "Bueno";
    let condClass = "condition-bueno";

    if (condition === "obsoleto") {
      cond = "Obsoleto";
      condClass = "status-desincorporado";
    } else if (condition === "mejorable") {
      cond = "Mejorable";
      condClass = "status-reparacion";
    } else if (condition === "bueno") {
      cond = "Bueno";
      condClass = "condition-bueno";
    } else if (condition === "optimo") {
      cond = "Óptimo";
      condClass = "status-activo";
    }

    conditionLabel.textContent = cond.toUpperCase();
    conditionLabel.className = `asset-badge ${condClass}`;
  }
  
  // Ficha de especificaciones técnicas
  const specsContainer = document.getElementById("detail-specs-container");
  if (specsContainer) {
    specsContainer.innerHTML = "";
    
    const specs = asset.technicalSpecs || {};
    const labels = {
      brand: "Marca",
      model: "Modelo",
      serialNumber: "Número de Serie",
      processor: "Procesador/CPU",
      ram: "Memoria RAM",
      storage: "Almacenamiento"
    };
    
    let hasSpecs = false;
    Object.keys(labels).forEach(key => {
      const val = specs[key] == null ? "" : String(specs[key]);
      if (val.trim() !== "") {
        hasSpecs = true;
        const row = document.createElement("div");
        row.className = "spec-row";
        row.innerHTML = `
          <span class="spec-label">${labels[key]}</span>
          <span class="spec-value">${escapeHtml(val)}</span>
        `;
        specsContainer.appendChild(row);
      }
    });
    
    if (!hasSpecs) {
      specsContainer.innerHTML = `
        <div style="text-align:center; color:var(--text-muted); font-size:12px; padding:10px;">
          Ficha técnica vacía
        </div>
      `;
    }
  }
  
  // Pestaña de línea de tiempo del historial
  const historyTimeline = document.getElementById("detail-history-timeline");
  if (historyTimeline) {
    historyTimeline.innerHTML = "";
    const sortedHistory = [...(asset.history || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sortedHistory.length === 0) {
      historyTimeline.innerHTML = `
        <div style="text-align:center; color:var(--text-muted); font-size:12.5px; padding:12px;">
          Sin registros históricos
        </div>
      `;
    } else {
      sortedHistory.forEach(h => {
        const item = document.createElement("div");
        item.className = "timeline-item";
        item.innerHTML = `
          <div class="timeline-dot ${h.type || 'registro'}"></div>
          <div class="timeline-content" style="padding:10px 14px;">
            <div class="timeline-header" style="margin-bottom:4px;">
              <span class="timeline-user" style="font-size:11px;">${escapeHtml(h.user || "Sistema")}</span>
              <span class="timeline-date" style="font-size:11px;">${formatDate(h.date)}</span>
            </div>
            <div class="timeline-body" style="font-size:12.5px;">${escapeHtml(h.details)}</div>
          </div>
        `;
        historyTimeline.appendChild(item);
      });
    }
  }
  
  // Pestaña de lista de reportes técnicos
  const reportsList = document.getElementById("detail-reports-list");
  if (reportsList) {
    reportsList.innerHTML = "";
    const sortedReports = [...(asset.reports || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sortedReports.length === 0) {
      reportsList.innerHTML = `
        <div style="text-align:center; color:var(--text-muted); font-size:12.5px; padding:12px;">
          No se registran informes técnicos de soporte.
        </div>
      `;
    } else {
      sortedReports.forEach(r => {
        const item = document.createElement("div");
        item.className = "report-item";
        item.innerHTML = `
          <div class="report-item-header">
            <span class="report-item-technician">${escapeHtml(r.technician)}</span>
            <span>${formatDate(r.date)}</span>
          </div>
          <div class="report-item-block">
            <span class="report-item-label">Diagnóstico de falla</span>
            <span class="report-item-text">${escapeHtml(r.diagnosis)}</span>
          </div>
          <div class="report-item-block">
            <span class="report-item-label">Acción técnica y mantenimiento</span>
            <span class="report-item-text">${escapeHtml(r.actionTaken)}</span>
          </div>
          <div style="display:flex; justify-content:flex-end; font-size:10px; color:var(--text-muted); gap:12px;">
            <span>Estado anterior: <strong>${escapeHtml(STATUSES[r.statusBefore]?.label || r.statusBefore)}</strong></span>
            <span>Estado posterior: <strong>${escapeHtml(STATUSES[r.statusAfter]?.label || r.statusAfter)}</strong></span>
          </div>
        `;
        reportsList.appendChild(item);
      });
    }
  }
  
  // Abre la superposición del modal de detalles
  const detailModal = document.getElementById("modal-asset-detail");
  if (detailModal) openModal(detailModal);

  if (specsContainer) {
    staggerChildren(specsContainer, ".spec-row", { step: 22, max: 8 });
  }
  
  // Restablece la pestaña activa a la línea de tiempo
  document.querySelectorAll(".detail-tab-btn").forEach(btn => {
    const selected = btn.getAttribute("data-tab") === "tab-history";
    btn.classList.toggle("active", selected);
    btn.setAttribute("aria-selected", String(selected));
    btn.tabIndex = selected ? 0 : -1;
  });
  document.querySelectorAll(".tab-pane").forEach(pane => {
    pane.classList.toggle("active", pane.id === "tab-history");
  });
}

/**
 * Prepara el modal de formulario para agregar o editar un bien.
 * @param {string|null} editingId - ID del bien a editar, o null para crear uno nuevo
 * @param {Array} assets - Lista de bienes actuales
 * @param {Object} ASSET_SVGS - Mapa de imágenes de respaldo
 * @param {Function} setUploadedImage - Callback para registrar la imagen en el flujo principal
 */
export function openAssetFormModal(editingId, assets, ASSET_SVGS, setUploadedImage) {
  const form = document.getElementById("asset-upsert-form");
  if (!form) return;
  
  form.reset();
  setUploadedImage(null);
  
  const preview = document.getElementById("form-image-preview");
  const svgEl = document.getElementById("image-upload-area")?.querySelector("svg");
  const textEl = document.getElementById("image-upload-area")?.querySelector(".image-upload-text");
  const nroField = document.getElementById("form-nro-bien");
  const titleEl = document.getElementById("form-modal-title");
  const idField = document.getElementById("form-asset-id");

  if (preview) preview.style.display = "none";
  if (svgEl) svgEl.style.display = "block";
  if (textEl) textEl.style.display = "block";
  if (nroField) {
    nroField.removeAttribute("readonly");
    nroField.style.opacity = "1";
  }
  
  const isEditing = editingId !== null;
  if (titleEl) {
    titleEl.textContent = isEditing ? "Editar Bien" : "Agregar Nuevo Bien";
  }
  
  if (isEditing) {
    const asset = assets.find(a => a.id === editingId);
    if (!asset) return;
    
    if (idField) idField.value = asset.id;
    if (nroField) {
      nroField.value = asset.nroBien;
      nroField.setAttribute("readonly", true);
      nroField.style.opacity = "0.7";
    }
    
    const nameEl = document.getElementById("form-name");
    const deptEl = document.getElementById("form-department");
    const statusEl = document.getElementById("form-status");
    const conditionEl = document.getElementById("form-condition");
    const descEl = document.getElementById("form-description");

    if (nameEl) nameEl.value = asset.name;
    if (deptEl) deptEl.value = asset.department;
    if (statusEl) statusEl.value = asset.status;
    if (conditionEl) conditionEl.value = asset.condition || "bueno";
    if (descEl) descEl.value = asset.description || "";
    
    // Carga las especificaciones técnicas
    const specs = asset.technicalSpecs || {};
    const specFields = ["brand", "model", "serial", "processor", "ram", "storage"];
    specFields.forEach(field => {
      const el = document.getElementById(`form-${field}`);
      if (el) {
        if (field === "serial") {
          el.value = specs.serialNumber || "";
        } else {
          el.value = specs[field] || "";
        }
      }
    });
    
    // Vista previa de la fotografía
    if (asset.photo) {
      setUploadedImage(asset.photo);
      if (preview) {
        preview.src = asset.photo;
        preview.style.display = "block";
      }
      if (svgEl) svgEl.style.display = "none";
      if (textEl) textEl.style.display = "none";
    }
  } else {
    if (idField) idField.value = "";
    const conditionEl = document.getElementById("form-condition");
    if (conditionEl) conditionEl.value = "bueno";
  }
  
  const formModal = document.getElementById("modal-asset-form");
  if (formModal) openModal(formModal);
}
