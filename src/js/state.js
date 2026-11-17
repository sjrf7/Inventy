let assets = [];

/**
 * Carga el estado de los bienes desde la API REST SQL de PHP.
 * @returns {Promise<Array>} La lista de bienes
 */
export function loadState() {
  return fetch("api/assets.php")
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => {
          throw new Error(err.error || "Error de servidor HTTP " + response.status);
        });
      }
      return response.json();
    })
    .then(data => {
      assets = data;
      return assets;
    })
    .catch(e => {
      console.error("Error cargando inventario desde API PHP:", e);
      assets = [];
      throw e;
    });
}

/**
 * Guarda el estado actual de los bienes (sin efecto: el guardado se maneja directamente mediante la API).
 */
export function saveState() {
  // Los cambios se gestionan directamente a través de las actualizaciones de la API
}

/**
 * Devuelve la lista de bienes almacenados en memoria caché.
 * @returns {Array}
 */
export function getAssets() {
  return assets;
}

/**
 * Agrega un nuevo bien a la base de datos SQL del backend y actualiza la caché local.
 * @param {Object} asset 
 * @returns {Promise<Object>} El bien creado
 */
export function addAsset(asset) {
  return fetch("api/assets.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(asset)
  })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => {
          throw new Error(err.error || "Error guardando bien");
        });
      }
      return response.json();
    })
    .then(newAsset => {
      assets.push(newAsset);
      return newAsset;
    });
}

/**
 * Actualiza un bien por su ID en la base de datos SQL del backend y actualiza la caché local.
 * @param {string} id - ID del bien
 * @param {Object} updatedFields - Campos a actualizar
 * @returns {Promise<Object>} El bien actualizado
 */
export function updateAsset(id, updatedFields) {
  const currentAsset = assets.find(a => a.id === id);
  if (!currentAsset) {
    return Promise.reject(new Error("Bien no encontrado en cache local"));
  }

  // Copia profunda y fusión del historial y de los reportes
  const mergedAsset = {
    ...currentAsset,
    ...updatedFields,
    technicalSpecs: {
      ...currentAsset.technicalSpecs,
      ...(updatedFields.technicalSpecs || {})
    }
  };

  return fetch("api/assets.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(mergedAsset)
  })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => {
          throw new Error(err.error || "Error actualizando bien");
        });
      }
      return response.json();
    })
    .then(updatedAsset => {
      const idx = assets.findIndex(a => a.id === id);
      if (idx !== -1) {
        assets[idx] = updatedAsset;
      }
      return updatedAsset;
    });
}

/* -------------------------------------------------------------------------- */
/* Calendario de mantenimientos                                               */
/* -------------------------------------------------------------------------- */

let maintenanceEvents = [];

/**
 * Lee los errores de una respuesta de la API sin romper si el cuerpo no es JSON.
 * @param {Response} response
 * @returns {Promise<Error>}
 */
function readMaintenanceError(response) {
  return response.json()
    .then(payload => new Error(payload?.error || `Error de servidor HTTP ${response.status}`))
    .catch(() => new Error(`Error de servidor HTTP ${response.status}`));
}

/**
 * Carga los mantenimientos de un año desde la API PHP.
 * @param {number} year
 * @returns {Promise<Array>} Eventos del año solicitado
 */
export function loadMaintenanceEvents(year) {
  return fetch(`api/maintenance.php?year=${encodeURIComponent(year)}`)
    .then(response => {
      if (!response.ok) return readMaintenanceError(response).then(error => { throw error; });
      return response.json();
    })
    .then(data => {
      maintenanceEvents = Array.isArray(data) ? data : [];
      return maintenanceEvents;
    })
    .catch(error => {
      console.error("Error cargando el calendario de mantenimientos:", error);
      maintenanceEvents = [];
      throw error;
    });
}

/**
 * Devuelve los mantenimientos cargados en memoria.
 * @returns {Array}
 */
export function getMaintenanceEvents() {
  return maintenanceEvents;
}

/**
 * Crea un mantenimiento en el backend.
 * @param {Object} event
 * @returns {Promise<Object>}
 */
export function addMaintenanceEvent(event) {
  return fetch("api/maintenance.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event)
  })
    .then(response => {
      if (!response.ok) return readMaintenanceError(response).then(error => { throw error; });
      return response.json();
    })
    .then(created => {
      maintenanceEvents.push(created);
      return created;
    });
}

/**
 * Actualiza un mantenimiento existente.
 * @param {string} id
 * @param {Object} event
 * @returns {Promise<Object>}
 */
export function updateMaintenanceEvent(id, event) {
  return fetch("api/maintenance.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...event, id })
  })
    .then(response => {
      if (!response.ok) return readMaintenanceError(response).then(error => { throw error; });
      return response.json();
    })
    .then(updated => {
      const index = maintenanceEvents.findIndex(item => item.id === id);
      if (index !== -1) maintenanceEvents[index] = updated;
      return updated;
    });
}

/**
 * Elimina un mantenimiento del backend.
 * @param {string} id
 * @returns {Promise<void>}
 */
export function removeMaintenanceEvent(id) {
  return fetch(`api/maintenance.php?id=${encodeURIComponent(id)}`, {
    method: "DELETE"
  })
    .then(response => {
      if (!response.ok) return readMaintenanceError(response).then(error => { throw error; });
      return response.json();
    })
    .then(() => {
      maintenanceEvents = maintenanceEvents.filter(item => item.id !== id);
    });
}
