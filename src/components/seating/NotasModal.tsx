import { useState, useMemo } from 'react';
import { StickyNote, Plus, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppModal } from '@/components/common';
import { useSeatingEditor } from './SeatingEditorProvider';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function NotasModal({ isOpen, onClose }: Props) {
  const { notas, personas, addNota, deleteNota, getPersonaById } = useSeatingEditor();
  const [selectedPersonaId, setSelectedPersonaId] = useState('');
  const [textoNota, setTextoNota] = useState('');
  const [searchPersona, setSearchPersona] = useState('');

  const filteredPersonas = useMemo(() => {
    if (!searchPersona) return personas;
    const q = searchPersona.toLowerCase();
    return personas.filter(p =>
      `${p.nombre} ${p.apellidos}`.toLowerCase().includes(q)
    );
  }, [personas, searchPersona]);

  const sortedNotas = useMemo(
    () => [...notas].sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion)),
    [notas]
  );

  const handleAdd = () => {
    if (!selectedPersonaId || !textoNota.trim()) return;
    addNota(selectedPersonaId, textoNota.trim());
    setTextoNota('');
    setSelectedPersonaId('');
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Notas de invitados"
      description="Agrega notas sobre invitados para tenerlas en cuenta al organizar las mesas"
      maxWidth="2xl"
      footer={
        <Button variant="outline" onClick={onClose}>Cerrar</Button>
      }
    >
      <div className="space-y-5">
        {/* Add new note */}
        <div className="border rounded-xl p-4 bg-muted/30 space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nueva nota
          </h4>

          <div>
            <Label className="text-xs">Invitado</Label>
            <Select value={selectedPersonaId} onValueChange={setSelectedPersonaId}>
              <SelectTrigger className="h-9 text-sm mt-1">
                <SelectValue placeholder="Seleccionar invitado..." />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    placeholder="Buscar..."
                    value={searchPersona}
                    onChange={(e) => setSearchPersona(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                {filteredPersonas.map(p => (
                  <SelectItem key={p.personaId} value={p.personaId}>
                    {p.nombre} {p.apellidos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Nota</Label>
            <Textarea
              value={textoNota}
              onChange={(e) => setTextoNota(e.target.value)}
              placeholder="Ej: No sentar cerca de la mesa 3, tiene conflicto con..."
              className="text-sm mt-1 min-h-[60px]"
              maxLength={500}
            />
          </div>

          <Button
            size="sm"
            className="w-full h-8 text-xs"
            onClick={handleAdd}
            disabled={!selectedPersonaId || !textoNota.trim()}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Guardar nota
          </Button>
        </div>

        {/* Notes list */}
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <StickyNote className="w-4 h-4" />
            Notas ({notas.length})
          </h4>

          {sortedNotas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No hay notas todavia
            </p>
          ) : (
            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              {sortedNotas.map(nota => {
                const persona = getPersonaById(nota.personaId);
                return (
                  <div
                    key={nota.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="w-7 h-7 rounded-full bg-red-900/20 border border-red-800/30 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-red-800" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium truncate">
                          {persona ? `${persona.nombre} ${persona.apellidos}` : 'Invitado eliminado'}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {new Date(nota.fechaCreacion).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{nota.texto}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-destructive/50 hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteNota(nota.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppModal>
  );
}
