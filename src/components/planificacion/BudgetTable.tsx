import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { CategoriaPresupuesto, ESTADO_PAGO_CONFIG } from '@/types/planificacion';
import { nanoid } from 'nanoid';
import BudgetCategoryModal from './BudgetCategoryModal';

interface BudgetTableProps {
  categorias: CategoriaPresupuesto[];
  onCategoriasChange: (categorias: CategoriaPresupuesto[]) => void;
  asistentesConfirmados: number;
}

export default function BudgetTable({ categorias, onCategoriasChange, asistentesConfirmados }: BudgetTableProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaPresupuesto | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [excluidas, setExcluidas] = useState<Set<string>>(new Set());

  const hasCubierto = categorias.some(c => c.esCubierto);

  const categoriasConCalculo = useMemo(() => {
    return categorias.map(c => {
      if (c.esCubierto && c.precioPorCubierto != null) {
        return { ...c, costeEstimado: c.precioPorCubierto * asistentesConfirmados };
      }
      return c;
    });
  }, [categorias, asistentesConfirmados]);

  const totales = useMemo(() => {
    const incluidas = categoriasConCalculo.filter(c => !excluidas.has(c.id));
    const estimado = incluidas.reduce((sum, c) => sum + c.costeEstimado, 0);
    const pagado = incluidas.reduce((sum, c) => sum + c.cantidadPagada, 0);
    return { estimado, pagado, pendiente: estimado - pagado };
  }, [categoriasConCalculo, excluidas]);

  function toggleIncluida(id: string) {
    setExcluidas(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const progreso = totales.estimado > 0 ? (totales.pagado / totales.estimado) * 100 : 0;

  function handleAdd() {
    setEditingCategoria(null);
    setModalOpen(true);
  }

  function handleEdit(cat: CategoriaPresupuesto) {
    setEditingCategoria(cat);
    setModalOpen(true);
  }

  function handleDelete(id: string) {
    if (deleteConfirm === id) {
      onCategoriasChange(categorias.filter(c => c.id !== id));
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  }

  function handleSave(data: Partial<CategoriaPresupuesto>) {
    const now = new Date().toISOString();
    if (data.id) {
      onCategoriasChange(categorias.map(c =>
        c.id === data.id ? {
          ...c,
          ...data,
          fechaUltimoPago: (data.cantidadPagada && data.cantidadPagada > 0) ? now : c.fechaUltimoPago,
        } as CategoriaPresupuesto : c
      ));
    } else {
      const newCat: CategoriaPresupuesto = {
        id: nanoid(10),
        nombre: data.nombre || '',
        costeEstimado: data.costeEstimado || 0,
        estadoPago: data.estadoPago || 'sin_pagar',
        cantidadPagada: data.cantidadPagada || 0,
        fechaUltimoPago: (data.cantidadPagada && data.cantidadPagada > 0) ? now : null,
        notas: data.notas || '',
        esCubierto: data.esCubierto || false,
        precioPorCubierto: data.precioPorCubierto ?? null,
        orden: categorias.length,
      };
      onCategoriasChange([...categorias, newCat]);
    }
  }

  function formatEuro(n: number) {
    return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  }

  return (
    <>
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-white/60 mb-2">
          <span>Pagado: {formatEuro(totales.pagado)}</span>
          <span>Total estimado: {formatEuro(totales.estimado)}</span>
        </div>
        <Progress value={progreso} className="h-3" />
        <p className="text-xs text-white/40 mt-1 text-right">
          Pendiente: {formatEuro(totales.pendiente)}
        </p>
      </div>

      {/* Table */}
      {categoriasConCalculo.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-white/40 mb-4">No hay categorías de presupuesto</p>
          <Button onClick={handleAdd} size="sm">
            <Plus className="w-4 h-4 mr-2" /> Añadir categoría
          </Button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/50 text-left">
                  <th className="pb-3 font-medium w-8"></th>
                  <th className="pb-3 font-medium">Categoría</th>
                  <th className="pb-3 font-medium text-right">Estimado</th>
                  <th className="pb-3 font-medium text-right">Pagado</th>
                  <th className="pb-3 font-medium text-right">Falta</th>
                  <th className="pb-3 font-medium text-center">Estado</th>
                  <th className="pb-3 font-medium text-right">Último pago</th>
                  <th className="pb-3 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody>
                {categoriasConCalculo.map(cat => {
                  const estadoConfig = ESTADO_PAGO_CONFIG[cat.estadoPago];
                  const incluida = !excluidas.has(cat.id);
                  return (
                    <tr key={cat.id} className={`border-b border-white/5 hover:bg-white/5 ${!incluida ? 'opacity-40' : ''}`}>
                      <td className="py-3 pr-2">
                        <Checkbox
                          checked={incluida}
                          onCheckedChange={() => toggleIncluida(cat.id)}
                        />
                      </td>
                      <td className="py-3 text-white">
                        {cat.nombre}
                        {cat.esCubierto && (
                          <span className="ml-2 text-xs text-white/40">
                            ({cat.precioPorCubierto}€ × {asistentesConfirmados})
                          </span>
                        )}
                        {cat.notas && (
                          <p className="text-xs text-white/30 mt-0.5">{cat.notas}</p>
                        )}
                      </td>
                      <td className="py-3 text-white/80 text-right font-mono">
                        {formatEuro(cat.costeEstimado)}
                      </td>
                      <td className="py-3 text-white/80 text-right font-mono">
                        {formatEuro(cat.cantidadPagada)}
                      </td>
                      <td className="py-3 text-red-300/80 text-right font-mono">
                        {formatEuro(cat.costeEstimado - cat.cantidadPagada)}
                      </td>
                      <td className="py-3 text-center">
                        <Badge variant="outline" className={`text-xs ${estadoConfig.color}`}>
                          {estadoConfig.label}
                        </Badge>
                      </td>
                      <td className="py-3 text-white/40 text-right text-xs">
                        {cat.fechaUltimoPago
                          ? new Date(cat.fechaUltimoPago).toLocaleDateString('es-ES')
                          : '—'}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => handleEdit(cat)} className="p-1 text-white/40 hover:text-white/80">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id)}
                            className={`p-1 ${deleteConfirm === cat.id ? 'text-red-400' : 'text-white/40 hover:text-red-400'}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/20 font-semibold">
                  <td className="pt-3"></td>
                  <td className="pt-3 text-white">
                    TOTAL
                    {excluidas.size > 0 && (
                      <span className="ml-2 text-xs text-white/50 font-normal">
                        ({categoriasConCalculo.length - excluidas.size} de {categoriasConCalculo.length})
                      </span>
                    )}
                  </td>
                  <td className="pt-3 text-white text-right font-mono">{formatEuro(totales.estimado)}</td>
                  <td className="pt-3 text-white text-right font-mono">{formatEuro(totales.pagado)}</td>
                  <td className="pt-3 text-red-300 text-right font-mono">{formatEuro(totales.pendiente)}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-4">
            <Button onClick={handleAdd} variant="outline" size="sm" className="border-white/10 text-black">
              <Plus className="w-4 h-4 mr-2" /> Añadir categoría
            </Button>
          </div>
        </>
      )}

      <BudgetCategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        categoria={editingCategoria}
        hasCubierto={hasCubierto && !editingCategoria?.esCubierto}
      />
    </>
  );
}
