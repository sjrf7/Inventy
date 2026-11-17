/**
 * Motor de Autenticación de Inventy
 * Maneja las transiciones dinámicas del inicio de sesión y la validación de credenciales contra la base de datos.
 */

/**
 * Actualiza la barra lateral con los detalles del perfil del usuario conectado.
 * @param {Object} user - Objeto con los datos del usuario.
 */
export function updateSidebarProfile(user) {
  if (!user) return;
  const userNameEl = document.querySelector(".sidebar .user-name");
  const userRoleEl = document.querySelector(".sidebar .user-role");
  const userAvatarEl = document.querySelector(".sidebar .user-avatar");

  if (userNameEl) userNameEl.textContent = user.fullname || user.username;
  if (userRoleEl) userRoleEl.textContent = user.role || "Usuario";
  
  if (userAvatarEl && user.fullname) {
    // Genera las iniciales del nombre completo para el avatar
    const parts = user.fullname.split(" ");
    const initials = parts.filter(Boolean).map(p => p[0]).slice(0, 2).join("").toUpperCase();
    userAvatarEl.textContent = initials || "US";
  }
}

/**
 * Activa o desactiva la interactividad del panel principal mientras el login
 * está visible, para que el foco y los lectores de pantalla no entren en él.
 * @param {boolean} isInert
 */
function setAppInert(isInert) {
  const app = document.querySelector(".app-container");
  if (!app) return;
  if (isInert) {
    app.setAttribute("inert", "");
  } else {
    app.removeAttribute("inert");
  }
}

/**
 * Verifica si el usuario está autenticado actualmente (sea en localStorage o sessionStorage).
 * @returns {boolean} - Retorna true si hay una sesión activa.
 */
export function checkAuth() {
  const session = localStorage.getItem("inventy_session") || sessionStorage.getItem("inventy_session");
  const userStr = localStorage.getItem("inventy_user") || sessionStorage.getItem("inventy_user");
  
  if (session === "active") {
    document.body.classList.remove("auth-active");
    setAppInert(false);
    const loginOverlay = document.getElementById("login-screen");
    if (loginOverlay) {
      loginOverlay.style.display = "none";
    }
    if (userStr) {
      try {
        updateSidebarProfile(JSON.parse(userStr));
      } catch (e) {
        console.error("Error al procesar los datos de sesión del usuario:", e);
      }
    }
    return true;
  } else {
    document.body.classList.add("auth-active");
    setAppInert(true);
    const loginOverlay = document.getElementById("login-screen");
    if (loginOverlay) {
      loginOverlay.style.display = "flex";
      loginOverlay.classList.remove("exit-active");
    }
    return false;
  }
}

/**
 * Inicializa los escuchadores de eventos de autenticación y los enlaces del formulario.
 * @param {Function} onLoginSuccess - Callback ejecutado cuando el usuario inicia sesión exitosamente.
 */
export function initAuth(onLoginSuccess) {
  // Primero, valida si el usuario ya inició sesión previamente
  const authenticated = checkAuth();
  if (authenticated) {
    if (typeof onLoginSuccess === "function") {
      onLoginSuccess();
    }
  }

  const loginForm = document.getElementById("login-form");
  const usernameInput = document.getElementById("login-username");
  const passwordInput = document.getElementById("login-password");
  const rememberCheckbox = document.getElementById("login-remember");
  const errorMsg = document.getElementById("login-error-msg");
  
  const submitBtn = document.getElementById("btn-login-submit");
  const btnText = submitBtn?.querySelector(".btn-text");
  const spinner = document.getElementById("login-btn-spinner");
  
  const togglePassBtn = document.getElementById("btn-toggle-password");
  const iconEye = document.getElementById("icon-eye");
  const iconEyeOff = document.getElementById("icon-eye-off");

  const captchaImg = document.getElementById("login-captcha-img");
  const captchaInput = document.getElementById("login-captcha");
  const captchaHelp = document.getElementById("login-captcha-help");
  const refreshCaptchaBtn = document.getElementById("btn-refresh-captcha");
  const captchaHelpDefault = captchaHelp ? captchaHelp.textContent : "";

  /**
   * Pide un CAPTCHA nuevo al servidor e invalida el anterior.
   * También limpia el campo para que no se reenvíe un código ya usado.
   * @param {boolean} focusInput - Enfoca el campo después de refrescar.
   */
  function refreshCaptcha(focusInput = false) {
    if (captchaInput) captchaInput.value = "";

    if (captchaImg) {
      captchaImg.classList.add("is-loading");
      captchaImg.src = "api/captcha.php?t=" + Date.now();
    }

    if (refreshCaptchaBtn) {
      refreshCaptchaBtn.classList.add("is-refreshing");
      window.setTimeout(() => refreshCaptchaBtn.classList.remove("is-refreshing"), 460);
    }

    if (focusInput && captchaInput) captchaInput.focus();
  }

  if (captchaImg) {
    captchaImg.addEventListener("load", () => {
      captchaImg.classList.remove("is-loading");
      if (captchaHelp) captchaHelp.textContent = captchaHelpDefault;
    });
    captchaImg.addEventListener("error", () => {
      captchaImg.classList.remove("is-loading");
      if (captchaHelp) {
        captchaHelp.textContent = "No se pudo cargar el código. Pulsa «Cambiar» para intentarlo de nuevo.";
      }
    });
  }

  if (refreshCaptchaBtn) {
    refreshCaptchaBtn.addEventListener("click", () => refreshCaptcha(true));
  }

  // Alterna la visibilidad de la contraseña (mostrar/ocultar)
  if (togglePassBtn && passwordInput) {
    togglePassBtn.addEventListener("click", () => {
      const isPassword = passwordInput.getAttribute("type") === "password";
      passwordInput.setAttribute("type", isPassword ? "text" : "password");
      
      if (isPassword) {
        if (iconEye) iconEye.style.display = "none";
        if (iconEyeOff) iconEyeOff.style.display = "block";
      } else {
        if (iconEye) iconEye.style.display = "block";
        if (iconEyeOff) iconEyeOff.style.display = "none";
      }
    });
  }

  // Gestiona el envío del formulario de acceso
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const username = usernameInput.value.trim();
      const password = passwordInput.value;

      // Oculta mensajes de error previos
      if (errorMsg) errorMsg.style.display = "none";

      // El CAPTCHA se valida antes de enviar para dar un mensaje inmediato.
      if (captchaInput && !captchaInput.value.trim()) {
        if (errorMsg) {
          errorMsg.style.display = "block";
          errorMsg.textContent = "Escribe el código de verificación de la imagen.";
        }
        captchaInput.focus();
        return;
      }

      // Muestra el indicador visual de carga (Spinner)
      if (submitBtn) submitBtn.disabled = true;
      if (btnText) btnText.style.display = "none";
      if (spinner) spinner.style.display = "block";

      // Petición real a la API del endpoint de inicio de sesión
      fetch("api/login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          password,
          captcha: captchaInput ? captchaInput.value.trim() : ""
        })
      })
      .then(async response => {
        let payload = null;
        try {
          payload = await response.json();
        } catch (e) {
          payload = null;
        }

        if (!response.ok || !payload || payload.success !== true) {
          const error = new Error(
            (payload && payload.error) || "No se pudo iniciar sesión. Inténtalo de nuevo."
          );
          error.reason = (payload && payload.reason) || "unknown";
          throw error;
        }

        return payload;
      })
      .then(data => {
        if (data.success) {
          // Ejecuta la animación de acceso exitoso (salida de la pantalla de login)
          const loginOverlay = document.getElementById("login-screen");
          if (loginOverlay) {
            loginOverlay.classList.add("exit-active");
          }

          // Almacena la sesión y datos del usuario (persistencia local o por sesión)
          const storage = rememberCheckbox && rememberCheckbox.checked ? localStorage : sessionStorage;
          storage.setItem("inventy_session", "active");
          storage.setItem("inventy_user", JSON.stringify(data.user));

          // Actualiza la barra lateral con los datos del perfil
          updateSidebarProfile(data.user);

          setTimeout(() => {
            document.body.classList.remove("auth-active");
            setAppInert(false);
            if (loginOverlay) {
              loginOverlay.style.display = "none";
            }

            // Entrada coreografiada del panel principal
            document.body.classList.add("app-entering");
            window.setTimeout(() => document.body.classList.remove("app-entering"), 900);

            // Ejecuta el flujo principal de carga del sistema
            if (typeof onLoginSuccess === "function") {
              onLoginSuccess();
            }
          }, 420); // Duración sincronizada con la animación de salida CSS
        } else {
          throw new Error(data.error || "Error al iniciar sesión");
        }
      })
      .catch(error => {
        // Habilita nuevamente el formulario para permitir un nuevo intento
        if (submitBtn) submitBtn.disabled = false;
        if (btnText) btnText.style.display = "block";
        if (spinner) spinner.style.display = "none";

        const isNetworkError = error instanceof TypeError;
        const message = isNetworkError
          ? "No se pudo conectar con el servidor. Inténtalo de nuevo."
          : (error && error.message) || "No se pudo iniciar sesión. Inténtalo de nuevo.";

        // Muestra el mensaje de error con animación de sacudida
        if (errorMsg) {
          errorMsg.style.display = "block";
          errorMsg.textContent = message;
          // Reinicia la animación de sacudida
          errorMsg.style.animation = 'none';
          errorMsg.offsetHeight; /* Fuerza el redibujado del navegador */
          errorMsg.style.animation = null;
        }

        // El código es de un solo uso: se renueva después de cualquier fallo.
        refreshCaptcha();

        if (error && (error.reason === "credentials" || error.reason === "fields")) {
          if (passwordInput) {
            passwordInput.value = "";
            passwordInput.focus();
          }
        } else if (captchaInput) {
          captchaInput.focus();
        } else if (passwordInput) {
          passwordInput.focus();
        }
      });
    });
  }

  // Maneja la acción de cerrar sesión
  document.addEventListener("click", (e) => {
    const logoutBtn = e.target.closest("#btn-logout");
    if (logoutBtn) {
      e.preventDefault();
      
      // Cuadro de diálogo elegante de confirmación con SweetAlert2
      if (window.Swal) {
        window.Swal.fire({
          title: '¿Cerrar sesión?',
          text: 'Tendrás que ingresar tus credenciales nuevamente para acceder al panel.',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Sí, salir',
          cancelButtonText: 'Cancelar',
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
        }).then((result) => {
          if (result.isConfirmed) {
            executeLogout();
          }
        });
      } else {
        // Enlace alternativo con confirmación nativa si SweetAlert2 no carga
        if (confirm("¿Está seguro de que desea cerrar sesión?")) {
          executeLogout();
        }
      }
    }
  });

  function executeLogout() {
    localStorage.removeItem("inventy_session");
    sessionStorage.removeItem("inventy_session");
    localStorage.removeItem("inventy_user");
    sessionStorage.removeItem("inventy_user");
    
    // Limpia los campos del formulario dinámicamente
    const uInput = document.getElementById("login-username");
    const pInput = document.getElementById("login-password");
    const rCheck = document.getElementById("login-remember");
    const eMsg = document.getElementById("login-error-msg");
    
    const sBtn = document.getElementById("btn-login-submit");
    const bTxt = sBtn?.querySelector(".btn-text");
    const spn = document.getElementById("login-btn-spinner");
    
    if (uInput) uInput.value = "";
    if (pInput) pInput.value = "";
    if (rCheck) rCheck.checked = false;
    if (eMsg) eMsg.style.display = "none";

    // El CAPTCHA anterior pudo caducar mientras la sesión estaba abierta.
    refreshCaptcha();
    
    if (sBtn) sBtn.disabled = false;
    if (bTxt) bTxt.style.display = "block";
    if (spn) spn.style.display = "none";
    
    // Redirige y despliega la pantalla de acceso
    checkAuth();
  }
}
