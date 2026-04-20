# Panel de Planificación de Boda — Spec

## Resumen

Nueva sección del panel de administración (`/admin/planificacion`) con dashboard resumen, tablero Kanban para tareas, y sistema de presupuesto con tracking de pagos. Independiente del AdminOculto existente.

## Arquitectura General

Nueva ruta `/admin/planificacion` protegida con la misma autenticación de sesión que AdminOculto. Tres vistas internas mediante tabs:

1. **Dashboard** (vista por defecto) — métricas clave
2. **Tareas** — tablero Kanban
3. **Presupuesto** — categorías de gasto con pagos

## Dashboard Resumen

Cards superiores mostrando:

- **Tareas pendientes**: conteo de tareas en columnas "Por hacer" + "En progreso"
- **Presupuesto total estimado**: suma de costes estimados de todas las categorías
- **Total pagado**: suma de cantidades pagadas
- **Pendiente de pago**: estimado - pagado

La card "Coste cubiertos" no se muestra por separado — ya está incluida en el total estimado via la categoría con `esCubierto=true`.

## Kanban — Tab Tareas

### Columnas

Tres columnas fijas, no editables:

1. `Por hacer`
2. `En progreso`
3. `Hecho`

### Tarjetas

Cada tarea contiene:

- `id`: string (nanoid, 10 caracteres)
- `titulo`: string (requerido, max 100 caracteres)
- `descripcion`: string (opcional, max 300 caracteres)
- `responsable`: string (campo libre, max 50 caracteres, con sugerencias de responsables previos)
- `columna`: 'todo' | 'in_progress' | 'done'
- `orden`: number (posición dentro de la columna, base 0, recalculado tras cada drag)
- `fechaCreacion`: string ISO
- `fechaActualizacion`: string ISO

### Interacciones

- Drag & drop entre columnas y dentro de columnas para reordenar (librería: `@dnd-kit/core` + `@dnd-kit/sortable`)
- Botón "+" en cada columna para añadir tarea rápida
- Click en tarjeta para editar (modal)
- Botón eliminar en cada tarjeta (con confirmación)
- Los responsables se crean sobre la marcha: campo de texto libre que sugiere nombres ya usados previamente
- En caso de fallo al guardar: toast de error, la UI revierte al estado anterior (optimistic update con rollback)

### Estados vacíos

- Columna sin tareas: texto sutil "Sin tareas" centrado
- Sin ninguna tarea creada: EmptyState con icono, título "No hay tareas", y CTA "Crear primera tarea"

## Presupuesto — Tab Presupuesto

### Categorías

Cada categoría de gasto contiene:

- `id`: string (nanoid, 10 caracteres)
- `nombre`: string (requerido, max 80 caracteres)
- `costeEstimado`: number (en euros, >= 0, admite decimales con 2 posiciones)
- `estadoPago`: 'sin_pagar' | 'senal_pagada' | 'pagado_completo' (transiciones libres en cualquier dirección — es un campo manual que el usuario controla)
- `cantidadPagada`: number (en euros, >= 0, no puede exceder costeEstimado)
- `fechaUltimoPago`: string ISO | null
- `notas`: string (opcional, max 500 caracteres)
- `esCubierto`: boolean (flag para categoría especial)
- `precioPorCubierto`: number | null (solo cuando esCubierto=true, >= 0)
- `orden`: number (base 0)

### Categoría especial "Cubierto"

Cuando `esCubierto=true`:

- Se muestra campo `precioPorCubierto` en lugar de `costeEstimado`
- El `costeEstimado` se calcula automáticamente: `precioPorCubierto × asistentesConfirmados`
- El conteo de asistentes confirmados se obtiene del endpoint existente de invitados
- Solo puede haber una categoría con `esCubierto=true` (validado en UI y API)
- Si se elimina esta categoría, simplemente desaparece de los totales
- Si hay 0 confirmados, el coste estimado muestra 0€ (comportamiento esperado)

### Vista

- Tabla/lista con todas las categorías
- Cada fila muestra: nombre, estimado, pagado, estado (badge de color), fecha último pago
- Fila de totales al final: total estimado, total pagado, total pendiente
- Barra de progreso visual del presupuesto (pagado vs total)
- Botones: añadir categoría, editar, eliminar (con confirmación)
- Estado vacío: EmptyState con "No hay categorías de presupuesto" y CTA "Añadir categoría"

### Estados de pago — colores

- `sin_pagar`: rojo/gris
- `senal_pagada`: amarillo/naranja
- `pagado_completo`: verde

### Validación

- `cantidadPagada` no puede ser mayor que `costeEstimado`
- `costeEstimado` y `cantidadPagada` deben ser >= 0
- `nombre` es requerido y único entre categorías
- Validación con Zod tanto en frontend como en API

## API

### Endpoint: `api/planificacion.ts`

Sigue el mismo patrón que `api/admin.ts`: query param `?action=XXX`, método POST para escritura, GET para lectura. Requiere sesión de admin válida (misma lógica que admin.ts).

**CORS**: Reutiliza la misma configuración CORS que `api/admin.ts`.

#### Actions

| Action | Method | Request Body | Response |
|--------|--------|-------------|----------|
| `get-tareas` | GET | — | `{ tareas: Tarea[] }` |
| `save-tareas` | POST | `{ tareas: Tarea[] }` | `{ ok: true }` |
| `get-presupuesto` | GET | — | `{ categorias: CategoriaPresupuesto[] }` |
| `save-presupuesto` | POST | `{ categorias: CategoriaPresupuesto[] }` | `{ ok: true }` |

**Estrategia de persistencia**: replace-all (se guarda el array completo cada vez). Es el mismo patrón que el proyecto ya usa para invitados en modo legacy. Se acepta el riesgo teórico de race conditions dado que es un panel usado por 1-2 personas simultáneamente como máximo.

### Almacenamiento Redis

- `planificacion:tareas` — array JSON con todas las tareas
- `planificacion:presupuesto` — array JSON con todas las categorías de presupuesto

## Estructura de Archivos

### Componentes nuevos

```
src/pages/AdminPlanificacion.tsx          — Página principal con tabs (dashboard/tareas/presupuesto)
src/components/planificacion/
  PlanDashboard.tsx                       — Dashboard con cards de métricas
  KanbanBoard.tsx                         — Tablero Kanban completo
  KanbanColumn.tsx                        — Columna individual del Kanban
  KanbanCard.tsx                          — Tarjeta individual
  TaskModal.tsx                           — Modal para crear/editar tarea
  BudgetTable.tsx                         — Tabla de presupuesto
  BudgetCategoryModal.tsx                 — Modal para crear/editar categoría
```

### Tipos

```
src/types/planificacion.ts                — Tarea, CategoriaPresupuesto, tipos de estado
```

### API

```
api/planificacion.ts                      — Endpoint serverless
```

## Navegación

- Desde AdminOculto: botón visible "Planificación" que navega a `/admin/planificacion`
- Desde AdminPlanificacion: link "← Panel de invitados" que vuelve a AdminOculto
- AdminPlanificacion valida la sesión de admin al cargar (misma lógica que AdminOculto)
- Ruta añadida en React Router en App.tsx / router config

## Autenticación

Reutiliza el sistema existente:

- La página verifica sesión activa llamando al endpoint de admin
- Si no hay sesión, redirige a AdminOculto para login
- Mismas cookies httpOnly con TTL de 24h
- Si la sesión expira durante uso activo: al siguiente save/fetch fallará con 401, se muestra toast "Sesión expirada" y se redirige a login

## Estilo visual

- Coherente con el resto del admin: shadcn/ui components, Tailwind CSS
- Tipografía: `font-playfair` para headings, `font-sans` para body
- Cards con bordes sutiles y sombras consistentes con el diseño actual
- Drag & drop visual con feedback de arrastre (opacity, shadow)

## Manejo de errores

- Fallos de red/API: toast de error (sonner), UI revierte cambios optimistas
- Validación de formularios: mensajes inline bajo los campos (patrón Zod + React Hook Form)
- Loading states: skeleton loaders en cards del dashboard, spinner en tablas

## Datos de ejemplo precargados

No se precargan datos. Las categorías y tareas empiezan vacías. El usuario las crea a medida.
