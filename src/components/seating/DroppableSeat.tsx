import { useDroppable } from '@dnd-kit/core';
import { useSeatingEditor } from './SeatingEditorProvider';
import { getPersonaInitials } from '@/lib/plano-utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { X } from 'lucide-react';

interface Props {
  mesaId: string;
  sillaIndex: number;
  style?: React.CSSProperties;
}

export function DroppableSeat({ mesaId, sillaIndex, style }: Props) {
  const { getAssignmentForSeat, getPersonaById, unassignSeat } = useSeatingEditor();
  const assignment = getAssignmentForSeat(mesaId, sillaIndex);
  const persona = assignment ? getPersonaById(assignment.personaId) : undefined;

  const { setNodeRef, isOver } = useDroppable({
    id: `seat-${mesaId}-${sillaIndex}`,
    data: { type: 'seat', mesaId, sillaIndex },
  });

  const isOccupied = !!persona;

  if (isOccupied && persona) {
    const initials = getPersonaInitials(persona);
    const tipoPillColor =
      persona.tipo === 'pareja' || persona.tipo === 'principal'
        ? 'bg-pink-500/20 text-pink-300'
        : persona.tipo === 'hijo'
        ? 'bg-orange-500/20 text-orange-300'
        : 'bg-blue-500/20 text-blue-300';

    return (
      <div ref={setNodeRef} style={style} className="relative group">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold cursor-pointer transition-all
                bg-primary/80 text-primary-foreground border-2 border-primary
                ${isOver ? 'ring-2 ring-yellow-400 scale-110' : 'hover:scale-105'}`}
            >
              {initials}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p className="font-semibold">{persona.nombre} {persona.apellidos}</p>
            <p className={`text-[10px] ${tipoPillColor} px-1 rounded inline-block mt-0.5`}>
              {persona.tipo === 'principal' ? 'Invitado principal' : persona.tipo}
            </p>
            {persona.alergias && (
              <p className="text-[10px] text-red-400 mt-0.5">Alergias: {persona.alergias}</p>
            )}
          </TooltipContent>
        </Tooltip>
        {/* Unassign button on hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            unassignSeat(assignment!.personaId);
          }}
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      </div>
    );
  }

  // Empty seat
  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`w-7 h-7 rounded-full border-2 border-dashed transition-all
          ${isOver
            ? 'border-primary bg-primary/20 scale-110'
            : 'border-muted-foreground/30 hover:border-muted-foreground/50'
          }`}
      />
    </div>
  );
}
