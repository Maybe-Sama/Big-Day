import { useState } from 'react';
import { useSeatingEditor } from './SeatingEditorProvider';
import { getTipoAcompananteLabel } from '@/types/invitados';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, AlertTriangle, Bus, StickyNote, X, Check, Pencil } from 'lucide-react';

interface Props {
  mesaId: string;
  children: React.ReactNode;
}

export function TableInfoPopover({ mesaId, children }: Props) {
  const { mesas, getPersonasInMesa, asignaciones, hasNotas, getNotasForPersona, updateTable, unassignSeat } = useSeatingEditor();
  const mesa = mesas.find(m => m.id === mesaId);
  const personas = getPersonasInMesa(mesaId);
  const occupiedCount = asignaciones.filter(a => a.mesaId === mesaId).length;

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');

  if (!mesa) return <>{children}</>;

  const startEditName = () => {
    setNameValue(mesa.nombre);
    setEditingName(true);
  };

  const saveName = () => {
    if (nameValue.trim()) {
      updateTable(mesaId, { nombre: nameValue.trim() });
    }
    setEditingName(false);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" side="right" sideOffset={12}>
        {/* Header — editable name */}
        <div className="p-3 border-b bg-muted/30">
          <div className="flex items-center justify-between gap-2">
            {editingName ? (
              <div className="flex items-center gap-1 flex-1">
                <Input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="h-7 text-sm flex-1"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                />
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={saveName}>
                  <Check className="w-3.5 h-3.5 text-green-600" />
                </Button>
              </div>
            ) : (
              <button
                className="flex items-center gap-1.5 hover:text-primary transition-colors group"
                onClick={startEditName}
              >
                <h4 className="font-semibold text-sm">{mesa.nombre}</h4>
                <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
            <Badge variant="outline" className="text-[10px] h-5 shrink-0">
              {occupiedCount}/{mesa.capacidad} plazas
            </Badge>
          </div>
        </div>

        {/* People list — with remove button */}
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

                const dotColor = hasNote
                  ? 'bg-red-800'
                  : p.tipo === 'hijo'
                  ? 'bg-orange-400'
                  : p.lado === 'novio'
                  ? 'bg-blue-400'
                  : 'bg-pink-400';

                return (
                  <div
                    key={p.personaId}
                    className={`flex items-center gap-2 p-2 rounded-lg group ${hasNote ? 'bg-red-900/5 border border-red-200/50' : 'hover:bg-muted/50'}`}
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />

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

                    {/* Remove from table */}
                    <button
                      onClick={() => unassignSeat(p.personaId)}
                      className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-destructive/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                      title="Quitar de la mesa"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
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
