import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Gift, Search, Users, User, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Donativo } from '@/types/planificacion';
import { GrupoInvitados } from '@/types/invitados';
import { nanoid } from 'nanoid';

interface DonativosPanelProps {
  donativos: Donativo[];
  onDonativosChange: (donativos: Donativo[]) => void;
  grupos: GrupoInvitados[];
}

type SortField = 'fecha' | 'cantidad' | 'nombre';
type SortDir = 'asc' | 'desc';

export default function DonativosPanel({ donativos, onDonativosChange, grupos }: DonativosPanelProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDonativo, setEditingDonativo] = useState<Donativo | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('fecha');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showSinDonar, setShowSinDonar] = useState(false);

  const totalRecibido = useMemo(() => donativos.reduce((sum, d) => sum + d.cantidad, 0), [donativos]);

  const gruposConDonativo = useMemo(() => {
    const ids = new Set(donativos.map(d => d.grupoId));
    return ids.size;
  }, [donativos]);

  const gruposConfirmados = useMemo(() =>
    grupos.filter(g => g.asistencia === 'confirmado'),
    [grupos]
  );

  const gruposSinDonar = useMemo(() => {
    const idsConDonativo = new Set(donativos.map(d => d.grupoId));
    return gruposConfirmados.filter(g => !idsConDonativo.has(g.id));
  }, [gruposConfirmados, donativos]);

  const donativosFiltrados = useMemo(() => {
    let filtered = [...donativos];
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(d => d.nombreDisplay.toLowerCase().includes(q));
    }
    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'fecha') cmp = a.fecha.localeCompare(b.fecha);
      else if (sortField === 'cantidad') cmp = a.cantidad - b.cantidad;
      else cmp = a.nombreDisplay.localeCompare(b.nombreDisplay);
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return filtered;
  }, [donativos, search, sortField, sortDir]);

  function handleAdd() {
    setEditingDonativo(null);
    setModalOpen(true);
  }

  function handleEdit(d: Donativo) {
    setEditingDonativo(d);
    setModalOpen(true);
  }

  function handleDelete(id: string) {
    if (deleteConfirm === id) {
      onDonativosChange(donativos.filter(d => d.id !== id));
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  }

  function handleSave(data: Omit<Donativo, 'id'> & { id?: string }) {
    if (data.id) {
      onDonativosChange(donativos.map(d => d.id === data.id ? { ...d, ...data } as Donativo : d));
    } else {
      onDonativosChange([...donativos, { ...data, id: nanoid(10) } as Donativo]);
    }
  }

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  function formatEuro(n: number) {
    return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'desc'
      ? <ChevronDown className="w-3 h-3 inline ml-0.5" />
      : <ChevronUp className="w-3 h-3 inline ml-0.5" />;
  };

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-white/50 uppercase tracking-wide">Total recibido</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{formatEuro(totalRecibido)}</p>
          <p className="text-xs text-white/40 mt-1">{donativos.length} donativo{donativos.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-white/50 uppercase tracking-wide">Grupos que han dado</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{gruposConDonativo}</p>
          <p className="text-xs text-white/40 mt-1">de {gruposConfirmados.length} confirmados</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-white/50 uppercase tracking-wide">Media por donativo</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            {donativos.length > 0 ? formatEuro(totalRecibido / donativos.length) : '—'}
          </p>
          <p className="text-xs text-white/40 mt-1">
            {gruposSinDonar.length > 0 ? `${gruposSinDonar.length} sin registrar` : 'Todos registrados'}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            className="pl-9 bg-white/5 border-white/10 text-white"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSinDonar(!showSinDonar)}
            className={`border-white/10 text-xs ${showSinDonar ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'text-white/70'}`}
          >
            <Users className="w-3.5 h-3.5 mr-1.5" />
            Sin registrar ({gruposSinDonar.length})
          </Button>
          <Button onClick={handleAdd} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
            <Plus className="w-4 h-4 mr-1.5" /> Nuevo donativo
          </Button>
        </div>
      </div>

      {/* Groups without donation */}
      {showSinDonar && gruposSinDonar.length > 0 && (
        <div className="mb-4 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-300 mb-2">
            Grupos confirmados sin donativo registrado ({gruposSinDonar.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {gruposSinDonar.map(g => (
              <span key={g.id} className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 text-white/60">
                {g.invitadoPrincipal.nombre} {g.invitadoPrincipal.apellidos}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      {donativosFiltrados.length === 0 ? (
        <div className="text-center py-12">
          <Gift className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 mb-4">
            {donativos.length === 0 ? 'No hay donativos registrados' : 'Sin resultados'}
          </p>
          {donativos.length === 0 && (
            <Button onClick={handleAdd} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="w-4 h-4 mr-2" /> Registrar primer donativo
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/50 text-left">
                <th className="pb-3 font-medium cursor-pointer hover:text-white/70" onClick={() => toggleSort('nombre')}>
                  Nombre <SortIcon field="nombre" />
                </th>
                <th className="pb-3 font-medium text-right cursor-pointer hover:text-white/70" onClick={() => toggleSort('cantidad')}>
                  Cantidad <SortIcon field="cantidad" />
                </th>
                <th className="pb-3 font-medium hidden sm:table-cell">Nota</th>
                <th className="pb-3 font-medium text-right cursor-pointer hover:text-white/70 hidden sm:table-cell" onClick={() => toggleSort('fecha')}>
                  Fecha <SortIcon field="fecha" />
                </th>
                <th className="pb-3 font-medium text-right w-20"></th>
              </tr>
            </thead>
            <tbody>
              {donativosFiltrados.map(d => (
                <tr key={d.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 text-white">
                    <div className="flex items-center gap-2">
                      {d.personaId
                        ? <User className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                        : <Users className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                      }
                      <span>{d.nombreDisplay}</span>
                    </div>
                    {/* Mobile: show nota and date inline */}
                    <div className="sm:hidden mt-1">
                      {d.nota && <p className="text-xs text-white/30">{d.nota}</p>}
                      <p className="text-xs text-white/30">{new Date(d.fecha).toLocaleDateString('es-ES')}</p>
                    </div>
                  </td>
                  <td className="py-3 text-right font-mono text-green-400 font-medium">
                    {formatEuro(d.cantidad)}
                  </td>
                  <td className="py-3 text-white/40 text-xs hidden sm:table-cell max-w-[200px] truncate">
                    {d.nota || '—'}
                  </td>
                  <td className="py-3 text-white/40 text-right text-xs hidden sm:table-cell">
                    {new Date(d.fecha).toLocaleDateString('es-ES')}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => handleEdit(d)} className="p-1 text-white/40 hover:text-white/80">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className={`p-1 ${deleteConfirm === d.id ? 'text-red-400' : 'text-white/40 hover:text-red-400'}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/20 font-semibold">
                <td className="pt-3 text-white">TOTAL</td>
                <td className="pt-3 text-right font-mono text-green-400">{formatEuro(totalRecibido)}</td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {modalOpen && (
        <DonativoModal
          donativo={editingDonativo}
          grupos={grupos}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

/* ── Modal para crear/editar donativo ── */

interface DonativoModalProps {
  donativo: Donativo | null;
  grupos: GrupoInvitados[];
  onSave: (data: Omit<Donativo, 'id'> & { id?: string }) => void;
  onClose: () => void;
}

type SeleccionTipo = 'grupo' | 'persona';

interface OpcionPersona {
  personaId: string;
  grupoId: string;
  nombre: string;
  label: string; // display in list
}

function DonativoModal({ donativo, grupos, onSave, onClose }: DonativoModalProps) {
  const [seleccionTipo, setSeleccionTipo] = useState<SeleccionTipo>(
    donativo?.personaId ? 'persona' : 'grupo'
  );
  const [grupoId, setGrupoId] = useState(donativo?.grupoId || '');
  const [personaId, setPersonaId] = useState(donativo?.personaId || '');
  const [cantidad, setCantidad] = useState(donativo?.cantidad.toString() || '');
  const [nota, setNota] = useState(donativo?.nota || '');
  const [busqueda, setBusqueda] = useState('');

  // Build flat person list
  const personasList = useMemo((): OpcionPersona[] => {
    const list: OpcionPersona[] = [];
    for (const g of grupos) {
      // Principal
      list.push({
        personaId: `${g.id}:principal`,
        grupoId: g.id,
        nombre: `${g.invitadoPrincipal.nombre} ${g.invitadoPrincipal.apellidos}`.trim(),
        label: `${g.invitadoPrincipal.nombre} ${g.invitadoPrincipal.apellidos}`.trim(),
      });
      // Acompanantes
      for (const ac of g.acompanantes) {
        list.push({
          personaId: `${g.id}:${ac.id}`,
          grupoId: g.id,
          nombre: `${ac.nombre} ${ac.apellidos}`.trim(),
          label: `${ac.nombre} ${ac.apellidos}`.trim() + ` (de ${g.invitadoPrincipal.nombre})`,
        });
      }
    }
    return list;
  }, [grupos]);

  const gruposFiltrados = useMemo(() => {
    if (!busqueda.trim()) return grupos;
    const q = busqueda.toLowerCase();
    return grupos.filter(g => {
      const nombre = `${g.invitadoPrincipal.nombre} ${g.invitadoPrincipal.apellidos}`.toLowerCase();
      return nombre.includes(q);
    });
  }, [grupos, busqueda]);

  const personasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return personasList;
    const q = busqueda.toLowerCase();
    return personasList.filter(p => p.nombre.toLowerCase().includes(q));
  }, [personasList, busqueda]);

  function getNombreDisplay(): string {
    if (seleccionTipo === 'grupo') {
      const g = grupos.find(g => g.id === grupoId);
      if (!g) return '';
      const nombre = `${g.invitadoPrincipal.nombre} ${g.invitadoPrincipal.apellidos}`.trim();
      const total = 1 + g.acompanantes.length;
      return total > 1 ? `${nombre} (+${total - 1})` : nombre;
    } else {
      const p = personasList.find(p => p.personaId === personaId);
      return p?.nombre || '';
    }
  }

  function handleSubmit() {
    const cantidadNum = parseFloat(cantidad) || 0;
    if (cantidadNum <= 0) return;

    const selectedGrupoId = seleccionTipo === 'persona'
      ? personasList.find(p => p.personaId === personaId)?.grupoId || ''
      : grupoId;

    if (!selectedGrupoId) return;

    onSave({
      ...(donativo ? { id: donativo.id } : {}),
      grupoId: selectedGrupoId,
      personaId: seleccionTipo === 'persona' ? personaId : undefined,
      nombreDisplay: getNombreDisplay(),
      cantidad: cantidadNum,
      nota: nota.trim().slice(0, 500),
      fecha: donativo?.fecha || new Date().toISOString(),
    });
    onClose();
  }

  const isValid = (seleccionTipo === 'grupo' ? !!grupoId : !!personaId) && (parseFloat(cantidad) || 0) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-green-400" />
            {donativo ? 'Editar donativo' : 'Nuevo donativo'}
          </h3>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Tipo de seleccion */}
          <div>
            <Label className="text-white/70 mb-2 block">Asignar a</Label>
            <div className="flex gap-2">
              <button
                onClick={() => { setSeleccionTipo('grupo'); setPersonaId(''); }}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                  seleccionTipo === 'grupo'
                    ? 'border-blue-500/50 bg-blue-500/10 text-blue-300'
                    : 'border-white/10 text-white/50 hover:border-white/20'
                }`}
              >
                <Users className="w-4 h-4" /> Grupo
              </button>
              <button
                onClick={() => { setSeleccionTipo('persona'); setGrupoId(''); }}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                  seleccionTipo === 'persona'
                    ? 'border-purple-500/50 bg-purple-500/10 text-purple-300'
                    : 'border-white/10 text-white/50 hover:border-white/20'
                }`}
              >
                <User className="w-4 h-4" /> Persona
              </button>
            </div>
          </div>

          {/* Busqueda */}
          <div>
            <Label className="text-white/70">
              {seleccionTipo === 'grupo' ? 'Seleccionar grupo' : 'Seleccionar persona'}
            </Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <Input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar..."
                className="pl-9 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="mt-2 max-h-48 overflow-y-auto border border-white/10 rounded-lg bg-white/5 divide-y divide-white/5">
              {seleccionTipo === 'grupo' ? (
                gruposFiltrados.length === 0 ? (
                  <p className="text-center text-white/30 text-sm py-3">Sin resultados</p>
                ) : (
                  gruposFiltrados.map(g => {
                    const nombre = `${g.invitadoPrincipal.nombre} ${g.invitadoPrincipal.apellidos}`.trim();
                    const miembros = g.acompanantes.map(a => a.nombre).filter(Boolean);
                    const selected = grupoId === g.id;
                    return (
                      <button
                        key={g.id}
                        onClick={() => setGrupoId(g.id)}
                        className={`w-full text-left px-3 py-2.5 transition-colors ${
                          selected ? 'bg-blue-500/15' : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            selected ? 'bg-blue-400' : 'bg-white/20'
                          }`} />
                          <span className={`text-sm font-medium ${selected ? 'text-blue-300' : 'text-white/80'}`}>
                            {nombre}
                          </span>
                        </div>
                        {miembros.length > 0 && (
                          <p className="text-xs text-white/30 ml-4 mt-0.5">
                            con {miembros.join(', ')}
                          </p>
                        )}
                      </button>
                    );
                  })
                )
              ) : (
                personasFiltradas.length === 0 ? (
                  <p className="text-center text-white/30 text-sm py-3">Sin resultados</p>
                ) : (
                  personasFiltradas.map(p => {
                    const selected = personaId === p.personaId;
                    return (
                      <button
                        key={p.personaId}
                        onClick={() => setPersonaId(p.personaId)}
                        className={`w-full text-left px-3 py-2.5 transition-colors ${
                          selected ? 'bg-purple-500/15' : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            selected ? 'bg-purple-400' : 'bg-white/20'
                          }`} />
                          <span className={`text-sm ${selected ? 'text-purple-300 font-medium' : 'text-white/70'}`}>
                            {p.label}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )
              )}
            </div>
          </div>

          {/* Cantidad */}
          <div>
            <Label className="text-white/70">Cantidad (EUR) *</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={cantidad}
              onChange={e => setCantidad(e.target.value)}
              placeholder="Ej: 150.00"
              className="mt-1 bg-white/5 border-white/10 text-white"
              autoFocus={!!donativo}
            />
          </div>

          {/* Nota */}
          <div>
            <Label className="text-white/70">Nota</Label>
            <Textarea
              value={nota}
              onChange={e => setNota(e.target.value)}
              placeholder="Nota opcional..."
              maxLength={500}
              rows={2}
              className="mt-1 bg-white/5 border-white/10 text-white resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1 border-white/10 text-white/70 hover:text-white">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
            {donativo ? 'Guardar' : 'Registrar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
