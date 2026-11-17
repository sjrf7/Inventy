# Pruebas E2E de Inventy

Suite de [Playwright](https://playwright.dev/) sobre Chromium que recorre la app
real (frontend estático + API PHP). Está escrita con el runner incluido en Node
(`node:test`), así que no necesita Jest ni ningún framework adicional.

## Requisitos

- Node.js 20 o superior.
- PHP para servir la app (`php -S`).
- MySQL con la base de datos de Inventy ya sembrada.

## Preparación

```bash
npm install
npx playwright install chromium
```

## Ejecución

En una terminal, levanta el servidor con el CAPTCHA desactivado para que la
suite pueda iniciar sesión automáticamente:

```bash
npm run serve:test
```

En otra, ejecuta la suite:

```bash
npm run test:e2e          # Chromium sin ventana
npm run test:e2e:headed   # Chromium visible (INVENTY_HEADED=1)
```

> En Windows, `npm run serve:test` puede no interpretar la variable de entorno.
> En ese caso ejecuta en PowerShell:
> `$env:INVENTY_CAPTCHA_DISABLED="1"; php -S 0.0.0.0:8000`
>
> Para probar el login con el CAPTCHA real usa `npm run serve` y escribe el
> código que muestra la imagen.

## Variables de entorno

| Variable                   | Valor por defecto       | Descripción                                      |
| -------------------------- | ----------------------- | ------------------------------------------------ |
| `INVENTY_BASE_URL`         | `http://localhost:8000` | URL base donde se sirve la app.                  |
| `INVENTY_USER`             | `admin`                 | Usuario de prueba.                               |
| `INVENTY_PASS`             | `admin`                 | Contraseña de prueba.                            |
| `INVENTY_HEADED`           | (sin definir)           | `1` muestra el navegador.                        |
| `INVENTY_CAPTCHA_DISABLED` | (sin definir)           | `1` desactiva la validación del CAPTCHA (tests). |

Ejemplo:

```bash
INVENTY_BASE_URL=http://192.168.0.200:8000 npm run test:e2e
```

## Qué cubre

- Login correcto e incorrecto, mensaje de error y `inert` del panel.
- CAPTCHA visible, imagen válida y renovación del código.
- Layout sin desbordamiento y navegación por hash, enlaces profundos y atrás.
- Inventario: búsqueda, filtros por estado y orden.
- Ficha del bien: pestañas ARIA, teclado, trampa de foco y retorno del foco.
- Reportes: tarjetas con `aria-pressed`, selectores y tabla generada.
- Impresión: solo el informe, ocultando la interfaz y con tinta oscura.
- Tema claro/oscuro, `aria-pressed` y `theme-color`.
- Soporte y traspasos: formularios y combobox accesibles.
- Calendario: 12 meses, día seleccionado, filtros, teclado y CRUD de un
  mantenimiento temporal (crear, completar y eliminar).
- Formulario de bienes: cierre directo sin cambios, confirmación al descartar
  (botón, Escape y clic en el fondo).
- Confirmación al desincorporar desde la ficha y desde soporte.
- Responsive a 1280, 1024, 768 y 390 px, menú móvil y objetivos táctiles de
  44 px con `hasTouch`.
- Errores de JavaScript y de consola.

## Datos

Las pruebas no guardan cambios de forma permanente: abren formularios, cancelan
las confirmaciones y descartan los borradores. El caso del calendario crea un
evento temporal y lo elimina al terminar; si una aserción falla antes, la
limpieza defensiva lo borra por API. Aun así, conviene ejecutar la suite contra
una copia local de la base de datos.

## Estructura

```
tests/e2e/
├── helpers.js        # Navegador, login, diálogos y utilidades
├── inventy.test.js   # Casos de prueba
└── README.md
```

Los nombres de archivo `*.test.js` son obligatorios para que `node --test` los
descubra automáticamente.
