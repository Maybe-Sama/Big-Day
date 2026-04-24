import { useDraggable } from '@dnd-kit/core';
import { useState } from 'react';
import { MesaConfig } from '@/types/mesas';
import { useSeatingEditor } from './SeatingEditorProvider';
import { DroppableSeat } from './DroppableSeat';
import { TableShape } from './TableShape';
import { TableEditPopover } from './TableEditPopover';
import { getSeatPositions, getTableDimensions } from '@/lib/plano-utils';
import { Settings2 } from 'lucide-react';

interface Props {
  mesa: MesaConfig;
}

export function DraggableTable({ mesa }: Props) {
  const { selectedMesaId, selectTable, asignaciones } = useSeatingEditor();
  const isSelected = selectedMesaId === mesa.id;
  const forma = mesa.forma || 'poligonal';
  const { width, height } = getTableDimensions(forma, mesa.capacidad);
  const seatPositions = getSeatPositions(forma, mesa.capacidad, width, height);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `table-${mesa.id}`,
    data: { type: 'table', mesaId: mesa.id },
  });

  const occupiedCount = asignaciones.filter(a => a.mesaId === mesa.id).length;

  const padding = 40;
  const containerWidth = width + padding * 2;
  const containerHeight = height + padding * 2;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: (mesa.x ?? 0) + (transform?.x ?? 0),
    top: (mesa.y ?? 0) + (transform?.y ?? 0),
    width: containerWidth,
    height: containerHeight,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 100 : isSelected ? 50 : 1,
    transition: isDragging ? 'none' : 'box-shadow 0.2s',
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* Table shape - DRAG handle only */}
      <div
        {...attributes}
        {...listeners}
        className="absolute cursor-grab active:cursor-grabbing"
        style={{
          left: padding,
          top: padding,
          width,
          height,
        }}
        onClick={(e) => {
          e.stopPropagation();
          selectTable(mesa.id);
        }}
      >
        <TableShape
          forma={forma}
          width={width}
          height={height}
          nombre={mesa.nombre}
          occupiedCount={occupiedCount}
          capacidad={mesa.capacidad}
          isSelected={isSelected}
        />
      </div>

      {/* Edit button - separate from drag, no conflict */}
      <TableEditPopover mesaId={mesa.id}>
        <button
          className="absolute flex items-center justify-center w-6 h-6 rounded-full bg-card border shadow-sm hover:bg-accent transition-colors z-10"
          style={{
            left: padding + width - 4,
            top: padding - 4,
          }}
          onClick={(e) => e.stopPropagation()}
          title="Editar mesa"
        >
          <Settings2 className="w-3 h-3 text-muted-foreground" />
        </button>
      </TableEditPopover>

      {/* Seats around the table */}
      {seatPositions.map((pos, index) => (
        <DroppableSeat
          key={index}
          mesaId={mesa.id}
          sillaIndex={index}
          style={{
            position: 'absolute',
            left: padding + pos.x - 14,
            top: padding + pos.y - 14,
          }}
        />
      ))}
    </div>
  );
}
