import { useMemo } from 'react';
import { CheckSquare, Clock, Euro, TrendingDown, Gift } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tarea, CategoriaPresupuesto, Donativo } from '@/types/planificacion';

interface PlanDashboardProps {
  tareas: Tarea[];
  categorias: CategoriaPresupuesto[];
  asistentesConfirmados: number;
  donativos?: Donativo[];
}

export default function PlanDashboard({ tareas, categorias, asistentesConfirmados, donativos = [] }: PlanDashboardProps) {
  const stats = useMemo(() => {
    const tareasPendientes = tareas.filter(t => t.columna === 'todo' || t.columna === 'in_progress').length;
    const tareasHechas = tareas.filter(t => t.columna === 'done').length;

    const categoriasCalc = categorias.map(c => {
      if (c.esCubierto && c.precioPorCubierto != null) {
        return { ...c, costeEstimado: c.precioPorCubierto * asistentesConfirmados };
      }
      return c;
    });

    const estimado = categoriasCalc.reduce((sum, c) => sum + c.costeEstimado, 0);
    const pagado = categoriasCalc.reduce((sum, c) => sum + c.cantidadPagada, 0);
    const totalDonativos = donativos.reduce((sum, d) => sum + d.cantidad, 0);

    return { tareasPendientes, tareasHechas, estimado, pagado, pendiente: estimado - pagado, totalDonativos };
  }, [tareas, categorias, asistentesConfirmados, donativos]);

  function formatEuro(n: number) {
    return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  }

  const cards = [
    {
      title: 'Tareas pendientes',
      value: stats.tareasPendientes.toString(),
      subtitle: `${stats.tareasHechas} completadas`,
      icon: CheckSquare,
      color: stats.tareasPendientes > 0 ? 'text-yellow-400' : 'text-green-400',
    },
    {
      title: 'Presupuesto total',
      value: formatEuro(stats.estimado),
      subtitle: `${categorias.length} categorías`,
      icon: Euro,
      color: 'text-blue-400',
    },
    {
      title: 'Total pagado',
      value: formatEuro(stats.pagado),
      subtitle: stats.estimado > 0
        ? `${Math.round((stats.pagado / stats.estimado) * 100)}% del total`
        : '—',
      icon: Clock,
      color: 'text-green-400',
    },
    {
      title: 'Pendiente de pago',
      value: formatEuro(stats.pendiente),
      subtitle: stats.pendiente > 0 ? 'Por pagar' : 'Todo al dia',
      icon: TrendingDown,
      color: stats.pendiente > 0 ? 'text-red-400' : 'text-green-400',
    },
    {
      title: 'Donativos recibidos',
      value: formatEuro(stats.totalDonativos),
      subtitle: donativos.length > 0
        ? `${donativos.length} donativo${donativos.length !== 1 ? 's' : ''}`
        : 'Sin donativos',
      icon: Gift,
      color: stats.totalDonativos > 0 ? 'text-emerald-400' : 'text-white/40',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, i) => (
        <Card key={i} className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-white/50 uppercase tracking-wide">{card.title}</p>
                <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                <p className="text-xs text-white/40 mt-1">{card.subtitle}</p>
              </div>
              <card.icon className={`w-5 h-5 ${card.color} opacity-50`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
