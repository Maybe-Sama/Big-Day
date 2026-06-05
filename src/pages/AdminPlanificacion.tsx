import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard, CheckSquare, Euro, Gift, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tarea, CategoriaPresupuesto, Donativo } from '@/types/planificacion';
import { GrupoInvitados } from '@/types/invitados';
import PlanDashboard from '@/components/planificacion/PlanDashboard';
import KanbanBoard from '@/components/planificacion/KanbanBoard';
import BudgetTable from '@/components/planificacion/BudgetTable';
import DonativosPanel from '@/components/planificacion/DonativosPanel';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

type Tab = 'dashboard' | 'tareas' | 'presupuesto' | 'donativos';

export default function AdminPlanificacion() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tab, setTab] = useState<Tab>('dashboard');
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [categorias, setCategorias] = useState<CategoriaPresupuesto[]>([]);
  const [donativos, setDonativos] = useState<Donativo[]>([]);
  const [grupos, setGrupos] = useState<GrupoInvitados[]>([]);
  const [asistentesConfirmados, setAsistentesConfirmados] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  // Check session & load data
  useEffect(() => {
    checkSessionAndLoad();
  }, []);

  async function checkSessionAndLoad() {
    try {
      // Verify session by fetching tareas (will 401 if not authenticated)
      const [tareasRes, presupuestoRes, invitadosRes, donativosRes] = await Promise.all([
        fetch(`${API_BASE}/planificacion?action=get-tareas`, { credentials: 'include' }),
        fetch(`${API_BASE}/planificacion?action=get-presupuesto`, { credentials: 'include' }),
        fetch(`${API_BASE}/invitados`, { credentials: 'include' }),
        fetch(`${API_BASE}/planificacion?action=get-donativos`, { credentials: 'include' }),
      ]);

      if (tareasRes.status === 401 || presupuestoRes.status === 401) {
        setIsAuthed(false);
        setIsLoading(false);
        return;
      }

      setIsAuthed(true);

      const tareasData = await tareasRes.json();
      const presupuestoData = await presupuestoRes.json();

      setTareas(Array.isArray(tareasData.tareas) ? tareasData.tareas : []);
      setCategorias(Array.isArray(presupuestoData.categorias) ? presupuestoData.categorias : []);

      if (donativosRes.ok) {
        const donativosData = await donativosRes.json();
        setDonativos(Array.isArray(donativosData.donativos) ? donativosData.donativos : []);
      }

      // Calculate confirmed attendees (same logic as AdminOculto statsPorPersona)
      if (invitadosRes.ok) {
        const gruposData = await invitadosRes.json();
        if (Array.isArray(gruposData)) {
          setGrupos(gruposData);
          let total = 0;
          gruposData.forEach((grupo: any) => {
            if (grupo.invitadoPrincipal?.asistencia === 'confirmado') total++;
            (grupo.acompanantes || []).forEach((ac: any) => {
              if (ac.asistencia === 'confirmado') total++;
            });
          });
          setAsistentesConfirmados(total);
        }
      }
    } catch (error: any) {
      if (error.message?.includes('401') || error.message?.includes('No autorizado')) {
        setIsAuthed(false);
      } else {
        toast({ title: 'Error', description: 'No se pudieron cargar los datos', variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Save tareas to API
  const saveTareas = useCallback(async (newTareas: Tarea[]) => {
    const prev = tareas;
    setTareas(newTareas);
    try {
      const res = await fetch(`${API_BASE}/planificacion?action=save-tareas`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tareas: newTareas }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          toast({ title: 'Sesión expirada', description: 'Redirigiendo al login...', variant: 'destructive' });
          setTimeout(() => navigate('/admin/oculto'), 1500);
          return;
        }
        throw new Error('Error al guardar');
      }
    } catch {
      setTareas(prev);
      toast({ title: 'Error', description: 'No se pudieron guardar las tareas', variant: 'destructive' });
    }
  }, [tareas, toast, navigate]);

  // Save donativos to API
  const saveDonativos = useCallback(async (newDonativos: Donativo[]) => {
    const prev = donativos;
    setDonativos(newDonativos);
    try {
      const res = await fetch(`${API_BASE}/planificacion?action=save-donativos`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donativos: newDonativos }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          toast({ title: 'Sesion expirada', description: 'Redirigiendo al login...', variant: 'destructive' });
          setTimeout(() => navigate('/admin/oculto'), 1500);
          return;
        }
        throw new Error('Error al guardar');
      }
    } catch {
      setDonativos(prev);
      toast({ title: 'Error', description: 'No se pudieron guardar los donativos', variant: 'destructive' });
    }
  }, [donativos, toast, navigate]);

  // Save categorias to API
  const saveCategorias = useCallback(async (newCategorias: CategoriaPresupuesto[]) => {
    const prev = categorias;
    setCategorias(newCategorias);
    try {
      const res = await fetch(`${API_BASE}/planificacion?action=save-presupuesto`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categorias: newCategorias }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          toast({ title: 'Sesión expirada', description: 'Redirigiendo al login...', variant: 'destructive' });
          setTimeout(() => navigate('/admin/oculto'), 1500);
          return;
        }
        throw new Error('Error al guardar');
      }
    } catch {
      setCategorias(prev);
      toast({ title: 'Error', description: 'No se pudo guardar el presupuesto', variant: 'destructive' });
    }
  }, [categorias, toast, navigate]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f23] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-[#0f0f23] flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-white/60">Sesión no válida. Inicia sesión primero.</p>
        <Button onClick={() => navigate('/admin/oculto')} variant="outline" className="border-white/10 text-white/70">
          Ir al panel de admin
        </Button>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
    { id: 'tareas', label: 'Tareas', icon: CheckSquare },
    { id: 'presupuesto', label: 'Presupuesto', icon: Euro },
    { id: 'donativos', label: 'Donativos', icon: Gift },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f23] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0f0f23]/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/oculto')}
              className="text-white/50 hover:text-white flex items-center gap-1 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Panel invitados
            </button>
            <h1 className="text-lg font-semibold font-playfair">Planificación</h1>
          </div>
          <p className="text-xs text-white/40">{asistentesConfirmados} asistentes confirmados</p>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-t-lg transition-colors ${
                  tab === t.id
                    ? 'bg-white/10 text-white border-b-2 border-white/50'
                    : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {tab === 'dashboard' && (
          <PlanDashboard
            tareas={tareas}
            categorias={categorias}
            asistentesConfirmados={asistentesConfirmados}
            donativos={donativos}
          />
        )}
        {tab === 'tareas' && (
          <KanbanBoard tareas={tareas} onTareasChange={saveTareas} />
        )}
        {tab === 'presupuesto' && (
          <BudgetTable
            categorias={categorias}
            onCategoriasChange={saveCategorias}
            asistentesConfirmados={asistentesConfirmados}
            totalDonativos={donativos.reduce((sum, d) => sum + d.cantidad, 0)}
          />
        )}
        {tab === 'donativos' && (
          <DonativosPanel
            donativos={donativos}
            onDonativosChange={saveDonativos}
            grupos={grupos}
          />
        )}
      </div>
    </div>
  );
}
