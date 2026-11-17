/**
 * Motor de enrutamiento de Inventy
 */

import { updateNavIndicator } from './motion.js';

const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

export const VIEWS = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Resumen analítico de los bienes nacionales de la institución"
  },
  inventory: {
    title: "Inventario General",
    subtitle: "Búsqueda, filtrado y administración de bienes registrados"
  },
  transfers: {
    title: "Traspaso de Bienes",
    subtitle: "Registros y transferencias de equipos entre oficinas y direcciones"
  },
  support: {
    title: "Soporte Técnico",
    subtitle: "Informes de reparaciones, diagnósticos y mantenimiento técnico"
  },
  calendar: {
    title: "Calendario de Mantenimiento",
    subtitle: "Cronograma anual de mantenimientos preventivos y correctivos"
  },
  reports: {
    title: "Reportes Institucionales",
    subtitle: "Generación de informes formales detallados y actas de bienes"
  }
};

/** Hash público de cada vista: permite enlaces profundos y atrás/adelante. */
const HASH_BY_VIEW = {
  dashboard: "dashboard",
  inventory: "inventario",
  transfers: "traspasos",
  support: "soporte",
  calendar: "calendario",
  reports: "reportes"
};

const VIEW_BY_HASH = {
  dashboard: "dashboard",
  inventario: "inventory",
  inventory: "inventory",
  traspasos: "transfers",
  transfers: "transfers",
  soporte: "support",
  support: "support",
  calendario: "calendar",
  calendar: "calendar",
  reportes: "reports",
  reports: "reports"
};

let activeView = "dashboard";

/**
 * Devuelve el nombre de la vista que se encuentra activa.
 * @returns {string}
 */
export function getActiveView() {
  return activeView;
}

/**
 * Inicializa el sistema de enrutamiento y vincula los eventos de clic de los elementos de navegación.
 * @param {Function} onViewSwitch - Callback que se ejecuta al cambiar de vista
 */
export function setupRouter(onViewSwitch) {
  // Los enlaces de navegación conservan su href (#inventario, #traspasos…):
  // el navegador actualiza la URL y el hashchange hace el cambio de vista.
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
      // Cierra la barra lateral al elegir una vista en móviles
      const sidebar = document.getElementById("app-sidebar");
      const menuToggle = document.getElementById("mobile-menu-toggle");
      if (sidebar) sidebar.classList.remove("active");
      document.getElementById("sidebar-scrim")?.classList.remove("active");
      menuToggle?.setAttribute("aria-expanded", "false");
      menuToggle?.setAttribute("aria-label", "Abrir menú");
    });
  });

  const handleHash = () => {
    const hash = window.location.hash.replace("#", "").toLowerCase();
    const matchingView = VIEW_BY_HASH[hash];
    if (!matchingView) {
      window.history.replaceState(null, "", "#dashboard");
    }
    switchView(matchingView || "dashboard", onViewSwitch, false);
  };

  window.addEventListener("hashchange", handleHash);
  window.addEventListener("popstate", handleHash);

  if (window.location.hash) {
    handleHash();
  } else {
    // La vista inicial es el dashboard; reflejarlo en la URL sin recargar.
    window.history.replaceState(null, "", "#dashboard");
    switchView("dashboard", onViewSwitch, false);
  }
}

/**
 * Cambia de forma programática el panel de vista activo.
 * @param {string} viewName - Clave del nombre de la vista
 * @param {Function} onViewSwitch - Callback que se dispara al cambiar de vista
 * @param {boolean} [updateHash=true] - Reflejar la vista en la URL
 */
export function switchView(viewName, onViewSwitch, updateHash = true) {
  if (!VIEWS[viewName]) return;
  
  activeView = viewName;

  // La URL es la fuente de verdad de la vista activa (atrás/adelante y enlaces)
  if (updateHash) {
    const targetHash = `#${HASH_BY_VIEW[viewName]}`;
    if (window.location.hash !== targetHash) {
      window.history.pushState(null, "", targetHash);
    }
  }
  
  // Actualiza la clase activa en la barra lateral
  document.querySelectorAll(".nav-item").forEach(item => {
    const isActive = item.getAttribute("data-view") === viewName;
    item.classList.toggle("active", isActive);
    const link = item.querySelector("a");
    if (isActive) {
      link?.setAttribute("aria-current", "page");
    } else {
      link?.removeAttribute("aria-current");
    }
  });
  
  // Cambia los paneles de vista
  document.querySelectorAll(".view-panel").forEach(panel => {
    panel.classList.remove("active");
  });
  
  const targetPanel = document.getElementById(`view-${viewName}`);
  if (targetPanel) targetPanel.classList.add("active");
  
  // Actualiza los encabezados
  const titleEl = document.getElementById("current-view-title");
  const subtitleEl = document.getElementById("current-view-subtitle");
  
  if (titleEl) titleEl.textContent = VIEWS[viewName].title;
  if (subtitleEl) subtitleEl.textContent = VIEWS[viewName].subtitle;

  // Reinicia la entrada del encabezado para que el cambio se sienta continuo
  const titleSection = document.querySelector(".page-title-section");
  if (titleSection) {
    titleSection.classList.remove("is-switching");
    void titleSection.offsetWidth;
    titleSection.classList.add("is-switching");
    window.setTimeout(() => titleSection.classList.remove("is-switching"), 560);
  }

  updateNavIndicator();

  // Cada vista comienza desde arriba, sin saltos bruscos
  if (window.scrollY > 0) {
    window.scrollTo({
      top: 0,
      behavior: reduceMotionQuery.matches ? "auto" : "smooth"
    });
  }

  // Ejecuta el callback para renderizar el contenido de la vista específica
  if (typeof onViewSwitch === "function") {
    onViewSwitch(viewName);
  }
}
