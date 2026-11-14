# PROPUESTA DE PROYECTO UNIVERSITARIO

# Sistema de Control de Bienes Informáticos y Soporte para la Contraloría del Municipio Angostura del Orinoco

## 1. Introducción

El área de Informática de la **Contraloría Municipal del Municipio Angostura del
Orinoco** es responsable del cuidamiento de todos los bienes tecnológicos de la
institución: computadoras, impresoras, equipos de red, servidores y otros
dispositivos. Además, atiende los pedidos de soporte técnico de todas las áreas.

Hoy estos procesos se llevan en hojas de cálculo, notas y pedidos en papel, lo que
genera pérdida de información, demoras y falta de control.

El sistema permitirá:
1. **Registrar los bienes informáticos** de la Contraloría.
2. **Organizar el cronograma de soportes** y mantenimientos.
3. **Automatizar formularios y documentos** (solicitudes de soporte, de bienes, etc.).


## 2. Problema

El área de Informática de la Contraloría enfrenta estos problemas:

1. No existe un registro confiable de los bienes informáticos ni de en qué
   área o dirección se encuentran.
2. Los pedidos de soporte se reciben por distintos medios (notas, llamadas, mensajes)
   y no queda constancia de cuáles se atendieron.
3. No existe un calendario de mantenimientos preventivos; los equipos se reparan
   solo cuando fallan.
4. Los formularios y trámites (solicitud de soporte, solicitud de bien, traspaso)
   se llenan en papel y se pierden.


## 3. Módulos del sistema

- **Inicio de sesión:** acceso seguro con usuario y contraseña.
- **Panel de Inicio:** gráficos con total de bienes, activos, en reparación y dados de baja.
- **Inventario:** registro, búsqueda y ficha de cada bien informático.
- **Traspasos:** movimiento de bienes entre áreas o direcciones.
- **Soporte técnico:** informes de diagnóstico y reparación de equipos.
- **Cronograma de soportes:** calendario de mantenimientos preventivos y correctivos.
- **Estadísticas de soporte:** total de mantenimientos realizados, por técnico y por período.
- **Formularios y trámites:** solicitudes en línea de soporte, adquisición de bienes y traspaso.
- **Importar / Exportar:** carga masiva de bienes desde Excel y exportación del inventario para respaldo.
- **Reportes:** informes oficiales listos para imprimir.

## 4. Arquitectura del sistema

El sistema funciona en tres partes:

1. **Navegador (frontend):** interfaz web con HTML, CSS y JavaScript.
2. **Servidor (backend):** programa en PHP que atiende las peticiones.
3. **Base de datos:** almacena la información en MySQL (entorno XAMPP).

## 5. Diseño de la base de datos

### 5.1 Tablas del sistema (11 tablas)

Los nombres de las tablas están en español y sin acentos por compatibilidad con MySQL.

1. `departamentos` — Áreas y direcciones de la Contraloría donde se ubican los bienes.
2. `categorias` — Tipos de bienes informáticos (cómputo, red, impresión, etc.).
3. `usuarios` — Usuarios del sistema con su contraseña encriptada y su rol.
4. `bienes` — Los bienes informáticos: nombre, número de bien, marca, modelo, estado.
5. `traspasos` — Traspasos de bienes de un área a otra.
6. `historial_bienes` — Historial de todo lo que le ha pasado a cada bien.
7. `informes_soporte` — Informes técnicos de diagnóstico y reparación.
8. `cronograma_soportes` — Cronograma de soportes y mantenimientos del área.
9. `solicitudes` — Formularios y trámites automatizados (soporte, bienes, traspaso).
10. `desincorporaciones` — Actas oficiales de baja de bienes.
11. `bitacora_auditoria` — Registro de accesos y acciones de cada usuario.

