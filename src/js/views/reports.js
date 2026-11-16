/**
 * Generador de Reportes de Inventy
 */

import { getDepartmentOptions, getStatusInfo, isInSupport, escapeHtml } from '../utils.js';
import { animateCount, staggerChildren } from '../motion.js';

/**
 * Construye e inyecta el HTML del reporte imprimible seleccionado.
 * @param {Array} assets - Lista de bienes actuales
 * @param {Object} STATUSES - Mapa de metadatos de estados
 * @param {Array} DEPARTMENTS - Lista de direcciones
 */
export function generateReport(assets, STATUSES, DEPARTMENTS) {
  const reportTypeEl = document.getElementById("report-type");
  const reportArea = document.getElementById("printable-report-area");
  
  if (!reportTypeEl || !reportArea) return;

  const reportType = reportTypeEl.value;
  const departments = getDepartmentOptions(assets, DEPARTMENTS);
  reportArea.innerHTML = "";

  let contextLabel = "Informe general";
  let contextDetail = `${assets.length} ${assets.length === 1 ? "bien registrado" : "bienes registrados"}`;
  
  const now = new Date();
  const dateStr = now.toLocaleDateString("es-ES");
  const timeStr = now.toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' });
  
  const userStr = localStorage.getItem("inventy_user") || sessionStorage.getItem("inventy_user");
  let currentUserStr = "Samuel (Soporte)";
  if (userStr) {
    try {
      const u = JSON.parse(userStr);
      let role = u.role || 'Soporte';
      if (role.toLowerCase() === 'soporte ti') {
        role = 'Soporte';
      }
      currentUserStr = `${u.fullname || u.username} (${role})`;
    } catch (e) {}
  }

  let html = `
    <div class="report-header">
      <div class="report-brand">
        <div class="brand-logo" style="width:28px; height:28px;">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px;">
            <path d="M21 16.5v-9L12 3 3 7.5v9l9 4.5 9-4.5ZM12 21V12M12 12l9-4.5M12 12L3 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="report-brand-name">INVENTY</span>
      </div>
      <div class="report-metadata">
        <span><strong>Fecha de Generación:</strong> ${dateStr}</span>
        <span><strong>Hora:</strong> ${timeStr}</span>
        <span><strong>Generado por:</strong> ${escapeHtml(currentUserStr)}</span>
      </div>
    </div>
  `;
  
  if (reportType === "institucion") {
    html += `<h2 class="report-main-title">Informe General del Estado de Bienes Nacionales</h2>`;
    
    const total = assets.length;
    const active = assets.filter(a => a.status === "activo").length;
    const maintenance = assets.filter(a => isInSupport(a.status)).length;
    const retired = assets.filter(a => a.status === "desincorporado").length;
    
    html += `
      <div class="report-grid-summary">
        <div class="report-summary-box">
          <div class="report-summary-val">${total}</div>
          <div class="report-summary-lbl">Bienes Registrados</div>
        </div>
        <div class="report-summary-box" style="border-color: var(--success);">
          <div class="report-summary-val" style="color:var(--success);">${active}</div>
          <div class="report-summary-lbl">Activos</div>
        </div>
        <div class="report-summary-box" style="border-color: var(--warning);">
          <div class="report-summary-val" style="color:var(--warning);">${maintenance}</div>
          <div class="report-summary-lbl">En Soporte / Falla</div>
        </div>
        <div class="report-summary-box" style="border-color: var(--danger);">
          <div class="report-summary-val" style="color:var(--danger);">${retired}</div>
          <div class="report-summary-lbl">Desincorporados</div>
        </div>
      </div>
      
      <h4 style="margin: 20px 0 10px 0;">Distribución por Direcciones e Institución</h4>
      <div class="report-table-wrapper">
        <table class="report-table">
          <thead>
            <tr>
              <th>Dirección / Oficina</th>
              <th>Bienes Totales</th>
              <th>Activos</th>
              <th>En Soporte</th>
              <th>Desincorporados</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    const reportDepartments = departments
      .map(dept => ({
        dept,
        total: assets.filter(a => a.department === dept).length
      }))
      .filter(row => row.total > 0)
      .sort((a, b) => b.total - a.total || a.dept.localeCompare(b.dept, "es"));

    if (reportDepartments.length === 0) {
      html += `<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">No hay direcciones con bienes registrados.</td></tr>`;
    }

    reportDepartments.forEach(({ dept }) => {
      const deptAssets = assets.filter(a => a.department === dept);
      const dTotal = deptAssets.length;
      const dActive = deptAssets.filter(a => a.status === "activo").length;
      const dRep = deptAssets.filter(a => isInSupport(a.status)).length;
      const dRet = deptAssets.filter(a => a.status === "desincorporado").length;
      
      html += `
        <tr>
          <td><strong>${escapeHtml(dept)}</strong></td>
          <td>${dTotal}</td>
          <td>${dActive}</td>
          <td>${dRep}</td>
          <td>${dRet}</td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
      </div>
    `;
    
  } else if (reportType === "direccion") {
    const selectedDept = document.getElementById("report-param-dept")?.value || departments[0] || "Sin dirección";
    const deptAssets = assets.filter(a => a.department === selectedDept);
    contextLabel = "Detalle por dirección";
    contextDetail = selectedDept;
    
    html += `
      <h2 class="report-main-title">Inventario Detallado de Bienes</h2>
      <h3 style="text-align:center; color:var(--text-secondary); margin-bottom: 20px;">Dirección: ${escapeHtml(selectedDept)}</h3>
      
      <div class="report-grid-summary" style="grid-template-columns: repeat(3, 1fr);">
        <div class="report-summary-box">
          <div class="report-summary-val">${deptAssets.length}</div>
          <div class="report-summary-lbl">Bienes en Oficina</div>
        </div>
        <div class="report-summary-box" style="border-color: var(--success);">
          <div class="report-summary-val" style="color:var(--success);">${deptAssets.filter(a => a.status === "activo").length}</div>
          <div class="report-summary-lbl">Operativos</div>
        </div>
        <div class="report-summary-box" style="border-color: var(--warning);">
          <div class="report-summary-val" style="color:var(--warning);">${deptAssets.filter(a => isInSupport(a.status)).length}</div>
          <div class="report-summary-lbl">Falla / Reparación</div>
        </div>
      </div>
      
      <div class="report-table-wrapper">
        <table class="report-table">
          <thead>
            <tr>
              <th>NRO Bien</th>
              <th>Nombre del Equipo</th>
              <th>Marca / Modelo</th>
              <th>Número de Serie</th>
              <th>Estado</th>
              <th>Descripción</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    if (deptAssets.length === 0) {
      html += `<tr><td colspan="6" style="text-align:center;">No hay bienes registrados en esta dirección.</td></tr>`;
    } else {
      deptAssets.forEach(a => {
        const statusInfo = getStatusInfo(a.status, STATUSES);
        const brand = a.technicalSpecs?.brand || "-";
        const model = a.technicalSpecs?.model || "-";
        const serial = a.technicalSpecs?.serialNumber || "-";
        
        html += `
          <tr>
            <td><strong>${escapeHtml(a.nroBien)}</strong></td>
            <td>${escapeHtml(a.name)}</td>
            <td>${escapeHtml(brand)} / ${escapeHtml(model)}</td>
            <td><code>${escapeHtml(serial)}</code></td>
            <td><span style="color: ${statusInfo.color}">${escapeHtml(statusInfo.label)}</span></td>
            <td>${escapeHtml(a.description || "-")}</td>
          </tr>
        `;
      });
    }
    
    html += `
          </tbody>
        </table>
      </div>
    `;
    
  } else if (reportType === "estado") {
    const selectedStatus = document.getElementById("report-param-status")?.value || "reparacion";
    const statusAssets = assets.filter(a => a.status === selectedStatus);
    const statusInfo = getStatusInfo(selectedStatus, STATUSES);
    contextLabel = "Detalle por estado";
    contextDetail = statusInfo.label;
    
    html += `
      <h2 class="report-main-title">Reporte Especial de Bienes en Estado: ${escapeHtml(statusInfo.label)}</h2>
      <p style="text-align:center; color:var(--text-muted); margin-bottom: 20px;">Listado de control para soporte técnico, adquisiciones y desincorporación.</p>
      
      <div class="report-table-wrapper">
        <table class="report-table">
          <thead>
            <tr>
              <th>NRO Bien</th>
              <th>Nombre del Equipo</th>
              <th>Ubicación / Dirección</th>
              <th>Modelo y Componentes</th>
              <th>Último Diagnóstico Técnico</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    if (statusAssets.length === 0) {
      html += `<tr><td colspan="5" style="text-align:center;">No hay bienes registrados en este estado.</td></tr>`;
    } else {
      statusAssets.forEach(a => {
        const specsStr = `${a.technicalSpecs?.brand || ""} ${a.technicalSpecs?.model || ""}`.trim() || "-";
        const lastReport = a.reports && a.reports.length > 0 ? a.reports[a.reports.length - 1] : null;
        const diagnosis = lastReport ? lastReport.diagnosis : "Sin incidencias registradas en soporte.";
        
        html += `
          <tr>
            <td><strong>${escapeHtml(a.nroBien)}</strong></td>
            <td>${escapeHtml(a.name)}</td>
            <td>${escapeHtml(a.department)}</td>
            <td>${escapeHtml(specsStr)}</td>
            <td>${escapeHtml(diagnosis)}</td>
          </tr>
        `;
      });
    }
    html += `
          </tbody>
        </table>
      </div>
    `;
  } else if (reportType === "condicion") {
    contextLabel = "Condición y operatividad";
    contextDetail = `${assets.length} ${assets.length === 1 ? "equipo evaluado" : "equipos evaluados"}`;
    html += `
      <h2 class="report-main-title">Informe de Condición, Operatividad y Obsolescencia</h2>
      <p style="text-align:center; color:var(--text-muted); margin-bottom: 20px;">Listado analítico del estado físico y tecnológico de los bienes nacionales.</p>
      
      <div class="report-table-wrapper">
        <table class="report-table">
          <thead>
            <tr>
              <th>NRO Bien</th>
              <th>Equipo / Características</th>
              <th>Dirección</th>
              <th>Condición de Operatividad</th>
              <th>Defectos / Observaciones Técnicas</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    if (assets.length === 0) {
      html += `<tr><td colspan="5" style="text-align:center;">No hay bienes registrados.</td></tr>`;
    } else {
      assets.forEach(a => {
        const specsData = a.technicalSpecs || {};

        // 1. Especificaciones técnicas
        const specs = [];
        if (specsData.brand) specs.push(specsData.brand);
        if (specsData.model) specs.push(specsData.model);
        if (specsData.processor) specs.push(specsData.processor);
        if (specsData.ram) specs.push(`RAM: ${specsData.ram}`);
        if (specsData.storage) specs.push(`Alm: ${specsData.storage}`);
        const specsStr = specs.length > 0 ? specs.join(" | ") : "Sin especificaciones registradas";

        // 2. Determinar condición: primero el estado operativo, luego la
        // condición registrada del bien y, solo como respaldo, la descripción.
        const conditionKey = String(a.condition || "").toLowerCase();
        let conditionLabel = "Bueno (Operativo)";
        let conditionColor = "var(--success)";

        if (a.status === "desincorporado") {
          conditionLabel = "Obsoleto (Fuera de Servicio)";
          conditionColor = "var(--danger)";
        } else if (a.status === "reparacion" || a.status === "espera_repuesto") {
          conditionLabel = "Defectuoso (En reparación)";
          conditionColor = "var(--warning)";
        } else if (conditionKey === "obsoleto") {
          conditionLabel = "Obsoleto (En uso)";
          conditionColor = "var(--danger)";
        } else if (conditionKey === "mejorable") {
          conditionLabel = "Mejorable (Operativo)";
          conditionColor = "var(--warning)";
        } else if (!conditionKey) {
          const lowerDesc = (a.description || "").toLowerCase();
          if (lowerDesc.includes("obsoleto") || lowerDesc.includes("viejo") || lowerDesc.includes("desgaste")) {
            conditionLabel = "Obsoleto (En uso)";
            conditionColor = "var(--danger)";
          } else if (lowerDesc.includes("lento") || lowerDesc.includes("actualizar") || lowerDesc.includes("limpieza") || (specsData.ram && (specsData.ram.includes("4 GB") || specsData.ram.includes("2 GB")))) {
            conditionLabel = "Mejorable (Operativo)";
            conditionColor = "var(--warning)";
          }
        }

        // 3. Determinar observaciones/defectos
        let observations = "Operando en condiciones normales sin fallas reportadas.";
        if (a.status === "reparacion" || a.status === "espera_repuesto" || a.status === "desincorporado") {
          const lastReport = a.reports && a.reports.length > 0 ? a.reports[a.reports.length - 1] : null;
          if (lastReport) {
            observations = `<strong>Diagnóstico técnico:</strong> ${escapeHtml(lastReport.diagnosis)}`;
          } else if (a.description) {
            observations = `<strong>Detalles del reporte:</strong> ${escapeHtml(a.description)}`;
          } else {
            observations = "Equipo en revisión técnica por falla no detallada.";
          }
        }

        html += `
          <tr>
            <td><strong>${escapeHtml(a.nroBien)}</strong></td>
            <td>
              <div style="font-weight:600; color:var(--text-primary);">${escapeHtml(a.name)}</div>
              <div style="font-size:11.5px; color:var(--text-muted); margin-top:2px;">${escapeHtml(specsStr)}</div>
            </td>
            <td>${escapeHtml(a.department)}</td>
            <td>
              <span style="display:inline-flex; align-items:center; gap:6px; font-weight:600; color:${conditionColor}">
                <span style="width:8px; height:8px; border-radius:50%; background-color:${conditionColor}"></span>
                ${conditionLabel}
              </span>
            </td>
            <td style="font-size:12.5px; color:var(--text-secondary); max-width:280px; line-height:1.4;">${observations}</td>
          </tr>
        `;
      });
    }
    
    html += `
          </tbody>
        </table>
      </div>
    `;
  }
  
  // Agrega la sección de firmas al final del reporte
  html += `
    <div class="report-footer-signatures">
      <div class="signature-line">
        <strong>Preparado por:</strong><br>
        Soporte Técnico y Telecomunicaciones
      </div>
      <div class="signature-line">
        <strong>Recibido conforme por:</strong><br>
        Jefe de Dirección / Administración de Bienes
      </div>
    </div>
  `;
  
  reportArea.innerHTML = html;

  // Entrada del documento y de sus filas
  reportArea.classList.remove("report-enter");
  void reportArea.offsetWidth;
  reportArea.classList.add("report-enter");
  staggerChildren(reportArea, ".report-table tbody tr", { step: 18, max: 12 });

  // Los indicadores numéricos se cuentan desde cero
  reportArea.querySelectorAll(".report-summary-val").forEach(valueEl => {
    const value = parseInt(valueEl.textContent.replace(/\D/g, ""), 10);
    if (!Number.isNaN(value)) {
      animateCount(valueEl, value, { duration: 620 });
    }
  });

  // Actualiza el contexto del selector de informes
  const contextText = document.querySelector("#report-context span");
  if (contextText) {
    contextText.innerHTML = `${escapeHtml(contextLabel)} · <strong>${escapeHtml(contextDetail)}</strong>`;
  }
}
