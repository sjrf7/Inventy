/**
 * Mejorador de Selects con Búsqueda de Inventy (Combobox)
 * Mejora de forma progresiva los elementos <select> estándar de HTML convirtiéndolos en
 * listas desplegables interactivas y buscables, con información enriquecida de cada bien
 * (imagen, distintivo de Nro. de Bien, ubicación y estado).
 */

import { escapeAttr } from '../utils.js';

export function enhanceSelectWithSearch(selectElement, assets, STATUSES) {
  if (!selectElement) return;

  // Evita mejorar el mismo elemento dos veces
  if (selectElement.dataset.enhanced === "true") {
    // Si ya está mejorado, solo se necesita re-renderizar y re-sincronizar sus opciones
    const container = selectElement.parentElement;
    if (container && container.classList.contains("searchable-select-container")) {
      const dropdown = container.querySelector(".searchable-select-dropdown");
      const input = container.querySelector(".searchable-select-input");
      if (dropdown && input) {
        populateDropdown(selectElement, dropdown, input, assets, STATUSES);
        syncInputWithValue(selectElement, input, assets);
      }
    }
    return;
  }

  const selectId = selectElement.id;
  const placeholder = selectElement.options[0]?.textContent || "Seleccione una opción…";

  // 1. Crear la estructura del contenedor
  const container = document.createElement("div");
  container.className = "searchable-select-container";
  container.id = `searchable-select-wrapper-${selectId}`;

  // Oculta el select original pero lo conserva en el DOM para la validación y los eventos
  selectElement.style.display = "none";
  selectElement.parentNode.insertBefore(container, selectElement);
  container.appendChild(selectElement);

  // 2. Crear el envoltorio del campo de búsqueda
  const inputWrapper = document.createElement("div");
  inputWrapper.className = "searchable-select-input-wrapper";

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.className = "form-input searchable-select-input";
  searchInput.placeholder = placeholder;
  searchInput.autocomplete = "off";
  searchInput.setAttribute("role", "combobox");
  searchInput.setAttribute("aria-autocomplete", "list");
  searchInput.setAttribute("aria-expanded", "false");
  searchInput.setAttribute("aria-controls", `searchable-select-list-${selectId}`);

  // Nombre accesible: reutiliza la etiqueta del select original si existe
  const labelText = selectElement.labels && selectElement.labels[0]
    ? selectElement.labels[0].textContent.trim()
    : "";
  searchInput.setAttribute(
    "aria-label",
    selectElement.getAttribute("aria-label") || labelText || placeholder
  );

  // Icono de flecha
  const arrowSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  arrowSvg.setAttribute("viewBox", "0 0 24 24");
  arrowSvg.setAttribute("fill", "none");
  arrowSvg.setAttribute("stroke", "currentColor");
  arrowSvg.setAttribute("stroke-width", "2");
  arrowSvg.innerHTML = `<polyline points="6 9 12 15 18 9"></polyline>`;

  inputWrapper.appendChild(searchInput);
  inputWrapper.appendChild(arrowSvg);
  container.appendChild(inputWrapper);

  // 3. Crear el panel desplegable
  const dropdown = document.createElement("div");
  dropdown.className = "searchable-select-dropdown";
  dropdown.id = `searchable-select-list-${selectId}`;
  dropdown.setAttribute("role", "listbox");
  container.appendChild(dropdown);

  // 4. Marcar como mejorado
  selectElement.dataset.enhanced = "true";

  // Rellenar la lista y sincronizar el estado inicial
  populateDropdown(selectElement, dropdown, searchInput, assets, STATUSES);
  syncInputWithValue(selectElement, searchInput, assets);

  // 5. Eventos
  
  // Abre el desplegable al hacer clic o enfocar el campo
  searchInput.addEventListener("click", (e) => {
    e.stopPropagation();
    // Limpia el valor momentáneamente al hacer clic para mostrar todas las opciones y facilitar la navegación
    if (selectElement.value) {
      searchInput.value = "";
      filterOptions("", dropdown);
    }
    setOpen(container, true);
  });

  searchInput.addEventListener("focus", () => {
    setOpen(container, true);
  });

  // Filtra la lista mientras se escribe en el campo de búsqueda
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    filterOptions(query, dropdown);
    dropdown.querySelectorAll(".searchable-select-item.highlighted").forEach(item => {
      item.classList.remove("highlighted");
    });
    searchInput.removeAttribute("aria-activedescendant");
  });

  // Cierra el desplegable al hacer clic fuera de él
  document.addEventListener("click", (e) => {
    if (!container.contains(e.target)) {
      setOpen(container, false);
      syncInputWithValue(selectElement, searchInput, assets);
    }
  });

  // Escucha los cambios programáticos del select original (por ejemplo, cambios de vista o botones de acción rápida)
  selectElement.addEventListener("change", () => {
    syncInputWithValue(selectElement, searchInput, assets);
  });

  // Navegación con el teclado
  const highlightItem = (item) => {
    dropdown.querySelectorAll(".searchable-select-item.highlighted").forEach(el => {
      el.classList.remove("highlighted");
    });

    if (!item) {
      searchInput.removeAttribute("aria-activedescendant");
      return;
    }

    item.classList.add("highlighted");
    searchInput.setAttribute("aria-activedescendant", item.id);
    item.scrollIntoView({ block: "nearest" });
  };

  searchInput.addEventListener("keydown", (e) => {
    const items = Array.from(dropdown.querySelectorAll(".searchable-select-item:not([style*='display: none'])"));
    if (items.length === 0) return;

    let currentIndex = items.findIndex(item => item.classList.contains("highlighted"));

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!container.classList.contains("open")) {
        setOpen(container, true);
        currentIndex = -1;
      }
      highlightItem(items[(currentIndex + 1) % items.length]);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!container.classList.contains("open")) {
        setOpen(container, true);
      }
      const previousIndex = currentIndex === -1
        ? items.length - 1
        : (currentIndex - 1 + items.length) % items.length;
      highlightItem(items[previousIndex]);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (currentIndex !== -1) {
        items[currentIndex].click();
      }
    } else if (e.key === "Escape") {
      setOpen(container, false);
      searchInput.blur();
      syncInputWithValue(selectElement, searchInput, assets);
    }
  });
}

/**
 * Rellena las opciones del menú desplegable a partir de las opciones del select.
 */
function populateDropdown(selectElement, dropdown, searchInput, assets, STATUSES) {
  dropdown.innerHTML = "";
  const options = Array.from(selectElement.options);

  let hasItems = false;
  let optionIndex = 0;

  options.forEach(opt => {
    // Omite la opción de marcador de posición vacía
    if (opt.value === "") return;

    hasItems = true;
    const item = document.createElement("div");
    item.className = "searchable-select-item";
    item.id = `${dropdown.id}-option-${optionIndex++}`;
    item.dataset.value = opt.value;
    item.setAttribute("role", "option");
    item.setAttribute("aria-selected", "false");

    // Diseño enriquecido del bien si coincide con un registro del estado
    const asset = assets.find(a => a.id === opt.value);
    if (asset) {
      const statusLabel = STATUSES[asset.status]?.label || asset.status;
      const statusClass = `status-${asset.status}`;
      
      item.innerHTML = `
        <img src="${escapeAttr(asset.photo || 'data:image/svg+xml;utf8,<svg viewBox=\"0 0 100 100\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><rect width=\"100\" height=\"100\" fill=\"%231E293B\"/><path d=\"M20 30h60v40H20z\" stroke=\"%23475569\" stroke-width=\"4\"/></svg>')}" alt="">
        <div class="searchable-select-item-info">
          <div class="searchable-select-item-name">${escapeAttr(asset.name)}</div>
          <div class="searchable-select-item-sub">
            <span class="searchable-select-item-badge">${escapeAttr(asset.nroBien)}</span>
            <span class="searchable-select-item-department">${escapeAttr(asset.department || "Sin departamento")}</span>
            <span class="searchable-select-status-badge ${statusClass}">${escapeAttr(statusLabel)}</span>
          </div>
        </div>
      `;
      // Texto auxiliar para la búsqueda
      const specs = asset.technicalSpecs || {};
      item.dataset.search = [
        asset.name,
        asset.nroBien,
        asset.department,
        specs.brand,
        specs.model,
        specs.serialNumber,
        specs.processor,
        specs.ram,
        specs.storage
      ].filter(Boolean).join(" ").toLowerCase();
    } else {
      // Alternativa con el texto estándar de la opción
      item.innerHTML = `
        <div class="searchable-select-item-info">
          <div class="searchable-select-item-name">${escapeAttr(opt.textContent)}</div>
        </div>
      `;
      item.dataset.search = opt.textContent.toLowerCase();
    }

    // Manejo del evento de selección de un elemento
    item.addEventListener("click", () => {
      selectElement.value = opt.value;
      selectElement.dispatchEvent(new Event("change"));
      
      searchInput.value = opt.textContent;
      dropdown.querySelectorAll(".searchable-select-item").forEach(i => {
        i.classList.remove("highlighted");
        i.setAttribute("aria-selected", "false");
      });
      item.classList.add("highlighted");
      item.setAttribute("aria-selected", "true");
      
      setOpen(selectElement.parentElement, false);
    });

    dropdown.appendChild(item);
  });

  // Fila auxiliar cuando no hay resultados
  const noResults = document.createElement("div");
  noResults.className = "searchable-select-no-results";
  noResults.setAttribute("role", "status");
  noResults.textContent = "No se encontraron equipos";
  noResults.style.display = "none";
  dropdown.appendChild(noResults);

  if (!hasItems) {
    noResults.style.display = "block";
    noResults.textContent = "No hay equipos disponibles";
  }
}

/**
 * Filtra dinámicamente los elementos de la lista.
 */
function filterOptions(query, dropdown) {
  const items = Array.from(dropdown.querySelectorAll(".searchable-select-item"));
  const noResults = dropdown.querySelector(".searchable-select-no-results");
  let matches = 0;

  items.forEach(item => {
    const text = item.dataset.search || "";
    if (text.includes(query)) {
      item.style.display = "flex";
      matches++;
    } else {
      item.style.display = "none";
      item.classList.remove("highlighted");
    }
  });

  if (noResults) {
    noResults.style.display = matches === 0 ? "block" : "none";
  }
}

/**
 * Abre o cierra la lista desplegable manteniendo sincronizado el estado ARIA.
 */
function setOpen(container, isOpen) {
  if (!container) return;
  container.classList.toggle("open", isOpen);
  const input = container.querySelector(".searchable-select-input");
  if (input) {
    input.setAttribute("aria-expanded", String(isOpen));
    if (!isOpen) input.removeAttribute("aria-activedescendant");
  }
}

/**
 * Sincroniza el campo de texto visible con el valor actual del elemento select subyacente.
 */
function syncInputWithValue(selectElement, searchInput, assets) {
  const value = selectElement.value;
  if (!value) {
    searchInput.value = "";
    return;
  }

  const selectedOption = selectElement.options[selectElement.selectedIndex];
  if (selectedOption) {
    const asset = assets.find(a => a.id === value);
    if (asset) {
      searchInput.value = `${asset.nroBien} - ${asset.name}`;
    } else {
      searchInput.value = selectedOption.textContent;
    }
  } else {
    searchInput.value = "";
  }
}
