import { GrupoInvitados } from '@/types/invitados';
import { PersonaPlano, AsignacionSilla, LadoInvitado } from '@/types/plano';

/** Flatten GrupoInvitados[] into individual PersonaPlano[] for the seating editor */
export function flattenGrupos(grupos: GrupoInvitados[], gruposNovio: Set<string> = new Set()): PersonaPlano[] {
  const personas: PersonaPlano[] = [];

  for (const grupo of grupos) {
    const principalId = `${grupo.id}:principal`;
    const parejaAc = grupo.acompanantes.find(ac => ac.tipo === 'pareja' && ac.asistencia === 'confirmado');
    const parejaId = parejaAc ? `${grupo.id}:${parejaAc.id}` : undefined;
    const lado: LadoInvitado = gruposNovio.has(grupo.id) ? 'novio' : 'novia';

    // Only include confirmed guests
    if (grupo.invitadoPrincipal.asistencia !== 'confirmado') continue;

    // Add principal guest
    personas.push({
      personaId: principalId,
      nombre: grupo.invitadoPrincipal.nombre,
      apellidos: grupo.invitadoPrincipal.apellidos,
      tipo: 'principal',
      grupoId: grupo.id,
      grupoNombre: `${grupo.invitadoPrincipal.nombre} ${grupo.invitadoPrincipal.apellidos}`,
      lado,
      parejaId,
      parejaVinculada: !!parejaId,
      asistencia: grupo.invitadoPrincipal.asistencia,
      alergias: grupo.invitadoPrincipal.alergias,
      email: grupo.invitadoPrincipal.email,
      confirmacionBus: grupo.invitadoPrincipal.confirmacion_bus ?? grupo.confirmacion_bus,
      ubicacionBus: grupo.ubicacion_bus,
    });

    // Add companions (only confirmed)
    for (const ac of grupo.acompanantes) {
      if (ac.asistencia !== 'confirmado') continue;
      const acId = `${grupo.id}:${ac.id}`;
      personas.push({
        personaId: acId,
        nombre: ac.nombre,
        apellidos: ac.apellidos,
        tipo: ac.tipo,
        grupoId: grupo.id,
        grupoNombre: `${grupo.invitadoPrincipal.nombre} ${grupo.invitadoPrincipal.apellidos}`,
        lado,
        parejaId: ac.tipo === 'pareja' ? principalId : undefined,
        parejaVinculada: ac.tipo === 'pareja',
        asistencia: ac.asistencia,
        alergias: ac.alergias,
        confirmacionBus: ac.confirmacion_bus ?? grupo.confirmacion_bus,
        ubicacionBus: grupo.ubicacion_bus,
      });
    }
  }

  return personas;
}

/** Get personas not assigned to any seat */
export function getUnassignedPersonas(
  personas: PersonaPlano[],
  asignaciones: AsignacionSilla[]
): PersonaPlano[] {
  const assignedIds = new Set(asignaciones.map(a => a.personaId));
  return personas.filter(p => !assignedIds.has(p.personaId));
}

/** Get initials for display on seats */
export function getPersonaInitials(p: PersonaPlano): string {
  return `${p.nombre[0] || ''}${p.apellidos[0] || ''}`.toUpperCase();
}

/** Calculate seat positions around a table shape */
export function getSeatPositions(
  forma: 'poligonal' | 'rectangular',
  capacidad: number,
  tableWidth: number,
  tableHeight: number
): { x: number; y: number }[] {
  const seats: { x: number; y: number }[] = [];
  const gap = 20; // distance from table edge to seat center

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
    // Rectangular: seats along the two long sides, optionally on short ends
    const isVertical = tableHeight > tableWidth;
    const longSideLen = isVertical ? tableHeight : tableWidth;
    const shortSideLen = isVertical ? tableWidth : tableHeight;
    const seatsPerLongSide = Math.max(2, Math.floor(capacidad / 2));
    const remaining = capacidad - seatsPerLongSide * 2;
    const spacing = longSideLen / (seatsPerLongSide + 1);

    if (isVertical) {
      // Vertical: seats on left and right sides
      for (let i = 0; i < seatsPerLongSide; i++) {
        seats.push({ x: -gap, y: spacing * (i + 1) });
      }
      for (let i = 0; i < seatsPerLongSide; i++) {
        seats.push({ x: tableWidth + gap, y: spacing * (i + 1) });
      }
      // Top end
      if (remaining >= 1) {
        seats.push({ x: tableWidth / 2, y: -gap });
      }
      // Bottom end
      if (remaining >= 2) {
        seats.push({ x: tableWidth / 2, y: tableHeight + gap });
      }
    } else {
      // Horizontal: seats on top and bottom
      for (let i = 0; i < seatsPerLongSide; i++) {
        seats.push({ x: spacing * (i + 1), y: -gap });
      }
      for (let i = 0; i < seatsPerLongSide; i++) {
        seats.push({ x: spacing * (i + 1), y: tableHeight + gap });
      }
      // Left end
      if (remaining >= 1) {
        seats.push({ x: -gap, y: tableHeight / 2 });
      }
      // Right end
      if (remaining >= 2) {
        seats.push({ x: tableWidth + gap, y: tableHeight / 2 });
      }
    }
  }

  return seats;
}

/** Calculate table dimensions based on form and capacity */
export function getTableDimensions(
  forma: 'poligonal' | 'rectangular',
  capacidad: number
): { width: number; height: number } {
  if (forma === 'poligonal') {
    // Scale circle size with capacity
    const base = 80;
    const extra = Math.max(0, capacidad - 6) * 8;
    const size = base + extra;
    return { width: size, height: size };
  } else {
    // Rectangular: wider with more seats
    const seatsPerSide = Math.max(2, Math.floor(capacidad / 2));
    const width = Math.max(120, seatsPerSide * 50);
    const height = 60;
    return { width, height };
  }
}

/** Sync seat assignments back to GrupoInvitados.mesa field for backward compat */
export function syncGrupoMesas(
  grupos: GrupoInvitados[],
  asignaciones: AsignacionSilla[]
): GrupoInvitados[] {
  // Build map: grupoId -> set of mesaIds
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
    // Use the first mesa as primary (backwards compat with single mesa field)
    return { ...g, mesa: [...mesas][0] };
  });
}

/** Generate text export of seating assignments */
export function generateSeatingListText(
  mesas: { id: string; nombre: string; capacidad: number }[],
  asignaciones: AsignacionSilla[],
  personas: PersonaPlano[]
): string {
  const personaMap = new Map(personas.map(p => [p.personaId, p]));
  const lines: string[] = ['PLANO DE MESAS', '='.repeat(40), ''];

  for (const mesa of mesas) {
    const mesaAsignaciones = asignaciones
      .filter(a => a.mesaId === mesa.id)
      .sort((a, b) => a.sillaIndex - b.sillaIndex);

    lines.push(`${mesa.nombre} (${mesaAsignaciones.length}/${mesa.capacidad} plazas)`);
    lines.push('-'.repeat(30));

    if (mesaAsignaciones.length === 0) {
      lines.push('  (vacía)');
    } else {
      mesaAsignaciones.forEach((a, i) => {
        const p = personaMap.get(a.personaId);
        if (p) {
          const alergiaTag = p.alergias ? ` [Alergias: ${p.alergias}]` : '';
          lines.push(`  ${i + 1}. ${p.nombre} ${p.apellidos}${alergiaTag}`);
        }
      });
    }
    lines.push('');
  }

  // Unassigned
  const assignedIds = new Set(asignaciones.map(a => a.personaId));
  const unassigned = personas.filter(p => !assignedIds.has(p.personaId));
  if (unassigned.length > 0) {
    lines.push('SIN ASIGNAR');
    lines.push('-'.repeat(30));
    unassigned.forEach((p, i) => {
      lines.push(`  ${i + 1}. ${p.nombre} ${p.apellidos}`);
    });
  }

  return lines.join('\n');
}
