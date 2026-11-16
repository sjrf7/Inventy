import { renderDonutChart, renderDepartmentChart, renderTypeDistribution } from '../charts.js';
import { formatDate, isInSupport, escapeAttr, escapeHtml } from '../utils.js';
import { animateCount } from '../motion.js';

/**
 * Renderiza los contadores estadísticos del panel principal.
 * @param {Array} assets - Bienes actuales
 */
export function updateStatsCounters(assets) {
  const total = assets.length;
  const active = assets.filter(a => a.status === "activo").length;
  const maintenance = assets.filter(a => isInSupport(a.status)).length;
  const deincorporated = assets.filter(a => a.status === "desincorporado").length;
  
  const elTotal = document.getElementById("stat-total");
  const elActive = document.getElementById("stat-active");
  const elMaint = document.getElementById("stat-maintenance");
  const elDeincorporated = document.getElementById("stat-deincorporated");

  if (elTotal) animateCount(elTotal, total);
  if (elActive) animateCount(elActive, active);
  if (elMaint) animateCount(elMaint, maintenance);
  if (elDeincorporated) animateCount(elDeincorporated, deincorporated);
}

/**
 * Renderiza la lista de actividades recientes (eventos del historial ordenados de forma descendente).
 * @param {Array} assets - Bienes actuales
 */
export function renderRecentActivity(assets) {
  const activityContainer = document.getElementById("dashboard-recent-activity");
  if (!activityContainer) return;

  activityContainer.innerHTML = "";
  
  // Reúne todos los eventos del historial de todos los bienes
  let allHistory = [];
  assets.forEach(asset => {
    if (asset.history) {
      asset.history.forEach(hist => {
        allHistory.push({
          assetName: asset.name,
          assetNro: asset.nroBien,
          ...hist
        });
      });
    }
  });
  
  // Ordena el historial por fecha de forma descendente
  allHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Toma los 5 movimientos más recientes
  const recentActivity = allHistory.slice(0, 5);
  
  if (recentActivity.length === 0) {
    activityContainer.innerHTML = `
      <div style="text-align:center; padding: 20px; color: var(--text-muted);">
        Sin movimientos registrados
      </div>
    `;
    return;
  }
  
  recentActivity.forEach(activity => {
    const item = document.createElement("div");
    item.className = "activity-item";
    
    let icon = "";
    if (activity.type === "registro") {
      icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>`;
    } else if (activity.type === "traspaso") {
      icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`;
    } else if (activity.type === "mantenimiento") {
      icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;
    } else if (activity.type === "cambio_estado") {
      icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`;
    } else if (activity.type === "desincorporacion") {
      icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>`;
    } else {
      icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`;
    }
    
    item.innerHTML = `
      <div class="activity-type-icon ${escapeAttr(activity.type)}">
        ${icon}
      </div>
      <div class="activity-details">
        <div class="activity-title">${escapeHtml(activity.assetName)} (${escapeHtml(activity.assetNro)})</div>
        <div class="activity-desc">${escapeHtml(activity.details)}</div>
        <div class="activity-meta">
          <span>Realizado por: ${escapeHtml(activity.user || "Sistema")}</span>
          <span>${formatDate(activity.date)}</span>
        </div>
      </div>
    `;
    activityContainer.appendChild(item);
  });
}

/**
 * Orquestador principal para cargar todos los elementos visuales del panel de inicio.
 */
export function initDashboard(assets, STATUSES, DEPARTMENTS) {
  updateStatsCounters(assets);
  renderDonutChart(assets, STATUSES);
  renderTypeDistribution(assets);
  renderDepartmentChart(assets, DEPARTMENTS);
  renderRecentActivity(assets);
}
