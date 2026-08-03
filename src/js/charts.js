/**
 * Motor de gráficos de Inventy
 */

/**
 * Renderiza el gráfico de dona en SVG del panel principal junto con su leyenda.
 * @param {Array} assets - Lista de bienes
 * @param {Object} STATUSES - Metadatos de estados provenientes de seed-data
 */
export function renderDonutChart(assets, STATUSES) {
  const donutSegments = document.getElementById("donut-segments");
  const legendContainer = document.getElementById("donut-legend");
  const totalBadge = document.getElementById("donut-total-badge");
  
  if (!donutSegments || !legendContainer) return;

  donutSegments.innerHTML = "";
  legendContainer.innerHTML = "";
  if (totalBadge) {
    totalBadge.textContent = `${assets.length} Equipos`;
  }

  const total = assets.length || 1; // Evita la división entre cero

  // Cuenta los bienes por estado
  const statusCounts = {
    activo: assets.filter(a => a.status === "activo").length,
    reparacion: assets.filter(a => a.status === "reparacion").length,
    desincorporado: assets.filter(a => a.status === "desincorporado").length
  };

  let cumulativePercent = 0;

  // Renderiza los segmentos circulares en SVG
  Object.keys(STATUSES).forEach(statusKey => {
    const count = statusCounts[statusKey] || 0;
    const percent = (count / total) * 100;

    if (percent > 0) {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("class", "donut-segment");
      circle.setAttribute("fill", "none");
      circle.setAttribute("cx", "23");
      circle.setAttribute("cy", "23");
      circle.setAttribute("r", "15.915");
      circle.setAttribute("stroke", STATUSES[statusKey].color);
      circle.setAttribute("stroke-dasharray", `${percent} ${100 - percent}`);
      circle.setAttribute("stroke-dashoffset", `${-cumulativePercent}`);
      donutSegments.appendChild(circle);

      cumulativePercent += percent;
    }

    // Renderiza el elemento de la leyenda
    const percentRound = Math.round((count / total) * 100);
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `
      <span class="legend-color" style="background-color: ${STATUSES[statusKey].color}"></span>
      <span>${STATUSES[statusKey].label}: <strong>${count}</strong> (${percentRound}%)</span>
    `;
    legendContainer.appendChild(item);
  });
}

/**
 * Renderiza el gráfico de barras de la distribución de bienes por dirección.
 * @param {Array} assets - Lista de bienes
 * @param {Array} DEPARTMENTS - Lista de nombres de direcciones
 */
export function renderDepartmentChart(assets, DEPARTMENTS) {
  const deptChartContainer = document.getElementById("dashboard-dept-chart");
  if (!deptChartContainer) return;

  deptChartContainer.innerHTML = "";

  // Cuenta los bienes por dirección
  const deptCounts = {};
  DEPARTMENTS.forEach(dept => {
    deptCounts[dept] = assets.filter(a => a.department === dept).length;
  });

  // Obtiene el valor máximo para escalar el ancho de las barras
  const maxDeptCount = Math.max(...Object.values(deptCounts), 1);

  DEPARTMENTS.forEach(dept => {
    const count = deptCounts[dept] || 0;
    const percentOfMax = (count / maxDeptCount) * 100;

    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <div class="bar-info">
        <span class="bar-dept-name">${dept}</span>
        <span class="bar-dept-count">${count}</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width: 0%"></div>
      </div>
    `;
    deptChartContainer.appendChild(row);

    // Anima la expansión del ancho de la barra
    setTimeout(() => {
      const fill = row.querySelector(".bar-fill");
      if (fill) fill.style.width = `${percentOfMax}%`;
    }, 50);
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

  const total = assets.length || 1;

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
    const name = a.name.toLowerCase();
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
      label: "PCs Escritorio",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="12" rx="2"/><line x1="9" y1="21" x2="15" y2="21"/><line x1="12" y1="15" x2="12" y2="21"/></svg>`
    },
    {
      key: "server",
      label: "Servidores y Red",
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
      label: "Otros Equipos",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`
    }
  ];

  typesConfig.forEach((cfg) => {
    const count = typeCounts[cfg.key];
    const percent = Math.round((count / total) * 100) || 0;

    const card = document.createElement("div");
    card.className = "type-card";
    
    if (count === 0) {
      card.style.opacity = "0.45";
    }

    card.innerHTML = `
      <div class="type-icon-wrapper">
        ${cfg.icon}
      </div>
      <div class="type-info-container">
        <span class="type-label">${cfg.label}</span>
        <span class="type-count">
          ${count} 
          <span class="type-percentage">(${percent}%)</span>
        </span>
      </div>
    `;
    container.appendChild(card);
  });
}

