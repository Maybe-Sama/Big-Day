import { useSeatingEditor } from './SeatingEditorProvider';
import { getTipoAcompananteLabel } from '@/types/invitados';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Users, AlertTriangle, Bus, StickyNote } from 'lucide-react';

interface Props {
  mesaId: string;
  children: React.ReactNode;
}

export function TableInfoPopover({ mesaId, children }: Props) {
  const { mesas, getPersonasInMesa, asignaciones, hasNotas, getNotasForPersona } = useSeatingEditor();
  const mesa = mesas.find(m => m.id === mesaId);
  const personas = getPersonasInMesa(mesaId);
  const occupiedCount = asignaciones.filter(a => a.mesaId === mesaId).length;

  if (!mesa) return <>{children}</>;

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" side="right" sideOffset={12}>
        {/* Header */}
        <div className="p-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">{mesa.nombre}</h4>
            <Badge variant="outline" className="text-[10px] h-5">
              {occupiedCount}/{mesa.capacidad} plazas
            </Badge>
          </div>
        </div>

        {/* People list */}
        <div className="p-2 max-h-[50vh] overflow-y-auto">
          {personas.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No hay nadie asignado
            </p>
          ) : (
            <div className="space-y-1">
              {personas.map(p => {
                const tipoLabel = p.tipo === 'principal'
                  ? 'Principal'
                  : getTipoAcompananteLabel(p.tipo);
                const personaNotas = getNotasForPersona(p.personaId);
                const hasNote = personaNotas.length > 0;

                return (
                  <div
                    key={p.personaId}
                    className={`flex items-center gap-2.5 p-2 rounded-lg ${hasNote ? 'bg-red-900/5 border border-red-200/50' : 'hover:bg-muted/50'}`}
                  >
                    {/* Type dot */}
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      hasNote ? 'bg-red-800'
                      : p.tipo === 'pareja' || p.tipo === 'principal' ? 'bg-pink-400'
                      : p.tipo === 'hijo' ? 'bg-orange-400'
                      : 'bg-blue-400'
                    }`} />

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{p.nombre} {p.apellidos}</div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{tipoLabel}</span>
                        {p.alergias && (
                          <span className="flex items-center gap-0.5 text-red-600">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Alergias
                          </span>
                        )}
                        {p.confirmacionBus && (
                          <span className="flex items-center gap-0.5 text-green-600">
                            <Bus className="w-2.5 h-2.5" />
                            Bus
                          </span>
                        )}
                      </div>
                      {hasNote && (
                        <div className="flex items-start gap-1 mt-1 text-[10px] text-red-800">
                          <StickyNote className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{personaNotas[0].texto}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer stats */}
        <div className="p-2 border-t bg-muted/20 flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {personas.length} persona{personas.length !== 1 ? 's' : ''}
          </span>
          {personas.some(p => p.alergias) && (
            <span className="flex items-center gap-1 text-red-600">
              <AlertTriangle className="w-3 h-3" />
              {personas.filter(p => p.alergias).length} con alergias
            </span>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
