import { getAssetFallbackImage, escapeAttr, escapeHtml, getStatusInfo } from '../utils.js';
import { captureFlipRects, playFlip } from '../motion.js';

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

  // Captura la posición previa para animar la reordenación (FLIP)
  const previousRects = captureFlipRects(gridContainer, ".asset-card");

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
      <div class="inventory-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <h3>No se encontraron bienes</h3>
        <p>Prueba ajustando los filtros de búsqueda o dirección.</p>
      </div>
    `;
    return;
  }
  
  // Construye e inserta las tarjetas
  const cards = [];

  filteredAssets.forEach((asset, index) => {
    const card = document.createElement("div");
    card.className = "asset-card";
    card.dataset.flipId = asset.id;
    
    const statusInfo = getStatusInfo(asset.status, STATUSES);
    const fallbackClass = asset.photo ? "" : "fallback-img";
    
    card.innerHTML = `
      <div class="asset-card-image">
        <img class="${fallbackClass}" src="${escapeAttr(asset.photo || getAssetFallbackImage(asset.name))}" alt="${escapeAttr(asset.name)}" width="320" height="180" loading="lazy" decoding="async">
        <span class="asset-badge ${escapeAttr(`status-${asset.status}`)}">
          ${escapeHtml(statusInfo.label)}
        </span>
      </div>
      <div class="asset-card-content">
        <div class="asset-card-nro">${escapeHtml(asset.nroBien)}</div>
        <h3 class="asset-card-name">${escapeHtml(asset.name)}</h3>
        <p class="asset-card-desc">${escapeHtml(asset.description || "Sin descripción disponible.")}</p>
        
        <div class="asset-card-meta">
          <div class="asset-card-dept" title="${escapeAttr(asset.department)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            <span>${escapeHtml(asset.department)}</span>
          </div>
          <div class="asset-card-actions">
            <button class="btn btn-primary btn-sm btn-view-detail" data-id="${escapeAttr(asset.id)}" title="Ver ficha completa">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Ficha
            </button>
            <button class="btn btn-secondary btn-sm btn-quick-support" data-id="${escapeAttr(asset.id)}" title="Abrir soporte técnico">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              Soporte
            </button>
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
    
    // El botón "Ficha" cubre toda la tarjeta mediante un área de clic extendida
    // (ver .btn-view-detail::after en components.css), de modo que la tarjeta
    // sigue abriendo el detalle sin ser un <div> con manejador de teclado propio.
    
    // Si la foto está rota o no se puede cargar, muestra la imagen de la ficha
    card.querySelector("img").addEventListener("error", () => {
      const img = card.querySelector("img");
      img.onerror = null;
      img.src = getAssetFallbackImage(asset.name);
    });
    
    gridContainer.appendChild(card);
    cards.push(card);
  });

  // Las tarjetas que ya existían se deslizan a su nueva posición;
  // las nuevas entran de forma escalonada.
  playFlip(gridContainer, previousRects, ".asset-card");
  cards.forEach((card, index) => {
    if (previousRects.has(card.dataset.flipId)) return;
    card.style.setProperty("--i", String(Math.min(index, 10)));
    card.classList.add("stagger-item");
  });
}
