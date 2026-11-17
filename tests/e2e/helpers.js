/**
 * Utilidades compartidas por las pruebas E2E de Inventy.
 *
 * La app se sirve como archivos estáticos + API PHP, así que las pruebas
 * necesitan un servidor en marcha (por defecto `npm run serve`).
 */

const { chromium } = require('playwright');

const BASE_URL = (process.env.INVENTY_BASE_URL || 'http://localhost:8000/').replace(/\/+$/, '') + '/';
const USERNAME = process.env.INVENTY_USER || 'admin';
const PASSWORD = process.env.INVENTY_PASS || 'admin';

const SWAL = {
  container: '.swal2-container',
  title: '.swal2-title',
  confirm: '.swal2-confirm',
  cancel: '.swal2-cancel'
};

/** Lanza Chromium; `INVENTY_HEADED=1` lo muestra con ventana. */
function launchBrowser() {
  return chromium.launch({
    headless: process.env.INVENTY_HEADED !== '1',
    args: ['--no-sandbox']
  });
}

/** Falla con un mensaje claro si el servidor local no responde. */
async function assertServerUp() {
  let response;
  try {
    response = await fetch(BASE_URL, { signal: AbortSignal.timeout(5000) });
  } catch (error) {
    throw new Error(
      `No se pudo conectar con ${BASE_URL}. ` +
        `Inicia el servidor con "npm run serve" y vuelve a ejecutar las pruebas. (${error.message})`
    );
  }
  if (!response.ok) {
    throw new Error(`${BASE_URL} respondió HTTP ${response.status}.`);
  }
}

/** Crea una página con captura de errores y respuesta automática a diálogos. */
async function newPage(context) {
  const page = await context.newPage();
  const errors = [];

  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    // El 401 de credenciales incorrectas y las fuentes externas no son fallos de la app.
    if (/401 \(Unauthorized\)|fonts\.(googleapis|gstatic)|favicon/i.test(text)) return;
    errors.push(`console: ${text}`);
  });

  page.__errors = errors;
  page.__dialogPolicy = 'dismiss';
  page.__lastDialog = null;

  // Permite probar tanto SweetAlert2 como el fallback nativo de `window.confirm`.
  page.on('dialog', async (dialog) => {
    page.__lastDialog = dialog.message();
    try {
      if (page.__dialogPolicy === 'accept') await dialog.accept();
      else await dialog.dismiss();
    } catch {
      // El diálogo pudo cerrarse solo; no es un fallo de la prueba.
    }
  });

  return page;
}

/** Abre la app y espera a que termine de cargar. */
async function openApp(page, hash = '') {
  await page.goto(BASE_URL + hash, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
}

/** Inicia sesión con las credenciales locales (admin/admin por defecto). */
async function login(page, { username = USERNAME, password = PASSWORD } = {}) {
  await openApp(page);
  await page.fill('#login-username', username);
  await page.fill('#login-password', password);

  // La suite se ejecuta contra un servidor con INVENTY_CAPTCHA_DISABLED=1,
  // por lo que el servidor no valida este valor. Con el CAPTCHA activo no es
  // posible automatizar la lectura de la imagen.
  const captchaInput = page.locator('#login-captcha');
  if (await captchaInput.count()) {
    await captchaInput.fill(process.env.INVENTY_CAPTCHA || 'TEST');
  }

  await page.click('#btn-login-submit');
  try {
    await page.waitForSelector('#login-screen', { state: 'hidden', timeout: 8000 });
  } catch (error) {
    const message = (
      (await page.locator('#login-error-msg').textContent().catch(() => '')) || ''
    ).trim();

    if (/código de verificación/i.test(message)) {
      throw new Error(
        `El servidor exige CAPTCHA y la suite no puede resolverlo. ` +
          `Levántalo con "npm run serve:test". Mensaje del servidor: ${message}`
      );
    }
    throw error;
  }
  await page.waitForTimeout(600);
}

const VIEW_BY_HASH = {
  dashboard: 'dashboard',
  inventario: 'inventory',
  inventory: 'inventory',
  traspasos: 'transfers',
  transfers: 'transfers',
  soporte: 'support',
  support: 'support',
  reportes: 'reports',
  reports: 'reports'
};

/** Navega a una vista por su hash y espera a que esté activa. */
async function gotoView(page, hash) {
  const view = VIEW_BY_HASH[hash];
  if (!view) throw new Error(`Vista desconocida: ${hash}`);
  await page.evaluate((name) => {
    window.location.hash = name;
  }, hash);
  await page.waitForSelector(`#view-${view}.active`, { timeout: 5000 });
  await page.waitForTimeout(350);
}

/**
 * Responde a la confirmación pendiente (SweetAlert2) o al diálogo nativo.
 * Debe llamarse justo después de la acción que abre la confirmación.
 *
 * @param {import('playwright').Page} page
 * @param {{ accept?: boolean, timeout?: number }} options
 * @returns {Promise<{ kind: 'swal'|'native', title: string|null, message: string|null }>}
 */
async function answerConfirm(page, { accept = false, timeout = 5000 } = {}) {
  page.__dialogPolicy = accept ? 'accept' : 'dismiss';
  page.__lastDialog = null;

  const container = page.locator(SWAL.container).first();
  try {
    await container.waitFor({ state: 'visible', timeout });
  } catch {
    // SweetAlert2 no está disponible: el fallback nativo ya se respondió solo.
    await page.waitForTimeout(200);
    return { kind: 'native', title: null, message: page.__lastDialog };
  }

  const title = ((await page.locator(SWAL.title).first().textContent()) || '').trim();
  await page.locator(accept ? SWAL.confirm : SWAL.cancel).first().click();
  await container.waitFor({ state: 'hidden', timeout });
  return { kind: 'swal', title, message: null };
}

/** Comprueba que la última acción no abrió ninguna confirmación. */
async function expectNoConfirm(page, wait = 400) {
  await page.waitForTimeout(wait);
  const visible = await page.locator(SWAL.container).first().isVisible().catch(() => false);
  return { visible, message: page.__lastDialog };
}

/** `true` si el modal indicado está visible. */
async function isModalOpen(page, selector) {
  return page.locator(selector).evaluate((el) => el.classList.contains('active'));
}

module.exports = {
  BASE_URL,
  USERNAME,
  PASSWORD,
  SWAL,
  launchBrowser,
  assertServerUp,
  newPage,
  openApp,
  login,
  gotoView,
  answerConfirm,
  expectNoConfirm,
  isModalOpen
};
