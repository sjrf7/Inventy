import { DEPARTMENTS, STATUSES, ASSET_SVGS } from '../../seed-data.js';
import { loadState, getAssets, addAsset, updateAsset } from './state.js';
import { setupRouter, switchView, getActiveView } from './router.js';
import { initDashboard } from './views/dashboard.js';
import { renderInventoryList } from './views/inventory.js';
import { setupTransfersView, renderTransfersTimeline } from './views/transfers.js';
import { setupSupportView, renderPendingSupportList } from './views/support.js';
import { setupCalendarView } from './views/calendar.js';
import { generateReport } from './views/reports.js';
import { openAssetDetailModal, openAssetFormModal } from './components/modals.js';
import { convertToBase64, getLocalISOTime, getAssetFallbackImage, escapeAttr, escapeHtml, getDepartmentOptions } from './utils.js';
import { initMotion, closeModal, closeAllModals, revealPreview, runThemeTransition } from './motion.js';
import { initAuth } from './auth.js?v=1.2.6';

let uploadedImageBase64 = null;
let activeDetailAssetId = null;
let appInitialized = false;
let assetFormDirty = false;

/**
 * Direcciones institucionales combinadas con las que existen en el inventario.
 * @returns {Array<string>}
 */
function getDepartments() {
  return getDepartmentOptions(getAssets(), DEPARTMENTS);
}

/**
 * Muestra alertas modernas SweetAlert2 personalizadas.
 */
function showAppAlert(title, text, icon = 'info') {
  if (window.Swal) {
    return window.Swal.fire({
      title: title,
      text: text,
      icon: icon,
      confirmButtonText: 'Aceptar',
      customClass: {
        popup: 'swal-popup-custom',
        title: 'swal-title-custom',
        htmlContainer: 'swal-text-custom',
        confirmButton: 'swal-btn-confirm'
      },
      buttonsStyling: false,
      showClass: {
        popup: 'swal-show-animation'
      },
      hideClass: {
        popup: 'swal-hide-animation'
      }
    });
  } else {
    alert(`${title}\n${text}`);
    return Promise.resolve();
  }
}

/**
 * Muestra una confirmación de dos opciones y resuelve a true solo si el
 * usuario confirma la acción.
 * @param {string} title
 * @param {string} text
 * @param {string} confirmButtonText
 * @param {string} cancelButtonText
 * @returns {Promise<boolean>}
 */
function showAppConfirm(title, text, confirmButtonText = 'Sí, continuar', cancelButtonText = 'Cancelar') {
  if (window.Swal) {
    return window.Swal.fire({
      title: title,
      text: text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: confirmButtonText,
      cancelButtonText: cancelButtonText,
      customClass: {
        popup: 'swal-popup-custom',
        title: 'swal-title-custom',
        htmlContainer: 'swal-text-custom',
        confirmButton: 'swal-btn-confirm',
        cancelButton: 'swal-btn-cancel'
      },
      buttonsStyling: false,
      showClass: {
        popup: 'swal-show-animation'
      },
      hideClass: {
        popup: 'swal-hide-animation'
      }
    }).then(result => result.isConfirmed);
  }

  return Promise.resolve(window.confirm(`${title}\n\n${text}`));
}

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

/**
 * Inicializa la aplicación y arranca todo el sistema.
 */
function initApp() {
  // Activa la capa de movimiento (indicadores, foco suave, transiciones)
  initMotion();

  // Inicialización del tema visual
  const savedTheme = localStorage.getItem("inventy_theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);
  updateThemeColor(savedTheme);
  
  // Inicializa la capa de autenticación y sus eventos
  initAuth(() => {
    if (appInitialized) {
      renderAll();
      return;
    }
    
    // Carga los datos desde la API REST de PHP y luego inicializa las vistas
    loadState().then(() => {
      populateFilterSelects();
      
      // Vincula el enrutador para los cambios de vista de la SPA
      setupRouter((viewName) => {
        renderView(viewName);
      });
      
      // Configura los eventos de formularios y clics
      setupEventListeners();

      // Renderizado inicial de la interfaz
      renderAll();
      
      appInitialized = true;
    }).catch(err => {
      showAppAlert("Error de Base de Datos", err.message, "error");
    });
  });
}

/**
 * Ejecuta el renderizado de una vista concreta.
 */
function renderView(viewName) {
  const assets = getAssets();
  if (viewName === "dashboard") {
    initDashboard(assets, STATUSES, DEPARTMENTS);
  } else if (viewName === "inventory") {
    renderInventoryList(assets, STATUSES, onDetailClick, onSupportClick);
  } else if (viewName === "transfers") {
    setupTransfersView(assets, getDepartments());
  } else if (viewName === "support") {
    setupSupportView(assets, STATUSES);
    const userStr = localStorage.getItem("inventy_user") || sessionStorage.getItem("inventy_user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const techInput = document.getElementById("support-technician");
        if (techInput) {
          techInput.value = user.fullname || user.username;
        }
      } catch (e) {}
    }
  } else if (viewName === "calendar") {
    setupCalendarView(assets, STATUSES);
  } else if (viewName === "reports") {
    generateReport(assets, STATUSES, DEPARTMENTS);
  }
}

/**
 * Vuelve a renderizar la vista que se encuentra activa en ese momento.
 */
function renderAll() {
  const activeView = getActiveView();
  renderView(activeView);
}

/**
 * Rellena las opciones de los filtros y de los formularios.
 */
function populateFilterSelects() {
  const filterDept = document.getElementById("filter-dept");
  const formDept = document.getElementById("form-department");
  const reportDept = document.getElementById("report-param-dept");
  
  if (filterDept && formDept && reportDept) {
    filterDept.innerHTML = '<option value="">Todas las Direcciones</option>';
    formDept.innerHTML = '<option value="">Seleccione Dirección…</option>';
    reportDept.innerHTML = '';
    
    getDepartments().forEach(dept => {
      const opt1 = document.createElement("option");
      opt1.value = dept;
      opt1.textContent = dept;
      filterDept.appendChild(opt1);
      
      const opt2 = document.createElement("option");
      opt2.value = dept;
      opt2.textContent = dept;
      formDept.appendChild(opt2);
      
      const opt3 = document.createElement("option");
      opt3.value = dept;
      opt3.textContent = dept;
      reportDept.appendChild(opt3);
    });
  }
  
  const filterStatus = document.getElementById("filter-status");
  const reportStatus = document.getElementById("report-param-status");
  
  if (filterStatus && reportStatus) {
    filterStatus.innerHTML = '<option value="">Todos los Estados</option>';
    reportStatus.innerHTML = '';
    
    Object.keys(STATUSES).forEach(statusKey => {
      const opt1 = document.createElement("option");
      opt1.value = statusKey;
      opt1.textContent = STATUSES[statusKey].label;
      filterStatus.appendChild(opt1);
      
      const opt2 = document.createElement("option");
      opt2.value = statusKey;
      opt2.textContent = STATUSES[statusKey].label;
      reportStatus.appendChild(opt2);
    });
  }
}

/**
 * Acción al hacer clic en el botón de detalles de una tarjeta de bien.
 */
function onDetailClick(assetId) {
  activeDetailAssetId = assetId;
  openAssetDetailModal(assetId, getAssets(), STATUSES, ASSET_SVGS);
}

/**
 * Acción al hacer clic en el botón de soporte rápido de una tarjeta de bien.
 */
function onSupportClick(asset) {
  switchView("support", (view) => {
    renderView(view);
    setTimeout(() => {
      const supportSelect = document.getElementById("support-asset-id");
      if (supportSelect) {
        supportSelect.value = asset.id;
        supportSelect.dispatchEvent(new Event("change"));
      }
    }, 100);
  });
}

/**
 * Configura los eventos de la barra lateral, búsqueda, cambio de tema, modales y arrastrar y soltar.
 */
function setupEventListeners() {
  // Alternar barra lateral en dispositivos móviles
  const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener("click", () => {
      const sidebar = document.getElementById("app-sidebar");
      const scrim = document.getElementById("sidebar-scrim");
      const isOpen = sidebar?.classList.toggle("active");
      scrim?.classList.toggle("active", Boolean(isOpen));
      mobileMenuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      mobileMenuToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
    });
  }

  // Cierra la barra lateral y los modales con la tecla Escape
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    // SweetAlert2 gestiona su propio cierre con Escape
    if (window.Swal?.isVisible?.()) return;

    const sidebar = document.getElementById("app-sidebar");
    const menuToggle = document.getElementById("mobile-menu-toggle");
    if (sidebar?.classList.contains("active")) {
      sidebar.classList.remove("active");
      document.getElementById("sidebar-scrim")?.classList.remove("active");
      menuToggle?.setAttribute("aria-expanded", "false");
      menuToggle?.setAttribute("aria-label", "Abrir menú");
    }

    // Si el formulario de bienes tiene cambios, pide confirmación antes de cerrar
    const activeFormModal = document.getElementById("modal-asset-form");
    if (activeFormModal?.classList.contains("active") && assetFormDirty) {
      closeFormModal();
      return;
    }

    closeAllModals();
    activeDetailAssetId = null;
  });
  
  // Cierra la barra lateral al hacer clic fuera de ella en móviles
  document.addEventListener("click", (e) => {
    const sidebar = document.getElementById("app-sidebar");
    const toggleBtn = document.getElementById("mobile-menu-toggle");
    
    if (sidebar && toggleBtn && window.innerWidth <= 768) {
      if (sidebar.classList.contains("active") && !sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
        sidebar.classList.remove("active");
        document.getElementById("sidebar-scrim")?.classList.remove("active");
        toggleBtn.setAttribute("aria-expanded", "false");
        toggleBtn.setAttribute("aria-label", "Abrir menú");
      }
    }
  });

  // Cambio de tema claro/oscuro con transición de material
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      const newTheme = currentTheme === "dark" ? "light" : "dark";

      runThemeTransition(() => {
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("inventy_theme", newTheme);
        updateThemeIcon(newTheme);
        updateThemeColor(newTheme);
        renderAll(); // Redibuja el gráfico de dona aplicando las variables de tema
      }, themeToggle);
    });
  }

  // Botón de alta rápida de bienes
  const btnQuickAdd = document.getElementById("btn-quick-add");
  if (btnQuickAdd) {
    btnQuickAdd.addEventListener("click", () => {
      openAssetFormModal(null, getAssets(), ASSET_SVGS, (img) => {
        uploadedImageBase64 = img;
      });
      // Preselecciona los filtros activos si están definidos
      const currentDeptFilter = document.getElementById("filter-dept")?.value;
      if (currentDeptFilter) {
        const formDept = document.getElementById("form-department");
        if (formDept) formDept.value = currentDeptFilter;
      }
      assetFormDirty = false;
    });
  }

  // Búsqueda global de bienes (con retardo corto para no redibujar por tecla)
  const globalSearch = document.getElementById("global-search");
  if (globalSearch) {
    let searchDebounce;
    globalSearch.addEventListener("input", () => {
      window.clearTimeout(searchDebounce);
      searchDebounce = window.setTimeout(() => {
        const activeView = getActiveView();
        if (activeView !== "inventory") {
          switchView("inventory", (view) => {
            renderView(view);
          });
        } else {
          renderInventoryList(getAssets(), STATUSES, onDetailClick, onSupportClick);
        }
      }, 140);
    });
  }

  // Controladores de cambio de filtros del inventario
  const filterDept = document.getElementById("filter-dept");
  const filterStatus = document.getElementById("filter-status");
  const sortBy = document.getElementById("sort-by");

  const triggerInventoryRender = () => {
    renderInventoryList(getAssets(), STATUSES, onDetailClick, onSupportClick);
  };

  if (filterDept) filterDept.addEventListener("change", triggerInventoryRender);
  if (filterStatus) filterStatus.addEventListener("change", triggerInventoryRender);
  if (sortBy) sortBy.addEventListener("change", triggerInventoryRender);

  // Acciones de cierre y edición del modal de detalles
  const btnCloseDetail = document.getElementById("btn-close-detail");
  const btnDetailClose = document.getElementById("btn-detail-close");
  const btnEditAsset = document.getElementById("btn-edit-asset");

  const closeDetailModal = () => {
    closeModal(document.getElementById("modal-asset-detail"));
    activeDetailAssetId = null;
  };

  if (btnCloseDetail) btnCloseDetail.addEventListener("click", closeDetailModal);
  if (btnDetailClose) btnDetailClose.addEventListener("click", closeDetailModal);
  
  if (btnEditAsset) {
    btnEditAsset.addEventListener("click", () => {
      if (activeDetailAssetId) {
        const id = activeDetailAssetId;
        closeDetailModal();
        setTimeout(() => {
          openAssetFormModal(id, getAssets(), ASSET_SVGS, (img) => {
            uploadedImageBase64 = img;
          });
          assetFormDirty = false;
        }, 150);
      }
    });
  }

  // Cambio de pestañas dentro de los detalles del bien (patrón ARIA tabs)
  const tabButtons = Array.from(document.querySelectorAll(".detail-tab-btn"));
  const tabPanels = Array.from(document.querySelectorAll(".tab-pane"));

  const activateTab = (btn, focus = false) => {
    if (!btn) return;
    const targetTab = btn.getAttribute("data-tab");

    tabButtons.forEach(b => {
      const selected = b === btn;
      b.classList.toggle("active", selected);
      b.setAttribute("aria-selected", String(selected));
      b.tabIndex = selected ? 0 : -1;
    });

    tabPanels.forEach(pane => {
      pane.classList.toggle("active", pane.id === targetTab);
    });

    if (focus) btn.focus();
  };

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => activateTab(btn));
    btn.addEventListener("keydown", (e) => {
      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
      e.preventDefault();

      const currentIndex = tabButtons.indexOf(btn);
      let nextIndex = currentIndex;

      if (e.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabButtons.length;
      if (e.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
      if (e.key === "Home") nextIndex = 0;
      if (e.key === "End") nextIndex = tabButtons.length - 1;

      activateTab(tabButtons[nextIndex], true);
    });
  });

  // Acciones de los botones del modal de formulario
  const btnCloseForm = document.getElementById("btn-close-form");
  const btnCancelForm = document.getElementById("btn-cancel-form");
  const formModal = document.getElementById("modal-asset-form");

  const closeFormModal = () => {
    if (!formModal) return Promise.resolve();

    if (!assetFormDirty) {
      closeModal(formModal);
      return Promise.resolve();
    }

    return showAppConfirm(
      "¿Descartar cambios?",
      "Los datos ingresados en este formulario se perderán.",
      "Sí, descartar",
      "Seguir editando"
    ).then(confirmed => {
      if (!confirmed) return;
      assetFormDirty = false;
      closeModal(formModal);
    });
  };

  if (btnCloseForm) btnCloseForm.addEventListener("click", closeFormModal);
  if (btnCancelForm) btnCancelForm.addEventListener("click", closeFormModal);

  // El clic en el fondo y la tecla Escape también deben respetar los cambios.
  // El listener se registra antes que el de motion.js y lo intercepta para que
  // el modal no se cierre sin confirmación.
  if (formModal) {
    formModal.addEventListener("pointerdown", (event) => {
      if (event.target !== formModal || !assetFormDirty) return;
      event.stopImmediatePropagation();
      closeFormModal();
    }, true);
  }

  // Carga de imagen mediante arrastrar y soltar
  const uploadArea = document.getElementById("image-upload-area");
  const fileInput = document.getElementById("form-image-input");
  
  if (uploadArea && fileInput) {
    uploadArea.addEventListener("click", () => fileInput.click());
    
    fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        processUploadedImage(e.target.files[0]);
      }
    });
    
    uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = "var(--primary)";
    });
    
    uploadArea.addEventListener("dragleave", () => {
      uploadArea.style.borderColor = "var(--border-color)";
    });
    
    uploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = "var(--border-color)";
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processUploadedImage(e.dataTransfer.files[0]);
      }
    });
  }

  // Envío del formulario de bienes (alta/edición)
  const assetForm = document.getElementById("asset-upsert-form");
  if (assetForm) {
    assetForm.addEventListener("input", () => {
      assetFormDirty = true;
    });
    assetForm.addEventListener("change", () => {
      assetFormDirty = true;
    });
    assetForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleAssetFormSubmit();
    });
  }

  // Cambio de bien seleccionado en el formulario de traspaso (vista previa)
  const transferAssetId = document.getElementById("transfer-asset-id");
  if (transferAssetId) {
    transferAssetId.addEventListener("change", (e) => {
      const selectedId = e.target.value;
      const previewDiv = document.getElementById("transfer-asset-preview");
      const originInput = document.getElementById("transfer-origin-dept");
      
      if (!previewDiv || !originInput) return;

      if (!selectedId) {
        previewDiv.style.display = "none";
        originInput.value = "";
        return;
      }
      
      const asset = getAssets().find(a => a.id === selectedId);
      if (asset) {
        originInput.value = asset.department;
        
        previewDiv.innerHTML = `
          <div class="asset-select-card">
            <img src="${escapeAttr(asset.photo || getAssetFallbackImage(asset.name))}" alt="${escapeAttr(asset.name)}" width="44" height="44" loading="lazy">
            <div class="asset-select-info">
              <span class="asset-select-name">${escapeHtml(asset.name)}</span>
              <span class="asset-select-nro">${escapeHtml(asset.nroBien)}</span>
              <span style="font-size:12px; color:var(--text-muted);">Estado: ${escapeHtml(STATUSES[asset.status]?.label || asset.status)}</span>
            </div>
          </div>
        `;
        previewDiv.style.display = "block";
        revealPreview(previewDiv);
      }
    });
  }

  // Envío del formulario de traspaso
  const transferForm = document.getElementById("transfer-form");
  if (transferForm) {
    transferForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleTransferSubmit();
    });
  }

  // Cambio de bien seleccionado en el formulario de soporte técnico
  const supportAssetId = document.getElementById("support-asset-id");
  if (supportAssetId) {
    supportAssetId.addEventListener("change", (e) => {
      const selectedId = e.target.value;
      const previewDiv = document.getElementById("support-asset-preview");
      
      if (!previewDiv) return;

      if (!selectedId) {
        previewDiv.style.display = "none";
        return;
      }
      
      const asset = getAssets().find(a => a.id === selectedId);
      if (asset) {
        previewDiv.innerHTML = `
          <div class="asset-select-card">
            <img src="${escapeAttr(asset.photo || getAssetFallbackImage(asset.name))}" alt="${escapeAttr(asset.name)}" width="44" height="44" loading="lazy">
            <div class="asset-select-info">
              <span class="asset-select-name">${escapeHtml(asset.name)}</span>
              <span class="asset-select-nro">${escapeHtml(asset.nroBien)}</span>
              <span style="font-size:12px; color:var(--text-muted);">Ubicación: <strong>${escapeHtml(asset.department)}</strong></span>
              <span style="font-size:12px; color:var(--text-muted);">Estado Actual: <strong>${escapeHtml(STATUSES[asset.status]?.label || asset.status)}</strong></span>
            </div>
          </div>
        `;
        previewDiv.style.display = "block";
        revealPreview(previewDiv);
        
        const nextStatus = document.getElementById("support-status-after");
        if (nextStatus) nextStatus.value = "activo";
      }
    });
  }

  // Envío del formulario de reporte de diagnóstico de soporte
  const supportReportForm = document.getElementById("support-report-form");
  if (supportReportForm) {
    supportReportForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleSupportSubmit();
    });
  }

  // Parámetros y disparadores de los reportes
  const reportType = document.getElementById("report-type");
  const reportParamDept = document.getElementById("report-param-dept");
  const reportParamStatus = document.getElementById("report-param-status");

  const runReportsGenerator = () => {
    generateReport(getAssets(), STATUSES, DEPARTMENTS);
  };

  // Controlador de selección de las tarjetas de reporte
  const reportOptionCards = document.querySelectorAll(".report-option-card");
  reportOptionCards.forEach(card => {
    card.addEventListener("click", () => {
      reportOptionCards.forEach(c => {
        c.classList.remove("active");
        c.setAttribute("aria-pressed", "false");
      });
      card.classList.add("active");
      card.setAttribute("aria-pressed", "true");
      
      const val = card.getAttribute("data-value");
      if (reportType) {
        reportType.value = val;
      }
      
      const deptWrapper = document.getElementById("report-param-dept-wrapper");
      const statusWrapper = document.getElementById("report-param-status-wrapper");
      
      if (deptWrapper && statusWrapper) {
        if (val === "institucion" || val === "condicion") {
          deptWrapper.style.display = "none";
          statusWrapper.style.display = "none";
        } else if (val === "direccion") {
          deptWrapper.style.display = "block";
          statusWrapper.style.display = "none";
        } else if (val === "estado") {
          deptWrapper.style.display = "none";
          statusWrapper.style.display = "block";
        }
      }
      runReportsGenerator();
    });
  });

  if (reportParamDept) reportParamDept.addEventListener("change", runReportsGenerator);
  if (reportParamStatus) reportParamStatus.addEventListener("change", runReportsGenerator);

  // Acción del botón de imprimir reporte
  const btnPrintReport = document.getElementById("btn-print-report");
  if (btnPrintReport) {
    btnPrintReport.addEventListener("click", () => {
      window.print();
    });
  }
}

/**
 * Procesa la imagen seleccionada y la convierte a Base64 para su previsualización.
 */
function processUploadedImage(file) {
  assetFormDirty = true;
  convertToBase64(file).then(base64 => {
    uploadedImageBase64 = base64;
    
    const preview = document.getElementById("form-image-preview");
    const svgEl = document.getElementById("image-upload-area")?.querySelector("svg");
    const textEl = document.getElementById("image-upload-area")?.querySelector(".image-upload-text");

    if (preview) {
      preview.src = base64;
      preview.style.display = "block";
      revealPreview(preview);
    }
    if (svgEl) svgEl.style.display = "none";
    if (textEl) textEl.style.display = "none";
  }).catch(err => {
    console.error("Error cargando la foto del bien:", err);
  });
}

/**
 * Lógica de envío del formulario para crear y modificar bienes.
 */
async function handleAssetFormSubmit() {
  const idField = document.getElementById("form-asset-id").value;
  const nroBien = document.getElementById("form-nro-bien").value.trim();
  const name = document.getElementById("form-name").value.trim();
  const department = document.getElementById("form-department").value;
  const status = document.getElementById("form-status").value;
  const condition = document.getElementById("form-condition").value;
  const description = document.getElementById("form-description").value.trim();
  
  // Especificaciones técnicas
  const brand = document.getElementById("form-brand").value.trim();
  const model = document.getElementById("form-model").value.trim();
  const serialNumber = document.getElementById("form-serial").value.trim();
  const processor = document.getElementById("form-processor").value.trim();
  const ram = document.getElementById("form-ram").value.trim();
  const storage = document.getElementById("form-storage").value.trim();
  
  const isEdit = idField !== "";
  
  // Asigna la imagen de ficha según el tipo de equipo si no se subió fotografía
  let photo = uploadedImageBase64;
  if (!photo) {
    photo = getAssetFallbackImage(name);
  }
  
  let savePromise;
  
  if (isEdit) {
    const asset = getAssets().find(a => a.id === idField);
    if (!asset) return;
    
    const oldStatus = asset.status;
    const oldDept = asset.department;

    // Desincorporar es una acción irreversible para el inventario activo:
    // se pide confirmación explícita antes de guardar.
    if (status === "desincorporado" && oldStatus !== "desincorporado") {
      const confirmed = await showAppConfirm(
        "¿Desincorporar este bien?",
        `“${asset.name}” quedará fuera de servicio y el cambio se registrará en su historial.`,
        "Sí, desincorporar",
        "Cancelar"
      );
      if (!confirmed) return;
    }
    
    const updated = {
      name,
      description,
      photo,
      condition,
      technicalSpecs: { brand, model, serialNumber, processor, ram, storage }
    };
    
    // Registro de cambios de estado
    if (oldStatus !== status) {
      updated.status = status;
      const history = [...(asset.history || [])];
      const userStr = localStorage.getItem("inventy_user") || sessionStorage.getItem("inventy_user");
      let currentUser = "Samuel";
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          currentUser = u.fullname || u.username;
        } catch (e) {}
      }
      
      history.push({
        id: "H-" + Date.now(),
        date: new Date().toISOString(),
        type: status === "desincorporado" ? "desincorporacion" : "cambio_estado",
        user: `${currentUser} (Soporte)`,
        details: `Cambio manual de estado de “${STATUSES[oldStatus]?.label || oldStatus}” a “${STATUSES[status]?.label || status}”.`
      });
      updated.history = history;
    }
    
    // Registro de cambios de departamento
    if (oldDept !== department) {
      updated.department = department;
      const history = [...(asset.history || [])];
      const userStr = localStorage.getItem("inventy_user") || sessionStorage.getItem("inventy_user");
      let currentUser = "Samuel";
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          currentUser = u.fullname || u.username;
        } catch (e) {}
      }
      
      history.push({
        id: "H-" + Date.now(),
        date: new Date().toISOString(),
        type: "traspaso",
        user: `${currentUser} (Soporte)`,
        details: `Reubicación del equipo de “${oldDept}” a “${department}” vía edición de ficha.`
      });
      updated.history = history;
    }
    
    savePromise = updateAsset(idField, updated);
  } else {
    // Verificación de duplicados
    const duplicate = getAssets().find(a => a.nroBien.toLowerCase() === nroBien.toLowerCase());
    if (duplicate) {
      showAppAlert("Equipo duplicado", `Ya existe un equipo registrado con el NRO de Bien '${nroBien}'.`, "warning");
      return;
    }
    
    const newAsset = {
      nroBien,
      name,
      description,
      status,
      condition,
      department,
      photo,
      technicalSpecs: { brand, model, serialNumber, processor, ram, storage }
    };
    
    savePromise = addAsset(newAsset);
  }
  
  savePromise.then(() => {
    assetFormDirty = false;
    closeModal(document.getElementById("modal-asset-form"));
    populateFilterSelects();
    renderAll();
  }).catch(err => {
    showAppAlert("Error", "No se pudo guardar la información del bien: " + err.message, "error");
  });
}

/**
 * Lógica de envío del formulario para reubicar bienes.
 */
function handleTransferSubmit() {
  const assetId = document.getElementById("transfer-asset-id").value;
  const destDept = document.getElementById("transfer-dest-dept").value;
  const authorizedBy = document.getElementById("transfer-authorized-by").value.trim();
  const dateVal = document.getElementById("transfer-date").value;
  const reason = document.getElementById("transfer-reason").value.trim();
  
  const asset = getAssets().find(a => a.id === assetId);
  if (!asset) return;
  
  const originDept = asset.department;
  
  if (originDept === destDept) {
    showAppAlert("Operación Inválida", "La oficina de destino debe ser diferente de la dirección de origen.", "warning");
    return;
  }
  
  const transferDate = dateVal ? new Date(dateVal).toISOString() : new Date().toISOString();
  
  const updatedHistory = [...(asset.history || [])];
  updatedHistory.push({
    id: "H-" + Date.now(),
    date: transferDate,
    type: "traspaso",
    user: authorizedBy,
    details: `Traspaso autorizado de “${originDept}” a “${destDept}”. Motivo: ${reason}`
  });
  
  updateAsset(assetId, {
    department: destDept,
    history: updatedHistory
  }).then(() => {
    // Reinicia los campos del formulario de traspaso
    const form = document.getElementById("transfer-form");
    if (form) form.reset();
    
    setupTransfersView(getAssets(), getDepartments());
    
    showAppAlert("Transferencia Exitosa", `El equipo ${asset.nroBien} fue transferido con éxito a la dirección ${destDept}.`, "success");
    switchView("inventory", (view) => {
      renderView(view);
    });
  }).catch(err => {
    showAppAlert("Error de Transferencia", "No se pudo transferir el equipo: " + err.message, "error");
  });
}

/**
 * Lógica de envío del formulario de reportes técnicos de mantenimiento.
 */
async function handleSupportSubmit() {
  const assetId = document.getElementById("support-asset-id").value;
  const technician = document.getElementById("support-technician").value.trim();
  const statusAfter = document.getElementById("support-status-after").value;
  const diagnosis = document.getElementById("support-diagnosis").value.trim();
  const action = document.getElementById("support-action").value.trim();
  
  const asset = getAssets().find(a => a.id === assetId);
  if (!asset) return;
  
  const statusBefore = asset.status;

  if (statusAfter === "desincorporado" && statusBefore !== "desincorporado") {
    const confirmed = await showAppConfirm(
      "¿Desincorporar este bien?",
      `“${asset.name}” quedará fuera de servicio al guardar el informe técnico.`,
      "Sí, desincorporar",
      "Cancelar"
    );
    if (!confirmed) return;
  }
  const reportDate = new Date().toISOString();
  const reportId = "REP-" + Date.now();
  
  const updatedReports = [...(asset.reports || [])];
  updatedReports.push({
    id: reportId,
    date: reportDate,
    technician,
    diagnosis,
    actionTaken: action,
    statusBefore,
    statusAfter
  });
  
  const updatedHistory = [...(asset.history || [])];
  updatedHistory.push({
    id: "H-" + Date.now(),
    date: reportDate,
    type: "mantenimiento",
    user: technician,
    details: `Informe Técnico. Falla: “${diagnosis}”. Acción: “${action}”. Estado final: ${STATUSES[statusAfter]?.label || statusAfter}.`
  });
  
  updateAsset(assetId, {
    status: statusAfter,
    reports: updatedReports,
    history: updatedHistory
  }).then(() => {
    // Reinicia el formulario de soporte técnico
    const form = document.getElementById("support-report-form");
    if (form) {
      form.reset();
      const techInput = document.getElementById("support-technician");
      if (techInput) {
        const userStr = localStorage.getItem("inventy_user") || sessionStorage.getItem("inventy_user");
        let defaultTech = "Samuel";
        if (userStr) {
          try {
            defaultTech = JSON.parse(userStr).fullname || defaultTech;
          } catch (e) {}
        }
        techInput.value = defaultTech;
      }
    }
    
    setupSupportView(getAssets(), STATUSES);
    
    showAppAlert("Soporte Registrado", `Informe técnico registrado para el bien ${asset.nroBien}. Estado actualizado a: ${STATUSES[statusAfter]?.label || statusAfter}.`, "success");
    switchView("inventory", (view) => {
      renderView(view);
    });
  }).catch(err => {
    showAppAlert("Error de Soporte", "No se pudo registrar la asistencia técnica: " + err.message, "error");
  });
}

/**
 * Mantiene el color de la barra del navegador alineado con el tema activo.
 * @param {string} theme - "dark" | "light"
 */
function updateThemeColor(theme) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  meta.setAttribute("content", theme === "light" ? "#F6F8FB" : "#0A0C12");
}

/**
 * Actualiza la visibilidad del icono del selector de tema en el encabezado.
 */
function updateThemeIcon(theme) {
  const sunIcon = document.getElementById("theme-icon-sun");
  const moonIcon = document.getElementById("theme-icon-moon");
  const toggle = document.getElementById("theme-toggle");
  const isLight = theme === "light";

  if (toggle) {
    toggle.setAttribute("aria-pressed", String(isLight));
    toggle.setAttribute("aria-label", isLight ? "Cambiar a tema oscuro" : "Cambiar a tema claro");
    toggle.setAttribute("title", isLight ? "Cambiar a tema oscuro" : "Cambiar a tema claro");
  }
  
  if (sunIcon && moonIcon) {
    if (theme === "dark") {
      sunIcon.style.display = "none";
      moonIcon.style.display = "block";
    } else {
      sunIcon.style.display = "block";
      moonIcon.style.display = "none";
    }
  }
}
