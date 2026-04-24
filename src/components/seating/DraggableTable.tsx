import { useDraggable } from '@dnd-kit/core';
import { MesaConfig } from '@/types/mesas';
import { useSeatingEditor } from './SeatingEditorProvider';
import { DroppableSeat } from './DroppableSeat';
import { TableEditPopover } from './TableEditPopover';
import { TableInfoPopover } from './TableInfoPopover';
import { getSeatPositions, getTableDimensions } from '@/lib/plano-utils';
import { Settings2, Users } from 'lucide-react';

interface Props {
  mesa: MesaConfig;
}

export function DraggableTable({ mesa }: Props) {
  const { selectedMesaId, selectTable, asignaciones } = useSeatingEditor();
  const isSelected = selectedMesaId === mesa.id;
  const forma = mesa.forma || 'poligonal';
  const isVertical = forma === 'rectangular' && mesa.rotacion === 90;

  const baseDims = getTableDimensions(forma, mesa.capacidad);
  const width = isVertical ? baseDims.height : baseDims.width;
  const height = isVertical ? baseDims.width : baseDims.height;
  const seatPositions = getSeatPositions(forma, mesa.capacidad, width, height);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `table-${mesa.id}`,
    data: { type: 'table', mesaId: mesa.id },
  });

  const occupiedCount = asignaciones.filter(a => a.mesaId === mesa.id).length;

  const padding = 40;
  const containerWidth = width + padding * 2;
  const containerHeight = height + padding * 2;

  const selectedClass = isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : '';
  const shapeClass = forma === 'poligonal' ? 'rounded-full' : 'rounded-lg';

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
      {/* Table shape — drag handle */}
      <div
        {...attributes}
        {...listeners}
        className={`absolute flex items-center justify-center bg-accent/30 border-2 border-primary/40 hover:border-primary/70 transition-colors cursor-grab active:cursor-grabbing ${shapeClass} ${selectedClass}`}
        style={{ left: padding, top: padding, width, height }}
        onClick={(e) => {
          e.stopPropagation();
          selectTable(mesa.id);
        }}
      >
        <div className="flex flex-col items-center pointer-events-none">
          <span className="text-xs font-semibold text-foreground text-center leading-tight px-1">
            {mesa.nombre}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {occupiedCount}/{mesa.capacidad}
          </span>
        </div>

        {/* Edit button (gear) — bottom right inside table */}
        <TableEditPopover mesaId={mesa.id}>
          <button
            className="absolute bottom-1 right-1 flex items-center justify-center w-5 h-5 rounded-full bg-card/80 border shadow-sm hover:bg-accent transition-colors pointer-events-auto"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            title="Editar mesa"
          >
            <Settings2 className="w-2.5 h-2.5 text-muted-foreground" />
          </button>
        </TableEditPopover>

        {/* Info button (people list) — bottom left inside table */}
        <TableInfoPopover mesaId={mesa.id}>
          <button
            className="absolute bottom-1 left-1 flex items-center justify-center w-5 h-5 rounded-full bg-card/80 border shadow-sm hover:bg-accent transition-colors pointer-events-auto"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            title="Ver comensales"
          >
            <Users className="w-2.5 h-2.5 text-muted-foreground" />
          </button>
        </TableInfoPopover>
      </div>

      {/* Seats */}
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
