import { useDraggable } from '@dnd-kit/core';
import { PersonaPlano } from '@/types/plano';
import { useSeatingEditor } from './SeatingEditorProvider';
import { Link2, Unlink } from 'lucide-react';

interface Props {
  personas: PersonaPlano[];
}

export function DraggableGuest({ personas }: Props) {
  const { toggleParejaLink } = useSeatingEditor();
  const isCouple = personas.length === 2;
  const primary = personas[0];
  const dragId = personas.map(p => p.personaId).join('+');

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `guest-${dragId}`,
    data: {
      type: 'guest',
      personaIds: personas.map(p => p.personaId),
      isCouple,
    },
  });

  // Determine dot color based on type
  const dotColor = isCouple
    ? 'bg-pink-400'
    : primary.tipo === 'hijo'
    ? 'bg-orange-400'
    : 'bg-blue-400';

  const displayName = isCouple
    ? `${personas[0].nombre} + ${personas[1].nombre}`
    : `${primary.nombre} ${primary.apellidos}`;

  const subtitle = isCouple
    ? 'Pareja'
    : primary.tipo === 'principal'
    ? 'Invitado principal'
    : primary.tipo === 'hijo'
    ? `Hijo/a`
    : primary.tipo;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-2 p-2.5 rounded-lg border bg-card hover:bg-accent/50 cursor-grab active:cursor-grabbing transition-all
        ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
    >
      <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{displayName}</div>
        <div className="text-[11px] text-muted-foreground truncate">
          {subtitle} — {primary.grupoNombre}
        </div>
      </div>
      {/* Couple link/unlink button */}
      {primary.parejaId && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            toggleParejaLink(primary.personaId);
          }}
          className="shrink-0 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title={primary.parejaVinculada ? 'Separar pareja' : 'Vincular pareja'}
        >
          {primary.parejaVinculada ? <Link2 className="w-3.5 h-3.5" /> : <Unlink className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  );
}
