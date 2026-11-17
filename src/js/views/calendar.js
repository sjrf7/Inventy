import { openModal, closeModal } from '../motion.js';
import {
  loadMaintenanceEvents,
  addMaintenanceEvent,
  updateMaintenanceEvent,
  removeMaintenanceEvent
} from '../state.js';
import { escapeAttr, escapeHtml } from '../utils.js';

/* -------------------------------------------------------------------------- */
/* Constantes                                                                 */
/* -------------------------------------------------------------------------- */

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAY_NAMES = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

// Semana que empieza en lunes, como se usa en el calendario laboral local.
const WEEKDAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

// Etiquetas breves para la cabecera de la vista mensual.
const WEEKDAY_BRIEF = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const VIEW_STORAGE_KEY = 'inventy_calendar_view';

const TYPE_LABELS = {
  preventivo: 'Preventivo',
  correctivo: 'Correctivo'
};

const STATUS_LABELS = {
  programado: 'Programado',
  en_proceso: 'En proceso',
  completado: 'Completado',
  cancelado: 'Cancelado'
};

const ICONS = {
  check: '<polyline points="20 6 9 17 4 12"/>',
  undo: '<polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  alert: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>'
};

/* -------------------------------------------------------------------------- */
/* Estado local de la vista                                                   */
/* -------------------------------------------------------------------------- */

const state = {
  bound: false,
  initialized: false,
  year: new Date().getFullYear(),
  selectedDate: toISODate(new Date()),
  view: readViewPreference(),
  filter: 'todos',
  events: [],
  loading: false,
  error: null,
  assets: []
};

let loadToken = 0;
let statusTimer = null;
let pendingFocusDate = null;

/* -------------------------------------------------------------------------- */
/* Utilidades de fecha y texto                                                */
/* -------------------------------------------------------------------------- */

/**
 * Devuelve la fecha local en formato AAAA-MM-DD, sin conversión UTC.
 * @param {Date} date
 * @returns {string}
 */
function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convierte AAAA-MM-DD en una fecha local.
 * @param {string} value
 * @returns {Date}
 */
function parseISODate(value) {
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

/**
 * Recupera la vista preferida del calendario. La mensual es la vista de
 * trabajo por defecto; la anual queda a un clic y la elección se conserva.
 * @returns {'month'|'year'}
 */
function readViewPreference() {
  try {
    const stored = localStorage.getItem(VIEW_STORAGE_KEY);
    if (stored === 'month' || stored === 'year') return stored;
  } catch (error) {
    // Sin almacenamiento disponible se usa la vista mensual.
  }
  return 'month';
}

/**
 * Guarda la vista elegida para las próximas visitas.
 * @param {'month'|'year'} view
 */
function saveViewPreference(view) {
  try {
    localStorage.setItem(VIEW_STORAGE_KEY, view);
  } catch (error) {
    // La preferencia es opcional.
  }
}

/**
 * Pluraliza de forma sencilla para las etiquetas del panel.
 * @param {number} count
 * @param {string} singular
 * @param {string} plural
 * @returns {string}
 */
function plural(count, singular, pluralForm) {
  return count === 1 ? singular : pluralForm;
}

/**
 * Indica si un estado ya cerró la intervención.
 * @param {string} status
 * @returns {boolean}
 */
function isClosedStatus(status) {
  return status === 'completado' || status === 'cancelado';
}

function svgIcon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

function typeLabel(type) {
  return TYPE_LABELS[type] || type || 'Mantenimiento';
}

function statusLabel(status) {
  return STATUS_LABELS[status] || status || 'Sin estado';
}

/* -------------------------------------------------------------------------- */
/* Datos derivados                                                            */
/* -------------------------------------------------------------------------- */

function filteredEvents() {
  if (state.filter === 'todos') return state.events;
  return state.events.filter(event => event.type === state.filter);
}

function eventsForDate(date) {
  return filteredEvents().filter(event => event.date === date);
}

function sortEvents(events) {
  return [...events].sort((a, b) => {
    const timeA = a.time || '99:99';
    const timeB = b.time || '99:99';
    return timeA.localeCompare(timeB) || String(a.title).localeCompare(String(b.title));
  });
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = String(value);
}

/* -------------------------------------------------------------------------- */
/* Render                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Punto de entrada desde main.js. Se llama cada vez que se abre la vista.
 * @param {Array} assets
 */
export function setupCalendarView(assets = []) {
  state.assets = Array.isArray(assets) ? assets : [];

  if (!state.bound) {
    bindCalendarEvents();
    state.bound = true;
  }

  populateAssetOptions();
  applyViewButtons();

  if (!state.initialized) {
    state.initialized = true;
    const today = new Date();
    state.year = today.getFullYear();
    state.selectedDate = toISODate(today);
    loadYear(state.year);
    return;
  }

  renderCalendar();
}

function updateYearLabel() {
  const isMonth = state.view === 'month';
  const monthIndex = parseISODate(state.selectedDate).getMonth();
  const labelElement = document.getElementById('calendar-year-label');

  if (labelElement) {
    labelElement.textContent = isMonth
      ? `${MONTH_NAMES[monthIndex]} ${state.year}`
      : String(state.year);
    labelElement.classList.toggle('is-month', isMonth);
  }

  const prevButton = document.getElementById('calendar-prev-year');
  const nextButton = document.getElementById('calendar-next-year');
  const prevLabel = isMonth ? 'Ver el mes anterior' : 'Ver el año anterior';
  const nextLabel = isMonth ? 'Ver el mes siguiente' : 'Ver el año siguiente';

  if (prevButton) {
    prevButton.setAttribute('aria-label', prevLabel);
    prevButton.title = prevLabel;
  }

  if (nextButton) {
    nextButton.setAttribute('aria-label', nextLabel);
    nextButton.title = nextLabel;
  }
}

/**
 * Sincroniza el conmutador Mes/Año con el estado de la vista.
 */
function applyViewButtons() {
  document.querySelectorAll('[data-calendar-view]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.calendarView === state.view));
  });

  const months = document.getElementById('calendar-months');
  if (months) months.classList.toggle('is-month-view', state.view === 'month');

  const layout = document.querySelector('.calendar-layout');
  if (layout) layout.classList.toggle('is-month-layout', state.view === 'month');
}

/**
 * Devuelve el foco a una celda concreta tras una navegación con teclado.
 */
function applyPendingFocus() {
  if (!pendingFocusDate || state.loading || state.error) return;

  const container = document.getElementById('calendar-months');
  const cell = container?.querySelector(`[data-date="${pendingFocusDate}"]`);
  if (!cell) return;

  pendingFocusDate = null;
  cell.focus();
}

function renderCalendar() {
  updateYearLabel();

  const monthsElement = document.getElementById('calendar-months');
  if (monthsElement) {
    monthsElement.setAttribute('aria-busy', state.loading ? 'true' : 'false');
    monthsElement.dataset.view = state.view;
  }

  if (state.loading) {
    renderMetrics();
    renderLoadingState();
    return;
  }

  if (state.error) {
    renderMetrics();
    renderErrorState();
    return;
  }

  renderMetrics();
  if (state.view === 'month') {
    renderMonth();
  } else {
    renderMonths();
  }
  renderDayPanel();
  applyPendingFocus();
}

function renderMetrics() {
  const events = state.events;
  setText('calendar-stat-total', events.length);
  setText('calendar-stat-preventivo', events.filter(event => event.type === 'preventivo').length);
  setText('calendar-stat-correctivo', events.filter(event => event.type === 'correctivo').length);
  setText('calendar-stat-completado', events.filter(event => event.status === 'completado').length);
}

function renderLoadingState() {
  const months = document.getElementById('calendar-months');
  if (months) {
    months.innerHTML = `
      <div class="calendar-state calendar-loading">
        <span class="calendar-spinner" aria-hidden="true"></span>
        <p>Cargando el cronograma de ${state.year}…</p>
      </div>
    `;
  }

  setText('calendar-day-eyebrow', `Año ${state.year}`);
  setText('calendar-day-title', 'Cargando…');
  setText('calendar-day-subtitle', 'Consultando los mantenimientos registrados.');

  const list = document.getElementById('calendar-day-list');
  if (list) {
    list.innerHTML = `
      <div class="calendar-state calendar-loading is-compact">
        <span class="calendar-spinner" aria-hidden="true"></span>
        <p>Cargando…</p>
      </div>
    `;
  }
}

function renderErrorState() {
  const message = state.error || 'No se pudo cargar el cronograma.';
  const months = document.getElementById('calendar-months');

  if (months) {
    months.innerHTML = `
      <div class="calendar-state calendar-error">
        ${svgIcon('alert')}
        <h3>No se pudo cargar el calendario</h3>
        <p>${escapeHtml(message)}</p>
        <button type="button" class="btn btn-secondary btn-sm" data-calendar-retry>Reintentar</button>
      </div>
    `;
  }

  setText('calendar-day-eyebrow', `Año ${state.year}`);
  setText('calendar-day-title', 'Sin datos');
  setText('calendar-day-subtitle', 'Reintenta la carga para consultar los mantenimientos.');

  const list = document.getElementById('calendar-day-list');
  if (list) {
    list.innerHTML = `
      <div class="calendar-state calendar-error is-compact">
        ${svgIcon('alert')}
        <p>El detalle del día no está disponible.</p>
      </div>
    `;
  }
}

/**
 * Agrupa los eventos por fecha para dibujar la retícula en una sola pasada.
 * @param {Array} events
 * @returns {Map<string, Array>}
 */
function groupEventsByDate(events) {
  const map = new Map();

  events.forEach(event => {
    if (!event.date) return;
    const list = map.get(event.date) || [];
    list.push(event);
    map.set(event.date, list);
  });

  return map;
}

/**
 * Construye la etiqueta accesible de un día. La vista mensual añade el
 * resumen de las intervenciones visibles en la celda.
 * @returns {string}
 */
function buildDayLabel({ date, dayEvents, isToday, monthIndex, detailed }) {
  let label = `${WEEKDAY_NAMES[date.getDay()].toLowerCase()} ${date.getDate()} de ${MONTH_NAMES[monthIndex].toLowerCase()} de ${state.year}`;

  if (!dayEvents.length) {
    label += '. Sin mantenimientos';
  } else if (detailed) {
    const parts = dayEvents.slice(0, 3).map(event => {
      const time = event.time ? `${event.time}, ` : '';
      return `${time}${event.title} (${typeLabel(event.type).toLowerCase()}, ${statusLabel(event.status).toLowerCase()})`;
    });
    if (dayEvents.length > 3) parts.push(`y ${dayEvents.length - 3} más`);
    label += `. ${dayEvents.length} ${plural(dayEvents.length, 'mantenimiento', 'mantenimientos')}: ${parts.join('; ')}`;
  } else {
    const preventivos = dayEvents.filter(event => event.type === 'preventivo').length;
    const correctivos = dayEvents.filter(event => event.type === 'correctivo').length;
    const details = [];
    if (preventivos) details.push(`${preventivos} ${plural(preventivos, 'preventivo', 'preventivos')}`);
    if (correctivos) details.push(`${correctivos} ${plural(correctivos, 'correctivo', 'correctivos')}`);
    label += `. ${dayEvents.length} ${plural(dayEvents.length, 'mantenimiento', 'mantenimientos')}: ${details.join(' y ')}`;
  }

  if (isToday) label += '. Hoy';
  return label;
}

/**
 * Dibuja una celda de día. En la vista anual usa puntos de tipo; en la
 * mensual muestra fichas con hora y título, limitadas a tres por día.
 * @returns {string}
 */
function renderDayCell({ dateString, dayNumber, date, dayEvents, isToday, isSelected, monthIndex, detailed }) {
  const classes = ['calendar-day'];
  if (detailed) classes.push('is-detailed');
  if (dayEvents.length) classes.push('has-events');
  if (isToday) classes.push('is-today');
  if (isSelected) classes.push('is-selected');

  const label = buildDayLabel({ date, dayEvents, isToday, monthIndex, detailed });
  const pressed = isSelected ? 'true' : 'false';
  const current = isToday ? 'aria-current="date"' : '';

  if (!detailed) {
    const dots = dayEvents.slice(0, 3).map(event => {
      const done = isClosedStatus(event.status) ? ' is-done' : '';
      return `<span class="calendar-day-dot is-${escapeAttr(event.type)}${done}"></span>`;
    }).join('');

    return `
      <button type="button" class="${classes.join(' ')}" data-date="${dateString}"
        aria-pressed="${pressed}" ${current} aria-label="${escapeAttr(label)}">
        <span class="calendar-day-number">${dayNumber}</span>
        <span class="calendar-day-dots" aria-hidden="true">${dots}</span>
      </button>
    `;
  }

  const chips = dayEvents.slice(0, 3).map(event => {
    const time = event.time
      ? `<span class="calendar-chip-time">${escapeHtml(event.time)}</span>`
      : '';

    return `
      <span class="calendar-chip is-${escapeAttr(event.type)} is-status-${escapeAttr(event.status)}">
        <span class="calendar-chip-dot" aria-hidden="true"></span>
        ${time}
        <span class="calendar-chip-title">${escapeHtml(event.title)}</span>
      </span>
    `;
  }).join('');

  const more = dayEvents.length > 3
    ? `<span class="calendar-chip-more">+${dayEvents.length - 3} más</span>`
    : '';

  return `
    <button type="button" class="${classes.join(' ')}" data-date="${dateString}"
      aria-pressed="${pressed}" ${current} aria-label="${escapeAttr(label)}">
      <span class="calendar-day-top">
        <span class="calendar-day-number">${dayNumber}</span>
        ${isToday ? '<span class="calendar-today-flag" aria-hidden="true">Hoy</span>' : ''}
      </span>
      <span class="calendar-day-events" aria-hidden="true">${chips}${more}</span>
    </button>
  `;
}

/**
 * Dibuja el bloque de un mes. La vista anual usa seis semanas fijas para que
 * todos los meses midan igual; la mensual ajusta las filas al contenido.
 * @returns {string}
 */
function renderMonthSection(monthIndex, monthEvents, eventsByDate, detailed) {
  const firstDay = new Date(state.year, monthIndex, 1);
  const leadingBlanks = (firstDay.getDay() + 6) % 7; // Lunes = 0
  const daysInMonth = new Date(state.year, monthIndex + 1, 0).getDate();
  const totalCells = detailed
    ? Math.ceil((leadingBlanks + daysInMonth) / 7) * 7
    : 42;
  const today = toISODate(new Date());

  let daysHtml = '';

  for (let cell = 0; cell < totalCells; cell++) {
    const dayNumber = cell - leadingBlanks + 1;

    if (dayNumber < 1 || dayNumber > daysInMonth) {
      daysHtml += `<span class="calendar-day is-blank${detailed ? ' is-detailed' : ''}" aria-hidden="true"></span>`;
      continue;
    }

    const date = new Date(state.year, monthIndex, dayNumber);
    const dateString = toISODate(date);

    daysHtml += renderDayCell({
      dateString,
      dayNumber,
      date,
      dayEvents: eventsByDate.get(dateString) || [],
      isToday: dateString === today,
      isSelected: dateString === state.selectedDate,
      monthIndex,
      detailed
    });
  }

  const heading = detailed ? `${MONTH_NAMES[monthIndex]} ${state.year}` : MONTH_NAMES[monthIndex];
  const weekdays = detailed ? WEEKDAY_BRIEF : WEEKDAY_LETTERS;
  const countTitle = `${monthEvents.length} ${plural(monthEvents.length, 'mantenimiento', 'mantenimientos')}`;
  const note = detailed && monthEvents.length === 0
    ? `<p class="calendar-month-note">${
        state.filter === 'todos'
          ? 'Sin mantenimientos programados este mes.'
          : 'Sin mantenimientos de este tipo en el mes.'
      }</p>`
    : '';

  return `
    <section class="calendar-month${detailed ? ' is-detailed' : ''}" aria-labelledby="calendar-month-${monthIndex}">
      <div class="calendar-month-header">
        <h3 class="calendar-month-name" id="calendar-month-${monthIndex}">${heading}</h3>
        <span class="calendar-month-count${monthEvents.length ? '' : ' is-empty'}" title="${countTitle}">
          ${monthEvents.length}
        </span>
      </div>
      <div class="calendar-weekdays${detailed ? ' is-detailed' : ''}" aria-hidden="true">
        ${weekdays.map(name => `<span>${name}</span>`).join('')}
      </div>
      <div class="calendar-days${detailed ? ' is-detailed' : ''}">
        ${daysHtml}
      </div>
      ${note}
    </section>
  `;
}

/**
 * Retícula anual: los doce meses en un mismo plano.
 */
function renderMonths() {
  const container = document.getElementById('calendar-months');
  if (!container) return;

  const events = filteredEvents();
  const eventsByDate = groupEventsByDate(events);
  let html = '';

  for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
    const monthPrefix = `${state.year}-${String(monthIndex + 1).padStart(2, '0')}-`;
    const monthEvents = events.filter(event => event.date && event.date.startsWith(monthPrefix));
    html += renderMonthSection(monthIndex, monthEvents, eventsByDate, false);
  }

  container.innerHTML = html;
}

/**
 * Vista mensual: un solo mes con las intervenciones rotuladas.
 */
function renderMonth() {
  const container = document.getElementById('calendar-months');
  if (!container) return;

  const monthIndex = parseISODate(state.selectedDate).getMonth();
  const events = filteredEvents();
  const eventsByDate = groupEventsByDate(events);
  const monthPrefix = `${state.year}-${String(monthIndex + 1).padStart(2, '0')}-`;
  const monthEvents = events.filter(event => event.date && event.date.startsWith(monthPrefix));

  container.innerHTML = renderMonthSection(monthIndex, monthEvents, eventsByDate, true);
}

/**
 * Marca un día como seleccionado sin reconstruir la retícula, de modo que el
 * foco de quien navega con el teclado se conserve.
 * @param {string} date
 */
function selectDay(date) {
  state.selectedDate = date;

  const container = document.getElementById('calendar-months');
  container?.querySelectorAll('[data-date]').forEach(cell => {
    const isSelected = cell.dataset.date === date;
    cell.classList.toggle('is-selected', isSelected);
    cell.setAttribute('aria-pressed', String(isSelected));
  });

  renderDayPanel();
  revealDayPanelOnCompact();
}


function renderDayPanel() {
  const date = parseISODate(state.selectedDate);
  const today = toISODate(new Date());
  const isToday = state.selectedDate === today;

  setText('calendar-day-eyebrow', isToday ? `Hoy · ${state.year}` : `Día seleccionado · ${state.year}`);
  setText('calendar-day-title', `${WEEKDAY_NAMES[date.getDay()].toLowerCase()}, ${date.getDate()} de ${MONTH_NAMES[date.getMonth()].toLowerCase()}`);

  const list = document.getElementById('calendar-day-list');
  if (!list) return;

  const events = sortEvents(eventsForDate(state.selectedDate));

  if (!events.length) {
    setText('calendar-day-subtitle', 'Sin mantenimientos programados.');

    const hint = state.filter === 'todos'
      ? 'Programa una intervención o elige otra fecha.'
      : 'No hay mantenimientos de este tipo en la fecha. Cambia el filtro o programa uno nuevo.';

    list.innerHTML = `
      <div class="calendar-day-empty">
        ${svgIcon('calendar')}
        <h3>Sin mantenimientos este día</h3>
        <p>${escapeHtml(hint)}</p>
        <button type="button" class="btn btn-secondary btn-sm" data-action="new-day">
          Programar en este día
        </button>
      </div>
    `;
    return;
  }

  const preventivos = events.filter(event => event.type === 'preventivo').length;
  const correctivos = events.filter(event => event.type === 'correctivo').length;

  setText(
    'calendar-day-subtitle',
    `${events.length} ${plural(events.length, 'mantenimiento', 'mantenimientos')} · ` +
      `${preventivos} ${plural(preventivos, 'preventivo', 'preventivos')} · ` +
      `${correctivos} ${plural(correctivos, 'correctivo', 'correctivos')}`
  );

  list.innerHTML = events.map(renderEventCard).join('');
}

/**
 * En pantallas estrechas el panel del día se coloca antes de la retícula.
 * Al elegir una fecha, lo trae a la vista si quedó fuera de pantalla.
 */
function revealDayPanelOnCompact() {
  const isStacked = window.innerWidth <= 980 ||
    (state.view === 'month' && window.innerWidth <= 1180);
  if (!isStacked) return;

  const panel = document.querySelector('.calendar-day-panel');
  if (!panel) return;

  const rect = panel.getBoundingClientRect();
  const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
  if (isVisible) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.requestAnimationFrame(() => {
    panel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  });
}

function renderEventCard(event) {
  const closed = isClosedStatus(event.status);
  const toggleLabel = closed ? 'Reabrir mantenimiento' : 'Marcar como completado';
  const safeTitle = escapeHtml(event.title);

  const assetLine = event.assetName
    ? `<p class="calendar-event-asset">${svgIcon('tool')}<span>${escapeHtml(event.assetName)}</span></p>`
    : '';

  const departmentLine = event.department
    ? `<span class="calendar-event-department">${escapeHtml(event.department)}</span>`
    : '';

  const technicianLine = event.technician
    ? `<span class="calendar-event-technician">${escapeHtml(event.technician)}</span>`
    : '';

  const meta = [technicianLine, departmentLine].filter(Boolean).join('<span class="calendar-meta-sep" aria-hidden="true">·</span>');

  const details = event.details
    ? `<p class="calendar-event-details">${escapeHtml(event.details)}</p>`
    : '';

  return `
    <article class="calendar-event is-${escapeAttr(event.type)} is-status-${escapeAttr(event.status)}" data-event-id="${escapeAttr(event.id)}">
      <div class="calendar-event-top">
        <span class="calendar-event-time">${event.time ? escapeHtml(event.time) : 'Todo el día'}</span>
        <span class="calendar-badge is-${escapeAttr(event.type)}">${escapeHtml(typeLabel(event.type))}</span>
      </div>

      <h3 class="calendar-event-title">${safeTitle}</h3>

      ${assetLine}
      ${meta ? `<p class="calendar-event-meta">${meta}</p>` : ''}
      ${details}

      <div class="calendar-event-footer">
        <span class="calendar-status-badge is-${escapeAttr(event.status)}">${escapeHtml(statusLabel(event.status))}</span>
        <div class="calendar-event-actions">
          <button type="button" class="calendar-action-btn" data-action="toggle" data-id="${escapeAttr(event.id)}"
            aria-label="${escapeAttr(toggleLabel)}" title="${escapeAttr(toggleLabel)}">
            ${svgIcon(closed ? 'undo' : 'check')}
          </button>
          <button type="button" class="calendar-action-btn" data-action="edit" data-id="${escapeAttr(event.id)}"
            aria-label="Editar mantenimiento" title="Editar mantenimiento">
            ${svgIcon('edit')}
          </button>
          <button type="button" class="calendar-action-btn is-danger" data-action="delete" data-id="${escapeAttr(event.id)}"
            aria-label="Eliminar mantenimiento" title="Eliminar mantenimiento">
            ${svgIcon('trash')}
          </button>
        </div>
      </div>
    </article>
  `;
}

/* -------------------------------------------------------------------------- */
/* Carga de datos                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Avanza o retrocede un mes conservando el día cuando existe en el destino.
 * Si el salto cruza el año, recarga el cronograma del año correspondiente.
 * @param {number} offset
 */
function shiftMonth(offset) {
  const current = parseISODate(state.selectedDate);
  const target = new Date(current.getFullYear(), current.getMonth() + offset, 1);
  const daysInTarget = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  const next = new Date(target.getFullYear(), target.getMonth(), Math.min(current.getDate(), daysInTarget));
  const nextISO = toISODate(next);

  if (next.getFullYear() !== state.year) {
    loadYear(next.getFullYear(), { selectedDate: nextISO });
  } else {
    state.selectedDate = nextISO;
    renderCalendar();
  }
}

function loadYear(year, { selectedDate = null } = {}) {
  if (year < 1900 || year > 2100) return;

  const token = ++loadToken;
  state.year = year;
  state.events = [];
  state.loading = true;
  state.error = null;

  const today = new Date();
  if (selectedDate) {
    state.selectedDate = selectedDate;
  } else if (today.getFullYear() === year) {
    state.selectedDate = toISODate(today);
  } else {
    state.selectedDate = `${year}-01-01`;
  }

  renderCalendar();

  loadMaintenanceEvents(year)
    .then(events => {
      if (token !== loadToken) return;
      state.events = Array.isArray(events) ? events : [];
      state.loading = false;
      state.error = null;
      renderCalendar();
    })
    .catch(error => {
      if (token !== loadToken) return;
      state.loading = false;
      state.error = error?.message || 'No se pudo cargar el cronograma.';
      renderCalendar();
    });
}

/* -------------------------------------------------------------------------- */
/* Estado de la interfaz                                                      */
/* -------------------------------------------------------------------------- */

function showStatus(message, tone = 'success') {
  const element = document.getElementById('calendar-status');
  if (!element) return;

  element.textContent = message;
  element.classList.remove('is-success', 'is-error');
  element.classList.add(tone === 'error' ? 'is-error' : 'is-success');

  window.clearTimeout(statusTimer);
  statusTimer = window.setTimeout(() => {
    element.textContent = '';
    element.classList.remove('is-success', 'is-error');
  }, tone === 'error' ? 8000 : 5000);
}

function setFormError(message = '') {
  const element = document.getElementById('maintenance-error');
  if (!element) return;
  element.textContent = message;
  element.hidden = !message;
}

function currentTechnician() {
  const raw = localStorage.getItem('inventy_user') || sessionStorage.getItem('inventy_user');
  if (raw) {
    try {
      const user = JSON.parse(raw);
      return user.fullname || user.username || 'Samuel';
    } catch (error) {
      // Se usa el valor por defecto.
    }
  }
  return 'Samuel';
}

function populateAssetOptions() {
  const select = document.getElementById('maintenance-asset');
  if (!select) return;

  const current = select.value;
  const options = state.assets.map(asset => {
    const label = `${asset.nroBien ? asset.nroBien + ' · ' : ''}${asset.name || asset.id}`;
    return `<option value="${escapeAttr(asset.id)}">${escapeHtml(label)}</option>`;
  }).join('');

  select.innerHTML = `<option value="">Sin equipo específico</option>${options}`;

  if (current) select.value = current;
}

/* -------------------------------------------------------------------------- */
/* Modal de mantenimiento                                                     */
/* -------------------------------------------------------------------------- */

function openMaintenanceModal({ event = null, date = state.selectedDate } = {}) {
  const overlay = document.getElementById('modal-maintenance');
  const form = document.getElementById('maintenance-form');
  if (!overlay || !form) return;

  form.reset();
  setFormError('');

  const idInput = document.getElementById('maintenance-id');
  const titleInput = document.getElementById('maintenance-title');
  const typeInput = document.getElementById('maintenance-type');
  const statusInput = document.getElementById('maintenance-status');
  const dateInput = document.getElementById('maintenance-date');
  const timeInput = document.getElementById('maintenance-time');
  const assetInput = document.getElementById('maintenance-asset');
  const technicianInput = document.getElementById('maintenance-technician');
  const departmentInput = document.getElementById('maintenance-department');
  const detailsInput = document.getElementById('maintenance-details');
  const modalTitle = document.getElementById('maintenance-modal-title');
  const saveButton = document.getElementById('btn-save-maintenance');

  if (event) {
    if (idInput) idInput.value = event.id || '';
    if (titleInput) titleInput.value = event.title || '';
    if (typeInput) typeInput.value = event.type || 'preventivo';
    if (statusInput) statusInput.value = event.status || 'programado';
    if (dateInput) dateInput.value = event.date || date;
    if (timeInput) timeInput.value = event.time || '';
    if (assetInput) {
      // Un equipo del evento puede no estar en el inventario actual.
      if (event.assetId && !state.assets.some(asset => asset.id === event.assetId)) {
        const option = document.createElement('option');
        option.value = event.assetId;
        option.textContent = event.assetName || event.assetId;
        assetInput.appendChild(option);
      }
      assetInput.value = event.assetId || '';
    }
    if (technicianInput) technicianInput.value = event.technician || '';
    if (departmentInput) departmentInput.value = event.department || '';
    if (detailsInput) detailsInput.value = event.details || '';
    if (modalTitle) modalTitle.textContent = 'Editar mantenimiento';
    if (saveButton) saveButton.textContent = 'Guardar cambios';
  } else {
    if (idInput) idInput.value = '';
    if (titleInput) titleInput.value = '';
    if (typeInput) typeInput.value = 'preventivo';
    if (statusInput) statusInput.value = 'programado';
    if (dateInput) dateInput.value = date;
    if (timeInput) timeInput.value = '';
    if (assetInput) assetInput.value = '';
    if (technicianInput) technicianInput.value = currentTechnician();
    if (departmentInput) departmentInput.value = '';
    if (detailsInput) detailsInput.value = '';
    if (modalTitle) modalTitle.textContent = 'Programar mantenimiento';
    if (saveButton) saveButton.textContent = 'Guardar mantenimiento';
  }

  openModal(overlay);

  window.setTimeout(() => {
    if (overlay.classList.contains('active') && titleInput) titleInput.focus();
  }, 140);
}

function readMaintenanceForm() {
  const value = id => (document.getElementById(id)?.value || '').trim();
  const assetSelect = document.getElementById('maintenance-asset');
  const assetId = value('maintenance-asset');
  const asset = state.assets.find(item => item.id === assetId);

  // Si el equipo ya no está en el inventario, conserva el nombre que muestra
  // la opción seleccionada para no perder el dato al editar el evento.
  const assetName = asset
    ? asset.name
    : assetId
      ? (assetSelect?.selectedOptions?.[0]?.textContent || '').trim()
      : '';

  return {
    title: value('maintenance-title'),
    type: value('maintenance-type') || 'preventivo',
    status: value('maintenance-status') || 'programado',
    date: value('maintenance-date'),
    time: value('maintenance-time'),
    assetId,
    assetName,
    technician: value('maintenance-technician'),
    department: value('maintenance-department'),
    details: value('maintenance-details')
  };
}

function upsertLocalEvent(event) {
  const index = state.events.findIndex(item => item.id === event.id);
  if (index === -1) {
    state.events.push(event);
  } else {
    state.events[index] = event;
  }
}

async function handleMaintenanceSubmit(formEvent) {
  formEvent.preventDefault();

  const errorElement = document.getElementById('maintenance-error');
  const titleInput = document.getElementById('maintenance-title');
  const dateInput = document.getElementById('maintenance-date');
  const overlay = document.getElementById('modal-maintenance');
  const saveButton = document.getElementById('btn-save-maintenance');
  const payload = readMaintenanceForm();
  const id = (document.getElementById('maintenance-id')?.value || '').trim();

  if (!payload.title) {
    setFormError('Escribe un título para identificar el mantenimiento.');
    titleInput?.focus();
    return;
  }

  if (!payload.date) {
    setFormError('Selecciona la fecha del mantenimiento.');
    dateInput?.focus();
    return;
  }

  setFormError('');
  const originalLabel = saveButton ? saveButton.textContent : '';
  if (saveButton) {
    saveButton.disabled = true;
    saveButton.textContent = 'Guardando…';
  }

  try {
    const saved = id
      ? await updateMaintenanceEvent(id, payload)
      : await addMaintenanceEvent(payload);

    upsertLocalEvent(saved);
    closeModal(overlay);

    const savedYear = Number(String(saved.date || payload.date).slice(0, 4));
    if (savedYear !== state.year) {
      loadYear(savedYear, { selectedDate: saved.date || payload.date });
    } else {
      state.selectedDate = saved.date || payload.date;
      renderCalendar();
    }

    showStatus(id ? 'Mantenimiento actualizado.' : 'Mantenimiento programado.');
  } catch (error) {
    setFormError(error?.message || 'No se pudo guardar el mantenimiento.');
    if (errorElement) errorElement.scrollIntoView({ block: 'nearest' });
  } finally {
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = originalLabel;
    }
  }
}

async function toggleEventStatus(id) {
  const event = state.events.find(item => item.id === id);
  if (!event) return;

  const nextStatus = isClosedStatus(event.status) ? 'programado' : 'completado';
  const payload = {
    title: event.title,
    type: event.type,
    status: nextStatus,
    date: event.date,
    time: event.time || '',
    assetId: event.assetId || '',
    assetName: event.assetName || '',
    technician: event.technician || '',
    department: event.department || '',
    details: event.details || ''
  };

  try {
    const updated = await updateMaintenanceEvent(id, payload);
    upsertLocalEvent(updated);
    renderCalendar();
    showStatus(nextStatus === 'completado' ? 'Mantenimiento marcado como completado.' : 'Mantenimiento reabierto.');
  } catch (error) {
    showStatus(error?.message || 'No se pudo actualizar el mantenimiento.', 'error');
  }
}

/**
 * Confirmación con SweetAlert2, con respaldo nativo si no está disponible.
 * @param {string} title
 * @param {string} text
 * @param {string} confirmLabel
 * @returns {Promise<boolean>}
 */
function confirmAction(title, text, confirmLabel) {
  if (window.Swal) {
    return window.Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: confirmLabel,
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'swal-popup-custom',
        title: 'swal-title-custom',
        htmlContainer: 'swal-text-custom',
        confirmButton: 'swal-btn-confirm',
        cancelButton: 'swal-btn-cancel'
      },
      buttonsStyling: false,
      showClass: { popup: 'swal-show-animation' },
      hideClass: { popup: 'swal-hide-animation' }
    }).then(result => result.isConfirmed);
  }

  return Promise.resolve(window.confirm(`${title}\n\n${text}`));
}

async function deleteEvent(id) {
  const event = state.events.find(item => item.id === id);
  if (!event) return;

  const confirmed = await confirmAction(
    '¿Eliminar mantenimiento?',
    `Se eliminará «${event.title}» del calendario. Esta acción no se puede deshacer.`,
    'Sí, eliminar'
  );
  if (!confirmed) return;

  try {
    await removeMaintenanceEvent(id);
    state.events = state.events.filter(item => item.id !== id);
    renderCalendar();
    showStatus('Mantenimiento eliminado.');
  } catch (error) {
    showStatus(error?.message || 'No se pudo eliminar el mantenimiento.', 'error');
  }
}

/* -------------------------------------------------------------------------- */
/* Eventos de la interfaz                                                     */
/* -------------------------------------------------------------------------- */

function bindCalendarEvents() {
  const months = document.getElementById('calendar-months');
  const dayList = document.getElementById('calendar-day-list');
  const prevYear = document.getElementById('calendar-prev-year');
  const nextYear = document.getElementById('calendar-next-year');
  const todayButton = document.getElementById('calendar-today');
  const filterButtons = Array.from(document.querySelectorAll('[data-calendar-filter]'));
  const viewButtons = Array.from(document.querySelectorAll('[data-calendar-view]'));
  const newButton = document.getElementById('btn-calendar-new');
  const newDayButton = document.getElementById('btn-calendar-day-new');
  const closeButton = document.getElementById('btn-close-maintenance');
  const cancelButton = document.getElementById('btn-cancel-maintenance');
  const form = document.getElementById('maintenance-form');
  const assetInput = document.getElementById('maintenance-asset');
  const overlay = document.getElementById('modal-maintenance');

  months?.addEventListener('click', event => {
    if (event.target.closest('[data-calendar-retry]')) {
      loadYear(state.year);
      return;
    }

    const day = event.target.closest('[data-date]');
    if (!day) return;

    selectDay(day.dataset.date);
  });

  // Navegación con flechas dentro de la retícula: refuerza el uso sin ratón.
  months?.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;

    const cell = event.target.closest('[data-date]');
    if (!cell) return;

    event.preventDefault();
    const current = parseISODate(cell.dataset.date);
    const delta = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7
    }[event.key];

    const next = new Date(current.getFullYear(), current.getMonth(), current.getDate() + delta);
    if (state.view === 'year' && next.getFullYear() !== state.year) return;

    const nextISO = toISODate(next);
    state.selectedDate = nextISO;
    pendingFocusDate = nextISO;

    // La vista mensual sigue el foco al mes contiguo; el año se recarga solo
    // cuando la navegación cruza el 31 de diciembre.
    if (next.getFullYear() !== state.year) {
      loadYear(next.getFullYear(), { selectedDate: nextISO });
    } else {
      renderCalendar();
    }
  });

  dayList?.addEventListener('click', event => {
    const actionElement = event.target.closest('[data-action]');
    if (!actionElement) return;

    const action = actionElement.dataset.action;
    const id = actionElement.dataset.id;

    if (action === 'new-day') {
      openMaintenanceModal({ date: state.selectedDate });
      return;
    }

    if (action === 'edit') {
      const maintenance = state.events.find(item => item.id === id);
      if (maintenance) openMaintenanceModal({ event: maintenance });
      return;
    }

    if (action === 'toggle') {
      toggleEventStatus(id);
      return;
    }

    if (action === 'delete') {
      deleteEvent(id);
    }
  });

  prevYear?.addEventListener('click', () => {
    if (state.view === 'month') {
      shiftMonth(-1);
    } else {
      loadYear(state.year - 1);
    }
  });

  nextYear?.addEventListener('click', () => {
    if (state.view === 'month') {
      shiftMonth(1);
    } else {
      loadYear(state.year + 1);
    }
  });

  todayButton?.addEventListener('click', () => {
    const today = new Date();
    const todayString = toISODate(today);
    if (state.year !== today.getFullYear()) {
      loadYear(today.getFullYear(), { selectedDate: todayString });
    } else {
      state.selectedDate = todayString;
      renderCalendar();
    }
  });

  viewButtons.forEach(button => {
    button.addEventListener('click', () => {
      const view = button.dataset.calendarView === 'year' ? 'year' : 'month';
      if (state.view === view) return;

      state.view = view;
      saveViewPreference(view);
      applyViewButtons();
      renderCalendar();
    });
  });

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.dataset.calendarFilter || 'todos';
      if (state.filter === filter) return;

      state.filter = filter;
      filterButtons.forEach(item => {
        item.setAttribute('aria-pressed', String(item === button));
      });
      renderCalendar();
    });
  });

  newButton?.addEventListener('click', () => openMaintenanceModal({ date: state.selectedDate }));
  newDayButton?.addEventListener('click', () => openMaintenanceModal({ date: state.selectedDate }));

  closeButton?.addEventListener('click', () => closeModal(overlay));
  cancelButton?.addEventListener('click', () => closeModal(overlay));
  form?.addEventListener('submit', handleMaintenanceSubmit);

  assetInput?.addEventListener('change', () => {
    const asset = state.assets.find(item => item.id === assetInput.value);
    const departmentInput = document.getElementById('maintenance-department');
    if (asset && departmentInput && !departmentInput.value.trim()) {
      departmentInput.value = asset.department || '';
    }
  });
}
