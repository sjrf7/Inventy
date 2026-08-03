import { getAssetFallbackImage, escapeAttr } from '../utils.js';

/**
 * Filtra, ordena y renderiza las tarjetas de la cuadrícula del inventario.
 * @param {Array} assets - Bienes actuales
 * @param {Object} STATUSES - Metadatos de estados
 * @param {Function} onDetailClick - Callback al hacer clic en el botón de ficha
 * @param {Function} onSupportClick - Callback al hacer clic en el botón de soporte
 */
export function renderInventoryList(assets, STATUSES, onDetailClick, onSupportClick) {
  const gridContainer = document.getElementById("assets-grid-container");
  const counterEl = document.getElementById("inventory-counter");
  if (!gridContainer) return;

  gridContainer.innerHTML = "";
  
  // Obtiene el estado actual de los filtros desde el DOM
  const globalSearchVal = document.getElementById("global-search")?.value.toLowerCase().trim() || "";
  const deptFilterVal = document.getElementById("filter-dept")?.value || "";
  const statusFilterVal = document.getElementById("filter-status")?.value || "";
  const sortByVal = document.getElementById("sort-by")?.value || "name-asc";
  
  // Filtra los bienes que coinciden con los criterios
  let filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(globalSearchVal) || 
                          asset.nroBien.toLowerCase().includes(globalSearchVal) ||
                          (asset.description && asset.description.toLowerCase().includes(globalSearchVal)) ||
                          (asset.technicalSpecs && asset.technicalSpecs.serialNumber && asset.technicalSpecs.serialNumber.toLowerCase().includes(globalSearchVal));
    
    const matchesDept = deptFilterVal === "" || asset.department === deptFilterVal;
    const matchesStatus = statusFilterVal === "" || asset.status === statusFilterVal;
    
    return matchesSearch && matchesDept && matchesStatus;
  });
  
  // Ordena los bienes filtrados
  filteredAssets.sort((a, b) => {
    if (sortByVal === "name-asc") {
      return a.name.localeCompare(b.name);
    } else if (sortByVal === "name-desc") {
      return b.name.localeCompare(a.name);
    } else if (sortByVal === "bien-asc") {
      return a.nroBien.localeCompare(b.nroBien);
    } else if (sortByVal === "bien-desc") {
      return b.nroBien.localeCompare(a.nroBien);
    }
    return 0;
  });
  
  // Actualiza el texto del contador del inventario
  if (counterEl) {
    counterEl.textContent = `Mostrando ${filteredAssets.length} de ${assets.length} bienes`;
  }
  
  if (filteredAssets.length === 0) {
    gridContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align:center; padding: 40px; background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-lg);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom: 12px;">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <h3>No se encontraron bienes</h3>
        <p style="color: var(--text-muted); margin-top: 6px;">Prueba ajustando los filtros de búsqueda o dirección.</p>
      </div>
    `;
    return;
  }
  
  // Construye e inserta las tarjetas
  filteredAssets.forEach(asset => {
    const card = document.createElement("div");
    card.className = "asset-card";
    
    const statusInfo = STATUSES[asset.status] || { label: "Desconocido", color: "#6B7280", bg: "rgba(107, 114, 128, 0.1)" };
    const fallbackClass = asset.photo ? "" : "fallback-img";
    
    card.innerHTML = `
      <div class="asset-card-image">
        <img class="${fallbackClass}" src="${escapeAttr(asset.photo || getAssetFallbackImage(asset.name))}" alt="${escapeAttr(asset.name)}">
        <span class="asset-badge status-${asset.status}">
          ${statusInfo.label}
        </span>
      </div>
      <div class="asset-card-content">
        <div class="asset-card-nro">${asset.nroBien}</div>
        <h3 class="asset-card-name">${asset.name}</h3>
        <p class="asset-card-desc">${asset.description || "Sin descripción disponible."}</p>
        
        <div class="asset-card-meta">
          <div class="asset-card-dept">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            <span>${asset.department}</span>
          </div>
          <div class="asset-card-actions">
            <button class="btn btn-secondary btn-sm btn-view-detail" data-id="${asset.id}" title="Ver ficha completa">Ficha</button>
            <button class="btn btn-primary btn-sm btn-quick-support" data-id="${asset.id}" title="Soporte">Soporte</button>
          </div>
        </div>
      </div>
    `;
    
    // Vincula los eventos de los botones de la tarjeta
    card.querySelector(".btn-view-detail").addEventListener("click", (e) => {
      e.stopPropagation();
      if (typeof onDetailClick === "function") onDetailClick(asset.id);
    });
    
    card.querySelector(".btn-quick-support").addEventListener("click", (e) => {
      e.stopPropagation();
      if (typeof onSupportClick === "function") onSupportClick(asset);
    });
    
    // Al hacer clic en cualquier parte de la tarjeta se abre la ficha técnica
    card.addEventListener("click", () => {
      if (typeof onDetailClick === "function") onDetailClick(asset.id);
    });
    
    // Si la foto está rota o no se puede cargar, muestra la imagen de la ficha
    card.querySelector("img").addEventListener("error", () => {
      const img = card.querySelector("img");
      img.onerror = null;
      img.src = getAssetFallbackImage(asset.name);
    });
    
    gridContainer.appendChild(card);
  });
}
