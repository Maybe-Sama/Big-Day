import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CategoriaPresupuesto, EstadoPago, ESTADO_PAGO_CONFIG } from '@/types/planificacion';

interface BudgetCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (categoria: Partial<CategoriaPresupuesto>) => void;
  categoria?: CategoriaPresupuesto | null;
  hasCubierto: boolean;
}

export default function BudgetCategoryModal({ open, onClose, onSave, categoria, hasCubierto }: BudgetCategoryModalProps) {
  const [nombre, setNombre] = useState('');
  const [costeEstimado, setCosteEstimado] = useState('');
  const [estadoPago, setEstadoPago] = useState<EstadoPago>('sin_pagar');
  const [cantidadPagada, setCantidadPagada] = useState('');
  const [notas, setNotas] = useState('');
  const [esCubierto, setEsCubierto] = useState(false);
  const [precioPorCubierto, setPrecioPorCubierto] = useState('');

  useEffect(() => {
    if (categoria) {
      setNombre(categoria.nombre);
      setCosteEstimado(categoria.costeEstimado.toString());
      setEstadoPago(categoria.estadoPago);
      setCantidadPagada(categoria.cantidadPagada.toString());
      setNotas(categoria.notas);
      setEsCubierto(categoria.esCubierto);
      setPrecioPorCubierto(categoria.precioPorCubierto?.toString() || '');
    } else {
      setNombre('');
      setCosteEstimado('');
      setEstadoPago('sin_pagar');
      setCantidadPagada('');
      setNotas('');
      setEsCubierto(false);
      setPrecioPorCubierto('');
    }
  }, [categoria, open]);

  if (!open) return null;

  const canSetCubierto = !hasCubierto || categoria?.esCubierto;

  const handleSave = () => {
    if (!nombre.trim()) return;
    const coste = parseFloat(costeEstimado) || 0;
    const pagada = parseFloat(cantidadPagada) || 0;

    onSave({
      ...(categoria ? { id: categoria.id } : {}),
      nombre: nombre.trim().slice(0, 80),
      costeEstimado: esCubierto ? 0 : Math.max(0, coste),
      estadoPago,
      cantidadPagada: Math.max(0, pagada),
      notas: notas.trim().slice(0, 500),
      esCubierto,
      precioPorCubierto: esCubierto ? Math.max(0, parseFloat(precioPorCubierto) || 0) : null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            {categoria ? 'Editar categoría' : 'Nueva categoría'}
          </h3>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-white/70">Nombre *</Label>
            <Input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Músicos, Hacienda, Bus..."
              maxLength={80}
              className="mt-1 bg-white/5 border-white/10 text-white"
              autoFocus
            />
          </div>

          {canSetCubierto && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="esCubierto"
                checked={esCubierto}
                onCheckedChange={(checked) => setEsCubierto(!!checked)}
              />
              <Label htmlFor="esCubierto" className="text-white/70 text-sm cursor-pointer">
                Es precio por cubierto (se multiplica × asistentes confirmados)
              </Label>
            </div>
          )}

          {esCubierto ? (
            <div>
              <Label className="text-white/70">Precio por cubierto (€)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={precioPorCubierto}
                onChange={e => setPrecioPorCubierto(e.target.value)}
                placeholder="Ej: 85.00"
                className="mt-1 bg-white/5 border-white/10 text-white"
              />
            </div>
          ) : (
            <div>
              <Label className="text-white/70">Coste estimado (€)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={costeEstimado}
                onChange={e => setCosteEstimado(e.target.value)}
                placeholder="Ej: 2000.00"
                className="mt-1 bg-white/5 border-white/10 text-white"
              />
            </div>
          )}

          <div>
            <Label className="text-white/70">Estado de pago</Label>
            <Select value={estadoPago} onValueChange={(v) => setEstadoPago(v as EstadoPago)}>
              <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(ESTADO_PAGO_CONFIG) as [EstadoPago, { label: string }][]).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white/70">Cantidad pagada (€)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={cantidadPagada}
              onChange={e => setCantidadPagada(e.target.value)}
              placeholder="0.00"
              className="mt-1 bg-white/5 border-white/10 text-white"
            />
          </div>

          <div>
            <Label className="text-white/70">Notas</Label>
            <Textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Notas adicionales..."
              maxLength={500}
              rows={2}
              className="mt-1 bg-white/5 border-white/10 text-white resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1 border-white/10 text-white/70">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!nombre.trim()} className="flex-1">
            {categoria ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      </div>
    </div>
  );
}
