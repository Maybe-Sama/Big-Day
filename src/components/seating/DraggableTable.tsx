import { useDraggable } from '@dnd-kit/core';
import { MesaConfig } from '@/types/mesas';
import { useSeatingEditor } from './SeatingEditorProvider';
import { DroppableSeat } from './DroppableSeat';
import { TableShape } from './TableShape';
import { getSeatPositions, getTableDimensions } from '@/lib/plano-utils';

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

  // Calculate bounding box to include seats
  const padding = 40; // space for seats around table
  const containerWidth = width + padding * 2;
  const containerHeight = height + padding * 2;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: (mesa.x ?? 0) + (transform?.x ?? 0) / 1, // transform is already in canvas coords
    top: (mesa.y ?? 0) + (transform?.y ?? 0) / 1,
    width: containerWidth,
    height: containerHeight,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 100 : isSelected ? 50 : 1,
    transition: isDragging ? 'none' : 'box-shadow 0.2s',
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* Table shape - drag handle */}
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
