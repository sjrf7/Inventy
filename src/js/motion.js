/**
 * Motor de movimiento de Inventy.
 * Utilidades compartidas para revelados, contadores, modales con salida
 * reversible, FLIP del inventario e indicadores deslizantes.
 * Sin dependencias externas.
 */

const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

/** @returns {boolean} */
export function prefersReducedMotion() {
  return reduceMotionQuery.matches;
}

/* -------------------------------------------------------------------------- */
/* Indicador deslizante de la navegación                                       */
/* -------------------------------------------------------------------------- */

let navIndicatorUpdater = null;

function setupNavIndicator() {
  const nav = document.querySelector(".nav-links");
  if (!nav) return;

  let indicator = nav.querySelector(".nav-indicator");
  if (!indicator) {
    indicator = document.createElement("span");
    indicator.className = "nav-indicator";
    indicator.setAttribute("aria-hidden", "true");
    nav.prepend(indicator);
  }

  const place = () => {
    const activeLink = nav.querySelector(".nav-item.active a");
    if (!activeLink) {
      indicator.style.opacity = "0";
      return;
    }
    const navRect = nav.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    const offset = linkRect.top - navRect.top;

    indicator.style.height = `${Math.round(linkRect.height)}px`;
    indicator.style.transform = `translate3d(0, ${Math.round(offset)}px, 0)`;
    indicator.style.opacity = "1";
  };

  navIndicatorUpdater = place;
  requestAnimationFrame(place);
  // Reposiciona cuando cargan las fuentes y cambian las métricas del texto.
  setTimeout(place, 220);

  const observer = new MutationObserver(() => requestAnimationFrame(place));
  nav.querySelectorAll(".nav-item").forEach(item => {
    observer.observe(item, { attributes: true, attributeFilter: ["class"] });
  });

  if (typeof ResizeObserver === "function") {
    new ResizeObserver(() => requestAnimationFrame(place)).observe(nav);
  }
  window.addEventListener("resize", place, { passive: true });
}

/** Fuerza la recolocación del indicador (por ejemplo tras abrir la barra móvil). */
export function updateNavIndicator() {
  if (typeof navIndicatorUpdater === "function") {
    requestAnimationFrame(navIndicatorUpdater);
  }
}

/* -------------------------------------------------------------------------- */
/* Subrayado de pestañas del modal de detalle                                  */
/* -------------------------------------------------------------------------- */

function refreshTabIndicator() {
  document.querySelectorAll(".detail-tabs").forEach(tabs => {
    let indicator = tabs.querySelector(".tab-indicator");
    const active = tabs.querySelector(".detail-tab-btn.active");
    if (!active) {
      if (indicator) indicator.style.opacity = "0";
      return;
    }
    if (!indicator) {
      indicator = document.createElement("span");
      indicator.className = "tab-indicator";
      indicator.setAttribute("aria-hidden", "true");
      tabs.appendChild(indicator);
    }

    const tabsRect = tabs.getBoundingClientRect();
    const btnRect = active.getBoundingClientRect();
    indicator.style.width = `${btnRect.width}px`;
    indicator.style.transform = `translate3d(${btnRect.left - tabsRect.left}px, 0, 0)`;
    indicator.style.opacity = "1";
  });
}

function setupTabIndicator() {
  document.addEventListener("click", event => {
    if (event.target.closest(".detail-tab-btn")) {
      requestAnimationFrame(refreshTabIndicator);
    }
  });

  const observer = new MutationObserver(() => requestAnimationFrame(refreshTabIndicator));
  document.querySelectorAll(".detail-tab-btn").forEach(btn => {
    observer.observe(btn, { attributes: true, attributeFilter: ["class"] });
  });

  window.addEventListener("resize", refreshTabIndicator, { passive: true });
  setTimeout(refreshTabIndicator, 260);
}

/* -------------------------------------------------------------------------- */
/* Modales con transición de entrada y salida                                  */
/* -------------------------------------------------------------------------- */

const openOverlays = new Set();

function lockScroll() {
  const shouldLock = openOverlays.size > 0;
  document.body.classList.toggle("modal-open", shouldLock);
}

function bindOverlay(overlay) {
  if (overlay.dataset.motionBound === "true") return;
  overlay.dataset.motionBound = "true";

  overlay.addEventListener("pointerdown", event => {
    if (event.target === overlay) {
      closeModal(overlay);
    }
  });

  overlay.addEventListener("keydown", event => {
    if (event.key !== "Tab" || !overlay.classList.contains("active")) return;
    const focusable = Array.from(
      overlay.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => el.offsetParent !== null);

    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const current = document.activeElement;

    // El foco inicial vive en el contenedor: completa el ciclo en ambos sentidos.
    const outside = !overlay.contains(current) || current === overlay.querySelector(".modal-container");

    if (event.shiftKey && (current === first || outside)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (current === last || outside)) {
      event.preventDefault();
      first.focus();
    }
  });
}

/**
 * Abre un modal animando su entrada y gestionando el foco.
 * @param {HTMLElement|null} overlay
 * @param {HTMLElement|null} trigger - Elemento que devolverá el foco al cerrar
 */
export function openModal(overlay, trigger = null) {
  if (!overlay) return;

  bindOverlay(overlay);
  overlay.__returnFocus = trigger instanceof HTMLElement ? trigger : document.activeElement;
  overlay.removeAttribute("aria-hidden");
  overlay.classList.add("active");
  openOverlays.add(overlay);
  lockScroll();

  const container = overlay.querySelector(".modal-container");
  if (container) {
    if (!container.hasAttribute("tabindex")) container.setAttribute("tabindex", "-1");
    window.setTimeout(() => {
      if (overlay.classList.contains("active")) {
        container.focus({ preventScroll: true });
      }
    }, 80);
  }

  requestAnimationFrame(refreshTabIndicator);
}

/**
 * Cierra un modal dejando que la transición CSS se reproduzca en reversa.
 * @param {HTMLElement|null} overlay
 */
export function closeModal(overlay) {
  if (!overlay || !overlay.classList.contains("active")) return;

  overlay.classList.remove("active");
  overlay.setAttribute("aria-hidden", "true");
  openOverlays.delete(overlay);
  lockScroll();

  const trigger = overlay.__returnFocus;
  if (trigger && document.contains(trigger)) {
    window.setTimeout(() => {
      if (!openOverlays.size && !trigger.closest(".modal-overlay")) {
        trigger.focus({ preventScroll: true });
      }
    }, 260);
  }
}

/** Cierra todos los modales abiertos. */
export function closeAllModals() {
  Array.from(openOverlays).forEach(closeModal);
}

/* -------------------------------------------------------------------------- */
/* Contadores animados                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Anima un número desde cero hasta su valor final.
 * @param {HTMLElement|null} element
 * @param {number} target
 * @param {{duration?: number, format?: (value: number) => string}} options
 */
export function animateCount(element, target, options = {}) {
  if (!element) return;

  const value = Number(target) || 0;
  const format = typeof options.format === "function" ? options.format : String;

  if (element.dataset.countTo === String(value)) return;
  element.dataset.countTo = String(value);

  if (prefersReducedMotion()) {
    element.textContent = format(value);
    return;
  }

  const duration = options.duration ?? 760;
  const started = performance.now();
  const easeOut = progress => 1 - Math.pow(1 - progress, 4);

  const tick = now => {
    const progress = Math.min(1, (now - started) / duration);
    element.textContent = format(Math.round(value * easeOut(progress)));
    if (progress < 1) requestAnimationFrame(tick);
  };

  element.textContent = format(0);
  requestAnimationFrame(tick);
}

/* -------------------------------------------------------------------------- */
/* Revelados escalonados                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Aplica un retardo incremental a los hijos de un contenedor.
 * @param {HTMLElement|null} container
 * @param {string} selector
 * @param {{step?: number, max?: number}} options
 */
export function staggerChildren(container, selector, options = {}) {
  if (!container) return;
  const step = options.step ?? 38;
  const max = options.max ?? 14;

  container.querySelectorAll(selector).forEach((element, index) => {
    element.style.setProperty("--i", String(Math.min(index, max)));
    element.classList.add("stagger-item");
  });
}

/**
 * Reproduce la animación de entrada de una vista previa recién mostrada.
 * @param {HTMLElement|null} element
 */
export function revealPreview(element) {
  if (!element) return;
  element.classList.remove("preview-in");
  void element.offsetWidth;
  element.classList.add("preview-in");
}

/* -------------------------------------------------------------------------- */
/* FLIP para el inventario                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Captura la posición actual de las tarjetas antes de volver a renderizarlas.
 * @param {HTMLElement|null} container
 * @param {string} selector
 * @returns {Map<string, DOMRect>}
 */
export function captureFlipRects(container, selector) {
  const rects = new Map();
  if (!container) return rects;

  container.querySelectorAll(selector).forEach(element => {
    const id = element.dataset.flipId;
    if (!id) return;
    const rect = element.getBoundingClientRect();
    // Ignora tarjetas ocultas (por ejemplo, al entrar desde otra vista).
    if (rect.width === 0 || rect.height === 0) return;
    rects.set(id, rect);
  });
  return rects;
}

/**
 * Anima las tarjetas desde su posición anterior hasta la nueva.
 * @param {HTMLElement|null} container
 * @param {Map<string, DOMRect>} previousRects
 * @param {string} selector
 */
export function playFlip(container, previousRects, selector) {
  if (!container || !previousRects.size || prefersReducedMotion()) return;
  // Con listados muy grandes el coste de animar cada tarjeta deja de compensar.
  if (container.querySelectorAll(selector).length > 80) return;

  container.querySelectorAll(selector).forEach(element => {
    const previous = previousRects.get(element.dataset.flipId);
    if (!previous) return;

    const next = element.getBoundingClientRect();
    const deltaX = previous.left - next.left;
    const deltaY = previous.top - next.top;

    if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;

    element.classList.add("flip-moving");
    const animation = element.animate(
      [
        { transform: `translate3d(${deltaX}px, ${deltaY}px, 0)` },
        { transform: "translate3d(0, 0, 0)" }
      ],
      { duration: 460, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
    );

    animation.finished
      .catch(() => {})
      .finally(() => element.classList.remove("flip-moving"));
  });
}

/* -------------------------------------------------------------------------- */
/* Transición de tema                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Ejecuta el cambio de tema con un recorte circular si el navegador lo soporta.
 * @param {() => void} applyTheme
 * @param {HTMLElement|null} origin
 */
export function runThemeTransition(applyTheme, origin = null) {
  if (typeof document.startViewTransition !== "function" || prefersReducedMotion()) {
    applyTheme();
    return;
  }

  const rect = origin?.getBoundingClientRect();
  const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  const transition = document.startViewTransition(() => applyTheme());

  transition.ready
    .then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`
          ]
        },
        {
          duration: 560,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          pseudoElement: "::view-transition-new(root)"
        }
      );
    })
    .catch(() => {});
}

/* -------------------------------------------------------------------------- */
/* Inicialización                                                              */
/* -------------------------------------------------------------------------- */

let initialized = false;

/** Activa la capa de movimiento global una sola vez. */
export function initMotion() {
  if (initialized) return;
  initialized = true;

  document.documentElement.classList.add("motion-ready");
  setupNavIndicator();
  setupTabIndicator();

  // Reacciona a cambios en las preferencias del sistema en tiempo real.
  if (typeof reduceMotionQuery.addEventListener === "function") {
    reduceMotionQuery.addEventListener("change", () => {
      if (prefersReducedMotion()) {
        document.querySelectorAll(".flip-moving").forEach(el => el.classList.remove("flip-moving"));
      }
    });
  }
}
