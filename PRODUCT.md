# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Personal administrativo, de inventario y de soporte técnico de una institución pública. Trabajan desde equipos de escritorio en oficinas, con consultas puntuales desde el móvil, y necesitan ubicar un bien, conocer su estado y revisar su historial sin ambigüedad.

## Product Purpose

Inventy centraliza el registro, la asignación y el seguimiento de los bienes nacionales de la institución. El éxito significa que cualquier responsable pueda responder con rapidez dónde está un bien, en qué estado se encuentra y qué ocurrió con él.

## Positioning

Una fuente única de verdad para el patrimonio institucional: cada bien reúne su ubicación, estado, especificaciones, traspasos y reportes de soporte en una misma ficha trazable.

## Operating Context

- Interfaz en español para una institución pública.
- Estados operativos: activo, en reparación, espera de repuesto y desincorporado.
- Flujos principales: consulta del inventario, registro de bienes, traspasos entre direcciones, soporte técnico y reportes.
- El proyecto existente usa una API PHP y una base de datos MariaDB; la autenticación actual es administrativa.

## Capabilities and Constraints

- Dashboard con métricas, distribución por estado, dirección y tipo, y actividad reciente.
- Inventario consultable con búsqueda, filtros, orden y ficha de detalle.
- Traspasos, soporte técnico y reportes forman parte del alcance del producto.
- La propuesta paralela en `concepto/` es un prototipo navegable con datos de demostración; no está conectada a la API ni sustituye la aplicación actual.

## Brand Commitments

- Nombre: Inventy.
- Marca: cubo isométrico de líneas sobre un cuadrado azul.
- Paleta de marca: azul `#3B82F6` a `#2563EB` sobre superficies oscuras o neutras.
- Tono: sobrio, institucional, preciso; sin lenguaje promocional.

## Evidence on Hand

- Implementación existente en `index.html`, `src/` y `api/`.
- Datos de ejemplo en `seed-data.js` y en la base de datos de desarrollo.
- Prototipo paralelo con datos sintéticos en `concepto/`, rotulado como demostración.

## Product Principles

1. El estado de un bien debe entenderse de un vistazo.
2. La trazabilidad importa tanto como el dato actual.
3. Registrar y actualizar debe tener la menor fricción posible.
4. La interfaz sirve a la tarea; la marca aparece en los detalles, no en el ruido.
5. La información numérica debe ser legible, consistente y comparable.

## Accessibility & Inclusion

- Navegación completa por teclado y foco visible.
- Contraste de texto conforme a WCAG AA.
- Respeto a `prefers-reduced-motion`.
- Controles con nombres accesibles y estados anunciados.
