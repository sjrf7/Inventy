/**
 * Pruebas E2E de Inventy (Playwright + node:test).
 *
 * Requisitos:
 *   npm install
 *   npx playwright install chromium
 *   npm run serve   # en otra terminal
 *   npm run test:e2e
 *
 * Las pruebas solo inician sesión, navegan y abren formularios; no guardan
 * cambios en la base de datos.
 */

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const {
  BASE_URL,
  PASSWORD,
  launchBrowser,
  assertServerUp,
  newPage,
  login,
  gotoView,
  answerConfirm,
  expectNoConfirm,
  isModalOpen
} = require('./helpers');

let browser;
let context;
let page;

before(async () => {
  await assertServerUp();
  browser = await launchBrowser();
  context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'es-ES' });
  page = await newPage(context);
});

after(async () => {
  if (browser) await browser.close();
});

/* -------------------------------------------------------------------------- */
/* Autenticación                                                              */
/* -------------------------------------------------------------------------- */

test('La pantalla de login bloquea el panel con inert', async () => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  assert.equal(await page.locator('#login-screen').isVisible(), true);
  assert.notEqual(await page.locator('.app-container').getAttribute('inert'), null);
});

test('Rechaza credenciales incorrectas con un mensaje claro', async () => {
  await page.fill('#login-username', 'admin');
  await page.fill('#login-password', 'clave-incorrecta');
  await page.click('#btn-login-submit');
  await page.waitForTimeout(900);

  const message = ((await page.locator('#login-error-msg').textContent()) || '').trim();
  assert.equal(await page.locator('#login-error-msg').isVisible(), true);
  assert.match(message, /incorrect/i);
  assert.equal(await page.locator('#login-screen').isVisible(), true);
});

test('Inicia sesión con credenciales válidas y libera el panel', async () => {
  await login(page, { password: PASSWORD });

  assert.equal(
    await page.locator('#view-dashboard').evaluate((el) => el.classList.contains('active')),
    true
  );
  assert.equal(await page.locator('.app-container').getAttribute('inert'), null);
  assert.equal(await page.locator('#login-screen').isVisible(), false);
});

/* -------------------------------------------------------------------------- */
/* Layout y navegación                                                        */
/* -------------------------------------------------------------------------- */

test('El layout no desborda y el contenido queda tras la barra lateral', async () => {
  const layout = await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar').getBoundingClientRect();
    const main = document.querySelector('.main-content').getBoundingClientRect();
    const title = document.querySelector('.page-title').getBoundingClientRect();
    return {
      sidebarWidth: sidebar.width,
      mainX: main.x,
      titleX: title.x,
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth
    };
  });

  assert.ok(layout.scrollWidth <= layout.innerWidth + 1, `desbordamiento: ${JSON.stringify(layout)}`);
  assert.ok(Math.abs(layout.mainX - layout.sidebarWidth) <= 1, `mainX=${layout.mainX}, sidebar=${layout.sidebarWidth}`);
  assert.ok(layout.titleX > layout.mainX, `titleX=${layout.titleX}`);
});

test('La navegación actualiza la URL y marca el enlace activo', async () => {
  await page.click('a[href="#inventario"]');
  await page.waitForTimeout(400);

  assert.ok(page.url().endsWith('#inventario'), page.url());
  assert.equal(
    await page.locator('#view-inventory').evaluate((el) => el.classList.contains('active')),
    true
  );
  assert.equal(await page.locator('.nav-item.active a').getAttribute('aria-current'), 'page');
});

test('Los enlaces profundos y el botón atrás restauran la vista', async () => {
  await page.goto(`${BASE_URL}#reportes`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  assert.equal(
    await page.locator('#view-reports').evaluate((el) => el.classList.contains('active')),
    true
  );

  await page.goBack();
  await page.waitForTimeout(600);
  assert.notEqual(
    await page.locator('#view-reports').evaluate((el) => el.classList.contains('active')),
    true
  );
});

/* -------------------------------------------------------------------------- */
/* Inventario                                                                 */
/* -------------------------------------------------------------------------- */

test('El inventario busca, filtra y ordena sin modificar datos', async () => {
  await gotoView(page, 'inventario');

  const total = await page.locator('.asset-card').count();
  assert.ok(total > 0, 'no se renderizaron tarjetas');

  const firstName = ((await page.locator('.asset-card-name').first().textContent()) || '').trim();
  await page.fill('#global-search', firstName.slice(0, 8));
  await page.waitForTimeout(500);
  const filtered = await page.locator('.asset-card').count();
  assert.ok(filtered > 0 && filtered < total, `${filtered} de ${total}`);
  assert.equal(await page.locator('#inventory-counter').getAttribute('aria-live'), 'polite');

  await page.fill('#global-search', '');
  await page.waitForTimeout(400);

  await page.selectOption('#filter-status', 'activo');
  await page.waitForTimeout(350);
  const badges = await page
    .locator('.asset-card .asset-badge')
    .evaluateAll((els) => els.map((el) => el.textContent.trim()));
  assert.ok(badges.length > 0, 'el filtro no devolvió resultados');
  assert.ok(
    badges.every((label) => /activo/i.test(label)),
    `estados inesperados: ${badges.join(', ')}`
  );
  await page.selectOption('#filter-status', '');
  await page.waitForTimeout(300);

  const before = ((await page.locator('.asset-card-name').first().textContent()) || '').trim();
  await page.selectOption('#sort-by', 'name-desc');
  await page.waitForTimeout(350);
  const after = ((await page.locator('.asset-card-name').first().textContent()) || '').trim();
  assert.notEqual(before, after, 'el orden Z-A no cambió el primer resultado');
  await page.selectOption('#sort-by', 'name-asc');
  await page.waitForTimeout(300);
});

/* -------------------------------------------------------------------------- */
/* Modal de detalle                                                           */
/* -------------------------------------------------------------------------- */

test('El detalle usa pestañas accesibles, atrapa el foco y devuelve el foco', async () => {
  const trigger = page.locator('.btn-view-detail').first();
  await trigger.focus();
  await trigger.click();
  await page.waitForSelector('#modal-asset-detail.active');

  assert.equal(await page.locator('#tab-btn-history').getAttribute('aria-selected'), 'true');
  assert.equal(await page.locator('.detail-tabs').getAttribute('role'), 'tablist');

  await page.click('#tab-btn-support-reports');
  await page.waitForTimeout(250);
  assert.equal(await page.locator('#tab-btn-support-reports').getAttribute('aria-selected'), 'true');
  assert.equal(
    await page.locator('#tab-support-reports').evaluate((el) => el.classList.contains('active')),
    true
  );

  await page.locator('#tab-btn-support-reports').focus();
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(250);
  assert.equal(await page.locator('#tab-btn-history').getAttribute('aria-selected'), 'true');
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'tab-btn-history');

  for (let i = 0; i < 14; i++) await page.keyboard.press('Tab');
  assert.equal(
    await page.evaluate(() => document.getElementById('modal-asset-detail').contains(document.activeElement)),
    true,
    'el foco escapó del modal'
  );

  await page.keyboard.press('Escape');
  await page.waitForTimeout(450);
  assert.equal(await isModalOpen(page, '#modal-asset-detail'), false);
  assert.equal(
    await page.evaluate(() => document.activeElement?.classList.contains('btn-view-detail')),
    true,
    'el foco no volvió al disparador'
  );
});

/* -------------------------------------------------------------------------- */
/* Reportes                                                                   */
/* -------------------------------------------------------------------------- */

test('Los reportes se seleccionan con aria-pressed y generan tabla', async () => {
  await gotoView(page, 'reportes');

  const cards = page.locator('.report-option-card');
  assert.equal(await cards.count(), 4);
  assert.equal(await cards.first().evaluate((el) => el.tagName), 'BUTTON');
  assert.equal(await page.locator('.report-option-card[aria-pressed="true"]').count(), 1);

  await page.click('.report-option-card[data-value="direccion"]');
  await page.waitForTimeout(400);
  assert.equal(
    await page.locator('.report-option-card[data-value="direccion"]').getAttribute('aria-pressed'),
    'true'
  );
  assert.equal(await page.locator('#report-param-dept-wrapper').isVisible(), true);
  assert.ok((await page.locator('#report-param-dept option').count()) > 1);
  assert.ok((await page.locator('#printable-report-area table').count()) > 0);

  await page.click('.report-option-card[data-value="estado"]');
  await page.waitForTimeout(350);
  assert.equal(await page.locator('#report-param-status-wrapper').isVisible(), true);
});

test('La impresión oculta la interfaz y conserva el informe en tinta oscura', async () => {
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(250);

  const print = await page.evaluate(() => {
    const style = (selector) => getComputedStyle(document.querySelector(selector));
    return {
      sidebar: style('.sidebar').display,
      header: style('.top-header').display,
      cards: style('.report-cards-grid').display,
      selector: style('.reports-selector-card').display,
      reports: style('#view-reports').display,
      inventory: style('#view-inventory').display,
      titleColor: style('.report-main-title').color
    };
  });

  assert.equal(print.sidebar, 'none');
  assert.equal(print.header, 'none');
  assert.equal(print.cards, 'none');
  assert.equal(print.selector, 'none');
  assert.equal(print.reports, 'block');
  assert.equal(print.inventory, 'none');
  assert.equal(print.titleColor, 'rgb(17, 17, 17)');

  await page.emulateMedia({ media: 'screen' });
});

/* -------------------------------------------------------------------------- */
/* Tema                                                                       */
/* -------------------------------------------------------------------------- */

test('El tema claro se aplica y sincroniza ARIA y theme-color', async () => {
  await page.click('#theme-toggle');
  await page.waitForTimeout(800);

  const theme = await page.evaluate(() => ({
    theme: document.documentElement.getAttribute('data-theme'),
    color: document.querySelector('meta[name="theme-color"]').getAttribute('content')
  }));
  assert.equal(theme.theme, 'light');
  assert.equal(theme.color, '#F6F8FB');
  assert.equal(await page.locator('#theme-toggle').getAttribute('aria-pressed'), 'true');

  await page.click('#theme-toggle');
  await page.waitForTimeout(800);
  assert.equal(await page.evaluate(() => document.documentElement.getAttribute('data-theme')), 'dark');
});

/* -------------------------------------------------------------------------- */
/* Soporte y traspasos                                                        */
/* -------------------------------------------------------------------------- */

test('El formulario de soporte y los combobox son accesibles', async () => {
  await gotoView(page, 'soporte');

  assert.ok((await page.locator('#support-report-form label').count()) >= 5);
  assert.ok((await page.locator('#support-asset-id option').count()) > 1);
  assert.equal(
    await page.locator('#support-asset-id').evaluate((el) => {
      const input = el.parentElement?.querySelector('.searchable-select-input');
      return Boolean(input?.getAttribute('aria-label'));
    }),
    true
  );

  await gotoView(page, 'traspasos');
  const combo = page.locator('#transfer-asset-id').locator('xpath=..').locator('.searchable-select-input');
  await combo.click();
  await page.waitForTimeout(250);
  await combo.fill('iMac');
  await page.waitForTimeout(300);
  const matches = await page
    .locator('#searchable-select-list-transfer-asset-id .searchable-select-item:visible')
    .count();
  assert.ok(matches > 0, 'el combobox no filtró resultados');
  await page.keyboard.press('Escape');
});

/* -------------------------------------------------------------------------- */
/* Formulario de bienes: cierre y descarte                                    */
/* -------------------------------------------------------------------------- */

test('El formulario sin cambios se cierra sin preguntar', async () => {
  await page.click('#btn-quick-add');
  await page.waitForSelector('#modal-asset-form.active');

  assert.equal(await page.locator('#image-upload-area').evaluate((el) => el.tagName), 'BUTTON');
  assert.ok(await page.locator('#image-upload-area').getAttribute('aria-labelledby'));
  assert.equal(
    await page
      .locator('#asset-upsert-form input:not([type="file"]), #asset-upsert-form select, #asset-upsert-form textarea')
      .evaluateAll((els) => els.every((el) => Boolean(el.name))),
    true
  );

  await page.click('#btn-cancel-form');
  const dialog = await expectNoConfirm(page);
  assert.equal(dialog.visible, false);
  assert.equal(await isModalOpen(page, '#modal-asset-form'), false);
});

test('Cerrar con cambios pide confirmación y permite seguir editando', async () => {
  await page.click('#btn-quick-add');
  await page.waitForSelector('#modal-asset-form.active');
  await page.fill('#form-name', 'Equipo de prueba E2E');

  await page.click('#btn-cancel-form');
  const prompt = await answerConfirm(page, { accept: false });
  assert.match(prompt.title || prompt.message || '', /Descartar cambios/i);
  assert.equal(await isModalOpen(page, '#modal-asset-form'), true);
  assert.equal(await page.inputValue('#form-name'), 'Equipo de prueba E2E');

  await page.click('#btn-cancel-form');
  await answerConfirm(page, { accept: true });
  assert.equal(await isModalOpen(page, '#modal-asset-form'), false);
});

test('Escape y el clic en el fondo también respetan los cambios', async () => {
  await page.click('#btn-quick-add');
  await page.waitForSelector('#modal-asset-form.active');
  await page.fill('#form-nro-bien', 'BIEN-E2E-001');

  await page.keyboard.press('Escape');
  const escapePrompt = await answerConfirm(page, { accept: false });
  assert.match(escapePrompt.title || escapePrompt.message || '', /Descartar cambios/i);
  assert.equal(await isModalOpen(page, '#modal-asset-form'), true);

  await page.locator('#modal-asset-form').click({ position: { x: 4, y: 4 } });
  const backdropPrompt = await answerConfirm(page, { accept: true });
  assert.match(backdropPrompt.title || backdropPrompt.message || '', /Descartar cambios/i);
  assert.equal(await isModalOpen(page, '#modal-asset-form'), false);
});

/* -------------------------------------------------------------------------- */
/* Desincorporación                                                           */
/* -------------------------------------------------------------------------- */

test('Desincorporar desde la ficha pide confirmación y no guarda si se cancela', async () => {
  await gotoView(page, 'inventario');
  await page.locator('.btn-view-detail').first().click();
  await page.waitForSelector('#modal-asset-detail.active');

  await page.click('#btn-edit-asset');
  await page.waitForSelector('#modal-asset-form.active');
  await page.waitForTimeout(250);
  assert.ok((await page.inputValue('#form-asset-id')) !== '', 'el formulario no está en modo edición');

  await page.selectOption('#form-status', 'desincorporado');
  const writes = [];
  const trackWrites = (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method()) && /\/api\//.test(request.url())) {
      writes.push(`${request.method()} ${request.url()}`);
    }
  };
  page.on('request', trackWrites);

  await page.click('#btn-save-form');
  const prompt = await answerConfirm(page, { accept: false });
  page.off('request', trackWrites);

  assert.match(prompt.title || prompt.message || '', /Desincorporar/i);
  assert.equal(await isModalOpen(page, '#modal-asset-form'), true);
  assert.deepEqual(writes, [], `se enviaron escrituras: ${writes.join(', ')}`);

  await page.click('#btn-cancel-form');
  await answerConfirm(page, { accept: true });
  assert.equal(await isModalOpen(page, '#modal-asset-form'), false);
});

test('Desincorporar desde soporte pide confirmación y no guarda si se cancela', async () => {
  await gotoView(page, 'soporte');

  const assetId = await page.evaluate(() => {
    const select = document.getElementById('support-asset-id');
    const option = Array.from(select.options).find((opt) => opt.value);
    select.value = option.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return option.value;
  });
  await page.waitForTimeout(250);

  await page.selectOption('#support-status-after', 'desincorporado');
  await page.fill('#support-diagnosis', 'Diagnóstico de prueba E2E');
  await page.fill('#support-action', 'Acción de prueba E2E');

  const writes = [];
  const trackWrites = (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method()) && /\/api\//.test(request.url())) {
      writes.push(`${request.method()} ${request.url()}`);
    }
  };
  page.on('request', trackWrites);

  await page.locator('#support-report-form button[type="submit"]').click();
  const prompt = await answerConfirm(page, { accept: false });
  page.off('request', trackWrites);

  assert.ok(assetId);
  assert.match(prompt.title || prompt.message || '', /Desincorporar/i);
  assert.deepEqual(writes, [], `se enviaron escrituras: ${writes.join(', ')}`);
  assert.equal(await page.inputValue('#support-diagnosis'), 'Diagnóstico de prueba E2E');
});

/* -------------------------------------------------------------------------- */
/* Responsive                                                                 */
/* -------------------------------------------------------------------------- */

test('No hay desbordamiento horizontal en anchos habituales', async () => {
  for (const width of [1280, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const view of ['dashboard', 'inventario', 'reportes']) {
      await gotoView(page, view);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth
      );
      assert.ok(overflow <= 1, `${width}px / ${view}: exceso de ${overflow}px`);
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
});

test('El menú móvil expone y actualiza aria-expanded', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoView(page, 'dashboard');

  const toggle = page.locator('#mobile-menu-toggle');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  await toggle.click();
  await page.waitForTimeout(300);
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(
    await page.locator('#app-sidebar').evaluate((el) => el.classList.contains('active')),
    true
  );

  await page.click('a[href="#inventario"]');
  await page.waitForTimeout(400);
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(
    await page.locator('#app-sidebar').evaluate((el) => el.classList.contains('active')),
    false
  );
});

test('Los objetivos táctiles alcanzan 44 px en pantallas táctiles', async () => {
  const touchContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    locale: 'es-ES'
  });
  const touchPage = await newPage(touchContext);

  try {
    await login(touchPage);

    const measure = async (selectors) =>
      touchPage.evaluate((group) => {
        const seen = new Set();
        const items = [];
        for (const selector of group) {
          for (const el of document.querySelectorAll(selector)) {
            if (seen.has(el)) continue;
            seen.add(el);
            // Los modales cerrados siguen ocupando layout (visibility: hidden),
            // así que hay que comprobar la visibilidad real del elemento.
            if (!el.checkVisibility({ visibilityProperty: true })) continue;
            const rect = el.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) continue;
            const label =
              el.id || (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 32) || el.tagName.toLowerCase();
            items.push({ label, w: Math.round(rect.width), h: Math.round(rect.height) });
          }
        }
        return items;
      }, selectors);

    const selectors = [
      'button',
      '.nav-item a',
      'input:not([type="checkbox"]):not([type="file"]):not([type="radio"])',
      'select',
      'textarea',
      '.searchable-select-item'
    ];

    const views = ['dashboard', 'inventario', 'soporte', 'traspasos', 'reportes'];
    const small = [];
    for (const view of views) {
      await gotoView(touchPage, view);
      small.push(...(await measure(selectors)).filter((item) => item.h < 44));
    }

    // La ficha y sus pestañas también deben ser cómodas al tacto.
    await gotoView(touchPage, 'inventario');
    await touchPage.locator('.btn-view-detail').first().click();
    await touchPage.waitForSelector('#modal-asset-detail.active');
    await touchPage.waitForTimeout(400);
    small.push(...(await measure(selectors)).filter((item) => item.h < 44));

    assert.deepEqual(
      small,
      [],
      `objetivos menores de 44 px: ${small.map((item) => `${item.label} (${item.w}×${item.h})`).join(', ')}`
    );

    const iconButtons = await measure(['.theme-toggle-btn', '.mobile-menu-btn', '.btn-logout', '.modal-close-btn']);
    const narrowIcons = iconButtons.filter((item) => item.w < 44);
    assert.deepEqual(
      narrowIcons,
      [],
      `botones icónicos menores de 44 px: ${narrowIcons.map((item) => `${item.label} (${item.w}×${item.h})`).join(', ')}`
    );
  } finally {
    await touchContext.close();
  }
});

/* -------------------------------------------------------------------------- */
/* Consola                                                                    */
/* -------------------------------------------------------------------------- */

test('No hay errores de JavaScript ni de consola', async () => {
  assert.deepEqual(page.__errors, []);
});
