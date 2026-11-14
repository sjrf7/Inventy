/**
 * Motor de gráficos de Inventy
 */

import { getDepartmentOptions, escapeAttr } from './utils.js';
import { animateCount } from './motion.js';

/**
 * Renderiza el gráfico de dona en SVG del panel principal junto con su leyenda.
 * @param {Array} assets - Lista de bienes
 * @param {Object} STATUSES - Metadatos de estados provenientes de seed-data
 */
export function renderDonutChart(assets, STATUSES) {
  const donutSegments = document.getElementById("donut-segments");
  const donutSvg = document.getElementById("dashboard-donut-chart");
  const legendContainer = document.getElementById("donut-legend");
  const totalBadge = document.getElementById("donut-total-badge");

  if (!donutSegments || !legendContainer) return;

  donutSegments.innerHTML = "";
  legendContainer.innerHTML = "";
  if (totalBadge) {
    totalBadge.textContent = `${assets.length} ${assets.length === 1 ? "Equipo" : "Equipos"}`;
  }

  const total = assets.length || 1;

  // Cuenta los bienes por estado
  const statusCounts = {
    activo: assets.filter(a => a.status === "activo").length,
    reparacion: assets.filter(a => a.status === "reparacion").length,
    espera_repuesto: assets.filter(a => a.status === "espera_repuesto").length,
    desincorporado: assets.filter(a => a.status === "desincorporado").length
  };

  let cumulativePercent = 0;
  let segmentIndex = 0;
  const segmentsToAnimate = [];

  // Renderiza los segmentos circulares en SVG
  Object.keys(STATUSES).forEach(statusKey => {
    const count = assets.filter(a => a.status === statusKey).length;
    const percent = (count / total) * 100;

    if (percent > 0) {
      const visiblePercent = percent >= 100 ? 100 : Math.max(percent - 0.7, 0.4);
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("class", "donut-segment");
      circle.setAttribute("fill", "none");
      circle.setAttribute("cx", "23");
      circle.setAttribute("cy", "23");
      circle.setAttribute("r", "15.915");
      circle.setAttribute("stroke", STATUSES[statusKey].color);
      circle.setAttribute("stroke-dashoffset", `${-cumulativePercent}`);

      // Parte de cero y crece hasta su valor final en el siguiente frame.
      circle.style.strokeDasharray = "0 100";
      circle.style.transitionDelay = `${segmentIndex * 75}ms`;

      const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      title.textContent = `${STATUSES[statusKey].label}: ${count} (${Math.round(percent)}%)`;
      circle.appendChild(title);

      segmentsToAnimate.push({
        element: circle,
        value: `${visiblePercent} ${100 - visiblePercent}`
      });

      donutSegments.appendChild(circle);
      segmentIndex += 1;
      cumulativePercent += percent;
    }

    // Renderiza el elemento de la leyenda
    const percentRound = Math.round((count / total) * 100);
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `
      <span class="legend-color" style="background-color: ${STATUSES[statusKey].color}"></span>
      <span class="legend-label">${STATUSES[statusKey].label}</span>
      <span class="legend-value">${count}<span class="legend-pct">${percentRound}%</span></span>
    `;
    legendContainer.appendChild(item);
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      segmentsToAnimate.forEach(({ element, value }) => {
        element.style.strokeDasharray = value;
      });
    });
  });

  // Número central del gráfico
  if (donutSvg) {
    donutSvg.querySelectorAll(".donut-center-text, .donut-center-subtext").forEach(el => el.remove());

    const centerNumber = document.createElementNS("http://www.w3.org/2000/svg", "text");
    centerNumber.setAttribute("class", "donut-center-text");
    centerNumber.setAttribute("x", "23");
    centerNumber.setAttribute("y", "23.4");
    centerNumber.setAttribute("text-anchor", "middle");
    centerNumber.textContent = "0";

    const centerLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    centerLabel.setAttribute("class", "donut-center-subtext");
    centerLabel.setAttribute("x", "23");
    centerLabel.setAttribute("y", "27.6");
    centerLabel.setAttribute("text-anchor", "middle");
    centerLabel.textContent = assets.length === 1 ? "Bien" : "Bienes";

    donutSvg.appendChild(centerNumber);
    donutSvg.appendChild(centerLabel);

    animateCount(centerNumber, assets.length, { duration: 820 });
  }
}

/**
 * Renderiza el gráfico de barras de la distribución de bienes por dirección.
 * Solo muestra las direcciones que efectivamente tienen bienes asignados.
 * @param {Array} assets - Lista de bienes
 * @param {Array} DEPARTMENTS - Lista de nombres de direcciones
 */
export function renderDepartmentChart(assets, DEPARTMENTS) {
  const deptChartContainer = document.getElementById("dashboard-dept-chart");
  if (!deptChartContainer) return;

  deptChartContainer.innerHTML = "";

  if (assets.length === 0) {
    deptChartContainer.innerHTML = `<div class="bar-chart-empty">Sin bienes registrados todavía.</div>`;
    return;
  }

  const departments = getDepartmentOptions(assets, DEPARTMENTS);

  // Cuenta los bienes por dirección y descarta las direcciones vacías
  const rows = departments
    .map(dept => ({
      dept,
      count: assets.filter(a => a.department === dept).length
    }))
    .filter(row => row.count > 0)
    .sort((a, b) => b.count - a.count || a.dept.localeCompare(b.dept, "es"));

  if (rows.length === 0) {
    deptChartContainer.innerHTML = `<div class="bar-chart-empty">Sin direcciones asignadas.</div>`;
    return;
  }

  const maxDeptCount = Math.max(...rows.map(row => row.count), 1);
  const total = assets.length || 1;

  rows.forEach((row, index) => {
    const widthPercent = (row.count / maxDeptCount) * 100;
    const sharePercent = Math.round((row.count / total) * 100);

    const el = document.createElement("div");
    el.className = "bar-row";
    el.innerHTML = `
      <div class="bar-info">
        <span class="bar-dept-name">${escapeAttr(row.dept)}</span>
        <span class="bar-dept-count">${row.count}<span class="bar-dept-pct">${sharePercent}%</span></span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width: 0%"></div>
      </div>
    `;
    deptChartContainer.appendChild(el);

    // Anima la expansión del ancho de la barra con un desfase por fila
    requestAnimationFrame(() => {
      const fill = el.querySelector(".bar-fill");
      if (fill) {
        fill.style.transitionDelay = `${Math.min(index, 10) * 45}ms`;
        requestAnimationFrame(() => {
          fill.style.width = `${widthPercent}%`;
        });
      }
    });
  });
}

/**
 * Calcula y renderiza la distribución de bienes por tipo de equipo.
 * @param {Array} assets - Lista de bienes
 */
export function renderTypeDistribution(assets) {
  const container = document.getElementById("dashboard-types-grid");
  if (!container) return;

  container.innerHTML = "";

  if (assets.length === 0) {
    container.innerHTML = `<div class="bar-chart-empty" style="grid-column: 1 / -1;">Sin bienes registrados todavía.</div>`;
    return;
  }

  const total = assets.length;

  const typeCounts = {
    laptop: 0,
    desktop: 0,
    server: 0,
    printer: 0,
    monitor: 0,
    keyboard: 0,
    mouse: 0,
    other: 0
  };

  assets.forEach(a => {
    const name = (a.name || "").toLowerCase();
    if (name.includes("laptop") || name.includes("portatil") || name.includes("notebook")) {
      typeCounts.laptop++;
    } else if (name.includes("servidor") || name.includes("server") || name.includes("rack") || name.includes("switch") || name.includes("router")) {
      typeCounts.server++;
    } else if (name.includes("impresora") || name.includes("printer") || name.includes("multifuncional")) {
      typeCounts.printer++;
    } else if (name.includes("monitor") || name.includes("pantalla") || name.includes("display") || name.includes("tv")) {
      typeCounts.monitor++;
    } else if (name.includes("teclado") || name.includes("keyboard")) {
      typeCounts.keyboard++;
    } else if (name.includes("mouse") || name.includes("raton")) {
      typeCounts.mouse++;
    } else if (name.includes("pc") || name.includes("desktop") || name.includes("escritorio") || name.includes("computador") || name.includes("all in one") || name.includes("aio")) {
      typeCounts.desktop++;
    } else {
      typeCounts.other++;
    }
  });

  const typesConfig = [
    {
      key: "laptop",
      label: "Laptops",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="20" x2="22" y2="20"/><line x1="12" y1="17" x2="12" y2="20"/></svg>`
    },
    {
      key: "desktop",
      label: "PCs de escritorio",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="12" rx="2"/><line x1="9" y1="21" x2="15" y2="21"/><line x1="12" y1="15" x2="12" y2="21"/></svg>`
    },
    {
      key: "server",
      label: "Servidores y red",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>`
    },
    {
      key: "printer",
      label: "Impresoras",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`
    },
    {
      key: "monitor",
      label: "Monitores",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="3" width="20" height="12" rx="2" ry="2"/><line x1="12" y1="15" x2="12" y2="21"/><line x1="8" y1="21" x2="16" y2="21"/></svg>`
    },
    {
      key: "keyboard",
      label: "Teclados",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><line x1="6" y1="8" x2="6.01" y2="8"/><line x1="10" y1="8" x2="10.01" y2="8"/><line x1="14" y1="8" x2="14.01" y2="8"/><line x1="18" y1="8" x2="18.01" y2="8"/><line x1="6" y1="12" x2="6.01" y2="12"/><line x1="10" y1="12" x2="10.01" y2="12"/><line x1="14" y1="12" x2="14.01" y2="12"/><line x1="18" y1="12" x2="18.01" y2="12"/><line x1="7" y1="16" x2="17" y2="16"/></svg>`
    },
    {
      key: "mouse",
      label: "Mouses",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="5" y="2" width="14" height="20" rx="7"/><path d="M12 2v10"/><path d="M5 9h14"/></svg>`
    },
    {
      key: "other",
      label: "Otros equipos",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`
    }
  ];

  typesConfig
    .map(cfg => ({ ...cfg, count: typeCounts[cfg.key] }))
    .filter(cfg => cfg.count > 0)
    .sort((a, b) => b.count - a.count)
    .forEach(cfg => {
      const percent = Math.round((cfg.count / total) * 100);

      const card = document.createElement("div");
      card.className = "type-card";
      card.innerHTML = `
        <div class="type-icon-wrapper">
          ${cfg.icon}
        </div>
        <div class="type-info-container">
          <span class="type-label">${cfg.label}</span>
          <span class="type-count">${cfg.count}<span class="type-percentage">${percent}%</span></span>
        </div>
      `;
      container.appendChild(card);
    });
}
