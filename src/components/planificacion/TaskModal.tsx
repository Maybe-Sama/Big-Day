import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tarea, ColumnaKanban } from '@/types/planificacion';

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (tarea: Partial<Tarea> & { columna: ColumnaKanban }) => void;
  tarea?: Tarea | null;
  columna: ColumnaKanban;
  responsablesSugeridos: string[];
}

export default function TaskModal({ open, onClose, onSave, tarea, columna, responsablesSugeridos }: TaskModalProps) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [responsable, setResponsable] = useState('');
  const [showSugerencias, setShowSugerencias] = useState(false);

  useEffect(() => {
    if (tarea) {
      setTitulo(tarea.titulo);
      setDescripcion(tarea.descripcion);
      setResponsable(tarea.responsable);
    } else {
      setTitulo('');
      setDescripcion('');
      setResponsable('');
    }
  }, [tarea, open]);

  if (!open) return null;

  const handleSave = () => {
    if (!titulo.trim()) return;
    onSave({
      ...(tarea ? { id: tarea.id } : {}),
      titulo: titulo.trim().slice(0, 100),
      descripcion: descripcion.trim().slice(0, 300),
      responsable: responsable.trim().slice(0, 50),
      columna: tarea?.columna || columna,
    });
    onClose();
  };

  const sugerenciasFiltradas = responsablesSugeridos.filter(
    r => r.toLowerCase().includes(responsable.toLowerCase()) && r !== responsable
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            {tarea ? 'Editar tarea' : 'Nueva tarea'}
          </h3>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-white/70">Título *</Label>
            <Input
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ej: Confirmar fotógrafo"
              maxLength={100}
              className="mt-1 bg-white/5 border-white/10 text-white"
              autoFocus
            />
          </div>

          <div>
            <Label className="text-white/70">Descripción</Label>
            <Textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Breve descripción..."
              maxLength={300}
              rows={2}
              className="mt-1 bg-white/5 border-white/10 text-white resize-none"
            />
          </div>

          <div className="relative">
            <Label className="text-white/70">Responsable</Label>
            <Input
              value={responsable}
              onChange={e => {
                setResponsable(e.target.value);
                setShowSugerencias(true);
              }}
              onFocus={() => setShowSugerencias(true)}
              onBlur={() => setTimeout(() => setShowSugerencias(false), 150)}
              placeholder="Ej: Novia, Novio, Madre..."
              maxLength={50}
              className="mt-1 bg-white/5 border-white/10 text-white"
            />
            {showSugerencias && sugerenciasFiltradas.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-[#1a1a2e] border border-white/10 rounded-lg overflow-hidden shadow-lg">
                {sugerenciasFiltradas.map(s => (
                  <button
                    key={s}
                    onMouseDown={() => {
                      setResponsable(s);
                      setShowSugerencias(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-white/70 hover:bg-white/10"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1 border-white/10 text-white/70">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!titulo.trim()} className="flex-1">
            {tarea ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      </div>
    </div>
  );
}
