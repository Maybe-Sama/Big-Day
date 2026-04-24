import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  pointerWithin,
} from '@dnd-kit/core';
import { useSeatingEditor } from './SeatingEditorProvider';

interface DragData {
  type: 'guest' | 'table';
  personaIds?: string[];
  isCouple?: boolean;
  mesaId?: string;
}

export function SeatingDndProvider({ children }: { children: React.ReactNode }) {
  const {
    assignSeat,
    moveSeat,
    moveTable,
    mesas,
    getPersonaById,
    getAssignmentForPersona,
    zoom,
  } = useSeatingEditor();

  const [activeDrag, setActiveDrag] = useState<{
    type: 'guest' | 'table';
    personaIds?: string[];
    mesaId?: string;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as DragData | undefined;
    if (!data) return;

    if (data.type === 'guest') {
      setActiveDrag({ type: 'guest', personaIds: data.personaIds });
    } else if (data.type === 'table') {
      setActiveDrag({ type: 'table', mesaId: data.mesaId });
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over, delta } = event;
    const activeData = active.data.current as DragData | undefined;

    if (!activeData) {
      setActiveDrag(null);
      return;
    }

    // Table drag — move position
    if (activeData.type === 'table' && activeData.mesaId) {
      const mesa = mesas.find(m => m.id === activeData.mesaId);
      if (mesa) {
        moveTable(
          activeData.mesaId,
          (mesa.x ?? 0) + delta.x / zoom,
          (mesa.y ?? 0) + delta.y / zoom
        );
      }
      setActiveDrag(null);
      return;
    }

    // Guest drag — assign to seat
    if (activeData.type === 'guest' && activeData.personaIds && over) {
      const overData = over.data.current as { type?: string; mesaId?: string; sillaIndex?: number } | undefined;

      if (overData?.type === 'seat' && overData.mesaId !== undefined && overData.sillaIndex !== undefined) {
        const personaIds = activeData.personaIds;

        if (personaIds.length === 1) {
          // Single person
          const existing = getAssignmentForPersona(personaIds[0]);
          if (existing) {
            moveSeat(personaIds[0], overData.mesaId, overData.sillaIndex);
          } else {
            assignSeat(personaIds[0], overData.mesaId, overData.sillaIndex);
          }
        } else if (personaIds.length === 2) {
          // Couple — assign to 2 adjacent seats
          const existing0 = getAssignmentForPersona(personaIds[0]);
          const seatIndex1 = overData.sillaIndex;
          const seatIndex2 = overData.sillaIndex + 1;

          if (existing0) {
            moveSeat(personaIds[0], overData.mesaId, seatIndex1);
          } else {
            assignSeat(personaIds[0], overData.mesaId, seatIndex1);
          }

          const existing1 = getAssignmentForPersona(personaIds[1]);
          if (existing1) {
            moveSeat(personaIds[1], overData.mesaId, seatIndex2);
          } else {
            assignSeat(personaIds[1], overData.mesaId, seatIndex2);
          }
        }
      }
    }

    setActiveDrag(null);
  }, [mesas, zoom, moveTable, assignSeat, moveSeat, getAssignmentForPersona]);

  // Drag overlay content
  const renderOverlay = () => {
    if (!activeDrag) return null;

    if (activeDrag.type === 'guest' && activeDrag.personaIds) {
      const names = activeDrag.personaIds
        .map(id => {
          const p = getPersonaById(id);
          return p ? `${p.nombre} ${p.apellidos}` : '';
        })
        .filter(Boolean);

      return (
        <div className="px-3 py-2 bg-card border rounded-lg shadow-xl text-sm font-medium pointer-events-none">
          {names.join(' + ')}
        </div>
      );
    }

    return null;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {renderOverlay()}
      </DragOverlay>
    </DndContext>
  );
}
