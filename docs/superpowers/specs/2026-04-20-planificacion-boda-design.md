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
- **Coste cubiertos**: precio unitario × asistentes confirmados (calculado en tiempo real desde datos de invitados)

## Kanban — Tab Tareas

### Columnas

Tres columnas fijas, no editables:

1. `Por hacer`
2. `En progreso`
3. `Hecho`

### Tarjetas

Cada tarea contiene:

- `id`: string (generado automáticamente)
- `titulo`: string (requerido)
- `descripcion`: string (opcional, breve)
- `responsable`: string (campo libre, con sugerencias de responsables previos)
- `columna`: 'todo' | 'in_progress' | 'done'
- `orden`: number (posición dentro de la columna)
- `fechaCreacion`: string ISO
- `fechaActualizacion`: string ISO

### Interacciones

- Drag & drop entre columnas y dentro de columnas para reordenar
- Botón "+" en cada columna para añadir tarea rápida
- Click en tarjeta para editar (modal o inline)
- Botón eliminar en cada tarjeta (con confirmación)
- Los responsables se crean sobre la marcha: campo de texto libre que sugiere nombres ya usados previamente

## Presupuesto — Tab Presupuesto

### Categorías

Cada categoría de gasto contiene:

- `id`: string (generado automáticamente)
- `nombre`: string (ej: "Músicos", "Bus", "Hacienda", "Cubierto", "Fotógrafo")
- `costeEstimado`: number (en euros)
- `estadoPago`: 'sin_pagar' | 'senal_pagada' | 'pagado_completo'
- `cantidadPagada`: number (en euros, 0 por defecto)
- `fechaUltimoPago`: string ISO | null
- `notas`: string (opcional)
- `esCubierto`: boolean (flag para categoría especial)
- `precioPorCubierto`: number | null (solo cuando esCubierto=true)
- `orden`: number

### Categoría especial "Cubierto"

Cuando `esCubierto=true`:

- Se muestra campo `precioPorCubierto` en lugar de `costeEstimado`
- El `costeEstimado` se calcula automáticamente: `precioPorCubierto × asistentesConfirmados`
- El conteo de asistentes confirmados se obtiene del endpoint existente de invitados
- Solo puede haber una categoría con `esCubierto=true`

### Vista

- Tabla/lista con todas las categorías
- Cada fila muestra: nombre, estimado, pagado, estado (badge de color), fecha último pago
- Fila de totales al final: total estimado, total pagado, total pendiente
- Barra de progreso visual del presupuesto (pagado vs total)
- Botones: añadir categoría, editar, eliminar (con confirmación)

### Estados de pago — colores

- `sin_pagar`: rojo/gris
- `senal_pagada`: amarillo/naranja
- `pagado_completo`: verde

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
src/types/planificacion.ts                — Tarea, CategoriaPrespuesto, tipos de estado
```

### API

```
api/planificacion.ts                      — Endpoint serverless con actions:
                                            - get-tareas / save-tareas
                                            - get-presupuesto / save-presupuesto
```

### Almacenamiento Redis

- `planificacion:tareas` — array JSON con todas las tareas
- `planificacion:presupuesto` — array JSON con todas las categorías de presupuesto

## Navegación

- Desde AdminOculto: botón visible "Planificación" que navega a `/admin/planificacion`
- Desde AdminPlanificacion: link "← Panel de invitados" que vuelve a AdminOculto
- AdminPlanificacion valida la sesión de admin al cargar (misma lógica que AdminOculto)

## Autenticación

Reutiliza el sistema existente:

- La página verifica sesión activa llamando al endpoint de admin
- Si no hay sesión, redirige a AdminOculto para login
- Mismas cookies httpOnly con TTL de 24h

## Estilo visual

- Coherente con el resto del admin: shadcn/ui components, Tailwind CSS
- Tipografía: `font-playfair` para headings, `font-sans` para body
- Cards con bordes sutiles y sombras consistentes con el diseño actual
- Drag & drop visual con feedback de arrastre (opacity, shadow)

## Datos de ejemplo precargados

No se precargan datos. Las categorías y tareas empiezan vacías. El usuario las crea a medida.
