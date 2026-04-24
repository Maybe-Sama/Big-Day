import { useDroppable } from '@dnd-kit/core';
import { useSeatingEditor } from './SeatingEditorProvider';
import { getPersonaInitials } from '@/lib/plano-utils';
import { getTipoAcompananteLabel } from '@/types/invitados';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Bus, AlertTriangle, Mail, Users, StickyNote } from 'lucide-react';

interface Props {
  mesaId: string;
  sillaIndex: number;
  style?: React.CSSProperties;
}

export function DroppableSeat({ mesaId, sillaIndex, style }: Props) {
  const { getAssignmentForSeat, getPersonaById, unassignSeat, hasNotas, getNotasForPersona } = useSeatingEditor();
  const assignment = getAssignmentForSeat(mesaId, sillaIndex);
  const persona = assignment ? getPersonaById(assignment.personaId) : undefined;

  const { setNodeRef, isOver } = useDroppable({
    id: `seat-${mesaId}-${sillaIndex}`,
    data: { type: 'seat', mesaId, sillaIndex },
  });

  if (persona && assignment) {
    const initials = getPersonaInitials(persona);
    const personaNotas = getNotasForPersona(persona.personaId);
    const hasNote = personaNotas.length > 0;

    const tipoLabel = persona.tipo === 'principal'
      ? 'Invitado principal'
      : getTipoAcompananteLabel(persona.tipo);

    const asistenciaConfig = {
      confirmado: { label: 'Confirmado', className: 'bg-green-500/10 text-green-700 border-green-200' },
      pendiente: { label: 'Pendiente', className: 'bg-yellow-500/10 text-yellow-700 border-yellow-200' },
      rechazado: { label: 'Rechazado', className: 'bg-red-500/10 text-red-700 border-red-200' },
    }[persona.asistencia];

    // Colors: dark red for notes, half orange+lado for kids, solid lado otherwise
    const ladoColor = persona.lado === 'novio' ? '#3b82f6' : '#ec4899'; // blue-500 / pink-500
    const ladoBorder = persona.lado === 'novio' ? '#2563eb' : '#db2777'; // blue-600 / pink-600

    let seatStyle: React.CSSProperties = {};
    let seatBorderClass = '';

    if (hasNote) {
      seatStyle = { background: '#7f1d1d' }; // red-900
      seatBorderClass = 'border-red-950';
    } else if (persona.tipo === 'hijo') {
      // Half orange, half lado color
      seatStyle = {
        background: `linear-gradient(135deg, #f97316 50%, ${ladoColor} 50%)`,
        borderColor: `#ea580c`, // orange-600
      };
    } else {
      seatStyle = { background: ladoColor, borderColor: ladoBorder };
    }

    return (
      <div ref={setNodeRef} style={style} className="relative group">
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold cursor-pointer transition-all
                text-white border-2 ${seatBorderClass}
                ${isOver ? 'ring-2 ring-yellow-400 scale-110' : 'hover:scale-110 hover:shadow-lg'}`}
              style={seatStyle}
            >
              {initials}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" side="top" sideOffset={8}>
            {/* Header */}
            <div className="p-3 border-b bg-muted/30">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-sm">{persona.nombre} {persona.apellidos}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{tipoLabel}</p>
                </div>
                <Badge variant="outline" className={`text-[10px] h-5 shrink-0 ${asistenciaConfig.className}`}>
                  {asistenciaConfig.label}
                </Badge>
              </div>
            </div>

            {/* Details */}
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Grupo:</span>
                <span className="font-medium truncate">{persona.grupoNombre}</span>
              </div>

              {persona.email && (
                <div className="flex items-center gap-2 text-xs">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{persona.email}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs">
                <Bus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Bus:</span>
                {persona.confirmacionBus ? (
                  <span className="font-medium text-green-700">
                    {persona.ubicacionBus || 'Confirmado'}
                  </span>
                ) : (
                  <span className="text-muted-foreground">No</span>
                )}
              </div>

              {persona.alergias && (
                <div className="flex items-start gap-2 text-xs bg-red-500/5 border border-red-200 rounded-md p-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-red-700">Alergias: </span>
                    <span className="text-red-600">{persona.alergias}</span>
                  </div>
                </div>
              )}

              {/* Notes */}
              {personaNotas.length > 0 && (
                <div className="space-y-1.5 mt-1">
                  {personaNotas.map(nota => (
                    <div key={nota.id} className="flex items-start gap-2 text-xs bg-red-900/5 border border-red-800/20 rounded-md p-2">
                      <StickyNote className="w-3.5 h-3.5 text-red-800 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-red-900">Nota: </span>
                        <span className="text-red-800">{nota.texto}</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(nota.fechaCreacion).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-2 border-t bg-muted/20">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => unassignSeat(assignment.personaId)}
              >
                <X className="w-3 h-3 mr-1.5" />
                Quitar de esta silla
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Quick unassign on hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            unassignSeat(assignment.personaId);
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
        className={`w-8 h-8 rounded-full border-2 border-dashed transition-all
          ${isOver
            ? 'border-primary bg-primary/20 scale-110'
            : 'border-muted-foreground/30 hover:border-muted-foreground/50'
          }`}
      />
    </div>
  );
}
