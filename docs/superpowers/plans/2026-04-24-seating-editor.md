# Seating Editor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a visual drag-and-drop seating editor where wedding admins can place tables on a canvas and assign individual guests to specific seats.

**Architecture:** dnd-kit for all drag-and-drop (already installed). React Context for editor state. CSS transforms for zoom/pan. Extends existing MesaConfig and GrupoInvitados types. New Redis key for seat assignments.

**Tech Stack:** React, TypeScript, dnd-kit, Tailwind, Shadcn/ui, Upstash Redis, html2canvas

---

## Task 1: Types and Data Model

**Files:**
- Modify: `src/types/mesas.ts`
- Create: `src/types/plano.ts`

- [ ] **Step 1: Extend MesaConfig with position/shape fields**

In `src/types/mesas.ts`, add optional fields to MesaConfig:

```typescript
export interface MesaConfig {
  id: string;
  nombre: string;
  capacidad: number;
  ubicacion?: string;
  capitanId?: string;
  token?: string;
  // New fields for seating editor
  forma?: 'poligonal' | 'rectangular';
  x?: number;
  y?: number;
  rotacion?: number;
}
```

All new fields are optional so existing mesas continue to work.

- [ ] **Step 2: Create plano types**

Create `src/types/plano.ts`:

```typescript
import { TipoAcompanante } from './invitados';

export type Asistencia = 'pendiente' | 'confirmado' | 'rechazado';

export interface AsignacionSilla {
  mesaId: string;
  sillaIndex: number;
  personaId: string; // "grupoId:principal" or "grupoId:acompananteId"
}

export interface PlanoMesas {
  asignaciones: AsignacionSilla[];
  zoom: number;
  panX: number;
  panY: number;
  ultimaActualizacion: string;
}

export interface PersonaPlano {
  personaId: string;
  nombre: string;
  apellidos: string;
  tipo: 'principal' | TipoAcompanante;
  grupoId: string;
  grupoNombre: string;
  parejaId?: string;
  parejaVinculada: boolean; // true = drag together, false = separated
  asistencia: Asistencia;
  alergias?: string;
}
```

- [ ] **Step 3: Commit**

---

## Task 2: API Endpoint for Plano

**Files:**
- Modify: `serverlib/storage.ts` (add key constant)
- Modify: `api/config.ts` (add 'plano' kind)
- Modify: `src/lib/api-service.ts` (add client methods)

- [ ] **Step 1: Add PLANO_KEY to storage constants**

In `serverlib/storage.ts`, add:
```typescript
export const PLANO_KEY = 'invitados:plano';
```

- [ ] **Step 2: Extend api/config.ts to support 'plano' kind**

Add 'plano' to the Kind type and getKeyForKind function:
```typescript
type Kind = 'mesas' | 'buses' | 'carreras' | 'plano';

function getKeyForKind(kind: Kind) {
  if (kind === 'mesas') return CONFIG_MESAS_KEY;
  if (kind === 'buses') return CONFIG_BUSES_KEY;
  if (kind === 'plano') return PLANO_KEY;
  return CARRERAS_KEY;
}
```

Update the kind validation:
```typescript
if (kind !== 'mesas' && kind !== 'buses' && kind !== 'carreras' && kind !== 'plano') {
  return res.status(400).json({ error: 'kind invalido. Usa mesas|buses|carreras|plano' });
}
```

Add plano GET normalization (after carreras check):
```typescript
if (kind === 'plano') {
  if (value == null) return res.status(200).json(null);
  return res.status(200).json(value);
}
```

- [ ] **Step 3: Add plano methods to ApiService**

In `src/lib/api-service.ts`, add:
```typescript
import { PlanoMesas } from '@/types/plano';

// In ApiService class:
async getPlano(): Promise<PlanoMesas | null> {
  try {
    return await this.fetchApi<PlanoMesas>('/config?kind=plano');
  } catch (error: any) {
    if (error.message.includes('404')) return null;
    throw error;
  }
}

async savePlano(plano: PlanoMesas): Promise<void> {
  await this.fetchApi('/config?kind=plano', {
    method: 'POST',
    body: JSON.stringify(plano),
  }, true);
}
```

- [ ] **Step 4: Commit**

---

## Task 3: Guest Flattening Utility

**Files:**
- Create: `src/lib/plano-utils.ts`

- [ ] **Step 1: Create utility to flatten guest groups into PersonaPlano[]**

```typescript
import { GrupoInvitados } from '@/types/invitados';
import { PersonaPlano, AsignacionSilla } from '@/types/plano';

export function flattenGrupos(grupos: GrupoInvitados[]): PersonaPlano[] {
  const personas: PersonaPlano[] = [];

  for (const grupo of grupos) {
    const principalId = `${grupo.id}:principal`;
    const parejaAc = grupo.acompanantes.find(ac => ac.tipo === 'pareja');
    const parejaId = parejaAc ? `${grupo.id}:${parejaAc.id}` : undefined;

    personas.push({
      personaId: principalId,
      nombre: grupo.invitadoPrincipal.nombre,
      apellidos: grupo.invitadoPrincipal.apellidos,
      tipo: 'principal',
      grupoId: grupo.id,
      grupoNombre: `${grupo.invitadoPrincipal.nombre} ${grupo.invitadoPrincipal.apellidos}`,
      parejaId,
      parejaVinculada: true,
      asistencia: grupo.invitadoPrincipal.asistencia,
      alergias: grupo.invitadoPrincipal.alergias,
    });

    for (const ac of grupo.acompanantes) {
      const acId = `${grupo.id}:${ac.id}`;
      personas.push({
        personaId: acId,
        nombre: ac.nombre,
        apellidos: ac.apellidos,
        tipo: ac.tipo,
        grupoId: grupo.id,
        grupoNombre: `${grupo.invitadoPrincipal.nombre} ${grupo.invitadoPrincipal.apellidos}`,
        parejaId: ac.tipo === 'pareja' ? principalId : undefined,
        parejaVinculada: ac.tipo === 'pareja',
        asistencia: ac.asistencia,
        alergias: ac.alergias,
      });
    }
  }

  return personas;
}

export function getUnassignedPersonas(
  personas: PersonaPlano[],
  asignaciones: AsignacionSilla[]
): PersonaPlano[] {
  const assignedIds = new Set(asignaciones.map(a => a.personaId));
  return personas.filter(p => !assignedIds.has(p.personaId));
}

export function getPersonaInitials(p: PersonaPlano): string {
  return `${p.nombre[0] || ''}${p.apellidos[0] || ''}`.toUpperCase();
}

export function getSeatPositions(
  forma: 'poligonal' | 'rectangular',
  capacidad: number,
  tableWidth: number,
  tableHeight: number
): { x: number; y: number }[] {
  const seats: { x: number; y: number }[] = [];
  const seatRadius = 16;
  const gap = seatRadius + 4;

  if (forma === 'poligonal') {
    const cx = tableWidth / 2;
    const cy = tableHeight / 2;
    const radius = Math.max(tableWidth, tableHeight) / 2 + gap;
    for (let i = 0; i < capacidad; i++) {
      const angle = (2 * Math.PI * i) / capacidad - Math.PI / 2;
      seats.push({
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      });
    }
  } else {
    // Rectangular: seats on top and bottom, optionally on ends
    const longSide = Math.max(2, Math.floor(capacidad / 2));
    const shortSide = capacidad - longSide * 2;
    const spacing = tableWidth / (longSide + 1);

    // Top row
    for (let i = 0; i < longSide; i++) {
      seats.push({ x: spacing * (i + 1), y: -gap });
    }
    // Bottom row
    for (let i = 0; i < longSide; i++) {
      seats.push({ x: spacing * (i + 1), y: tableHeight + gap });
    }
    // Left end
    if (capacidad > longSide * 2) {
      seats.push({ x: -gap, y: tableHeight / 2 });
    }
    // Right end
    if (capacidad > longSide * 2 + 1) {
      seats.push({ x: tableWidth + gap, y: tableHeight / 2 });
    }
  }

  return seats;
}

// Sync seat assignments back to GrupoInvitados.mesa field
export function syncGrupoMesas(
  grupos: GrupoInvitados[],
  asignaciones: AsignacionSilla[]
): GrupoInvitados[] {
  const grupoMesas = new Map<string, Set<string>>();

  for (const a of asignaciones) {
    const grupoId = a.personaId.split(':')[0];
    if (!grupoMesas.has(grupoId)) grupoMesas.set(grupoId, new Set());
    grupoMesas.get(grupoId)!.add(a.mesaId);
  }

  return grupos.map(g => {
    const mesas = grupoMesas.get(g.id);
    if (!mesas || mesas.size === 0) {
      return { ...g, mesa: undefined };
    }
    // Use the first mesa as the primary (for backwards compat)
    return { ...g, mesa: [...mesas][0] };
  });
}
```

- [ ] **Step 2: Commit**

---

## Task 4: SeatingEditorProvider (State Context)

**Files:**
- Create: `src/components/seating/SeatingEditorProvider.tsx`

- [ ] **Step 1: Create the context provider**

This is the central state manager for the editor. It handles:
- Loading data from API (mesas, grupos, plano)
- Maintaining the undo/redo history
- Autosave with 3-second debounce
- All mutations (assign seat, move table, create/delete table, etc.)

Key state shape:
```typescript
interface SeatingEditorState {
  mesas: MesaConfig[];
  personas: PersonaPlano[];
  asignaciones: AsignacionSilla[];
  zoom: number;
  panX: number;
  panY: number;
  isLoading: boolean;
  saveStatus: 'saved' | 'saving' | 'error';
  selectedMesaId: string | null;
}
```

Actions exposed via context:
- `assignSeat(personaId, mesaId, sillaIndex)`
- `unassignSeat(personaId)`
- `moveSeat(personaId, newMesaId, newSillaIndex)`
- `moveTable(mesaId, x, y)`
- `addTable(forma, capacidad)`
- `updateTable(mesaId, updates)`
- `deleteTable(mesaId)`
- `setZoom(zoom)` / `setPan(x, y)`
- `undo()` / `redo()`
- `toggleParejaLink(personaId)` — separate/rejoin couple

- [ ] **Step 2: Commit**

---

## Task 5: GuestSidebar Component

**Files:**
- Create: `src/components/seating/GuestSidebar.tsx`
- Create: `src/components/seating/DraggableGuest.tsx`

- [ ] **Step 1: Create GuestSidebar**

Sidebar with search, stats counters, and list of unassigned guests.
Uses `useSeatingEditor()` context to get personas and asignaciones.
Filters to show only unassigned, with search by name.
Couples shown as single item with link/unlink icon.

- [ ] **Step 2: Create DraggableGuest**

Uses `useDraggable` from dnd-kit. Shows:
- Color dot (pink = couple, blue = individual, orange = child)
- Name (or "Name + Name" for linked couples)
- Type label and group name

- [ ] **Step 3: Commit**

---

## Task 6: SeatingCanvas + Table Rendering

**Files:**
- Create: `src/components/seating/SeatingCanvas.tsx`
- Create: `src/components/seating/DraggableTable.tsx`
- Create: `src/components/seating/DroppableSeat.tsx`
- Create: `src/components/seating/TableShape.tsx`

- [ ] **Step 1: Create SeatingCanvas**

Container div with:
- CSS transform for zoom/pan: `transform: scale(${zoom}) translate(${panX}px, ${panY}px)`
- Grid background via radial-gradient
- Wheel handler for zoom
- Mouse drag on empty space for pan
- DndContext wrapping everything

- [ ] **Step 2: Create DraggableTable**

Wrapper using `useDraggable` from dnd-kit.
Positioned via `style={{ position: 'absolute', left: mesa.x, top: mesa.y }}`.
Contains TableShape + seats around it.
Click (not drag) opens edit popover.

- [ ] **Step 3: Create TableShape**

SVG polygon for `poligonal` form, rounded rect for `rectangular`.
Shows table name and occupancy count in center.
Sizes based on capacity.

- [ ] **Step 4: Create DroppableSeat**

Uses `useDroppable` from dnd-kit.
Renders:
- Empty: dashed circle (drop zone)
- Occupied: solid circle with initials + tooltip on hover

- [ ] **Step 5: Commit**

---

## Task 7: DnD Integration

**Files:**
- Create: `src/components/seating/SeatingDndProvider.tsx`

- [ ] **Step 1: Create the DnD wrapper**

Wraps DndContext from dnd-kit with:
- PointerSensor with 5px activation distance
- `onDragStart`: identify what's being dragged (guest or table)
- `onDragEnd`: dispatch appropriate action:
  - Guest dropped on seat → `assignSeat()` or `moveSeat()`
  - Table dropped → `moveTable()`
  - Guest dropped outside → no-op
- DragOverlay showing preview of dragged item
- Couple logic: when dragging linked couple, need 2 adjacent free seats

- [ ] **Step 2: Commit**

---

## Task 8: Toolbar, Zoom Controls, and Legend

**Files:**
- Create: `src/components/seating/CanvasToolbar.tsx`
- Create: `src/components/seating/ZoomControls.tsx`
- Create: `src/components/seating/AutosaveIndicator.tsx`
- Create: `src/components/seating/LegendPopover.tsx`

- [ ] **Step 1: Create CanvasToolbar**

Top-center floating bar with:
- "Add Poligonal" / "Add Rectangular" buttons
- Undo / Redo buttons
- Legend "?" button

- [ ] **Step 2: Create ZoomControls**

Bottom-right floating controls: +, percentage display, -

- [ ] **Step 3: Create AutosaveIndicator**

Top-right: green dot "Guardado", yellow "Guardando...", red "Error"

- [ ] **Step 4: Create LegendPopover**

Shadcn Popover with the legend table showing all icons, colors, and shortcuts.

- [ ] **Step 5: Commit**

---

## Task 9: Table Edit Popover

**Files:**
- Create: `src/components/seating/TableEditPopover.tsx`

- [ ] **Step 1: Create inline edit popover**

Shadcn Popover triggered by clicking a table. Contains:
- Name input (editable)
- Capacity input (adjusts seat count)
- Shape toggle (poligonal/rectangular)
- Delete button with confirmation

- [ ] **Step 2: Commit**

---

## Task 10: Export Functionality

**Files:**
- Create: `src/components/seating/ExportMenu.tsx`

- [ ] **Step 1: Install html2canvas**

```bash
pnpm add html2canvas
```

- [ ] **Step 2: Create ExportMenu**

Dropdown with 2 options:
- "Download as PNG" — captures the canvas div using html2canvas
- "Download guest list" — generates text file with mesa → guests mapping

- [ ] **Step 3: Commit**

---

## Task 11: Page and Route

**Files:**
- Create: `src/pages/AdminMesas.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create AdminMesas page**

Assembles all components:
```tsx
export default function AdminMesas() {
  return (
    <SeatingEditorProvider>
      <div className="h-screen flex flex-col bg-background">
        <header>...</header>
        <div className="flex-1 flex overflow-hidden">
          <GuestSidebar />
          <div className="flex-1 relative">
            <SeatingDndProvider>
              <CanvasToolbar />
              <AutosaveIndicator />
              <SeatingCanvas />
              <ZoomControls />
              <ExportMenu />
            </SeatingDndProvider>
          </div>
        </div>
      </div>
    </SeatingEditorProvider>
  );
}
```

- [ ] **Step 2: Add route to App.tsx**

Add before catch-all:
```tsx
import AdminMesas from "./pages/AdminMesas";
// ...
<Route path="/admin/mesas" element={<AdminMesas />} />
```

- [ ] **Step 3: Commit**
