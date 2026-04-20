import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Edit, UserPlus, Check } from 'lucide-react';
import { Tarea, Responsable, getResponsables } from '@/types/planificacion';
import ResponsablesList from './ResponsableAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

const novioImg = '/icono-plan/novio.png';
const noviaImg = '/icono-plan/novia.png';

interface KanbanCardProps {
  tarea: Tarea;
  onEdit: (tarea: Tarea) => void;
  onDelete: (id: string) => void;
  onAssign: (id: string, responsables: Responsable[]) => void;
}

export default function KanbanCard({ tarea, onEdit, onDelete, onAssign }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tarea.id });

  const [otroOpen, setOtroOpen] = useState(false);
  const [otroValue, setOtroValue] = useState('');

  const responsables = getResponsables(tarea);
  const novioActive = responsables.some(r => r.tipo === 'novio');
  const noviaActive = responsables.some(r => r.tipo === 'novia');

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function toggleTipo(tipo: 'novio' | 'novia') {
    const exists = responsables.some(r => r.tipo === tipo);
    const next = exists
      ? responsables.filter(r => r.tipo !== tipo)
      : [...responsables, { tipo, nombre: tipo === 'novio' ? 'Novio' : 'Novia' }];
    onAssign(tarea.id, next);
  }

  function addOtro() {
    const trimmed = otroValue.trim().slice(0, 50);
    if (!trimmed) return;
    const sinTercero = responsables.filter(r => r.tipo !== 'tercero');
    onAssign(tarea.id, [...sinTercero, { tipo: 'tercero', nombre: trimmed }]);
    setOtroValue('');
    setOtroOpen(false);
  }

  function limpiar() {
    onAssign(tarea.id, []);
  }

  const terceroExistente = responsables.find(r => r.tipo === 'tercero');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white/5 border border-white/10 rounded-lg p-3 group hover:border-white/20 transition-colors ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 text-white/30 hover:text-white/60 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white truncate">{tarea.titulo}</h4>
          {tarea.descripcion && (
            <p className="text-xs text-white/50 mt-1 line-clamp-2">{tarea.descripcion}</p>
          )}
          {responsables.length > 0 && (
            <div className="mt-2">
              <ResponsablesList responsables={responsables} />
            </div>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 text-white/40 hover:text-white/80"
                title="Asignar responsable"
              >
                <UserPlus className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem
                onSelect={e => { e.preventDefault(); toggleTipo('novio'); }}
                className="gap-2 cursor-pointer"
              >
                <img src={novioImg} alt="Novio" className="w-6 h-6 rounded-full object-cover" />
                <span className="flex-1">Novio</span>
                {novioActive && <Check className="w-4 h-4 text-green-400" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={e => { e.preventDefault(); toggleTipo('novia'); }}
                className="gap-2 cursor-pointer"
              >
                <img src={noviaImg} alt="Novia" className="w-6 h-6 rounded-full object-cover" />
                <span className="flex-1">Novia</span>
                {noviaActive && <Check className="w-4 h-4 text-green-400" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {otroOpen ? (
                <div className="p-2">
                  <Input
                    value={otroValue}
                    onChange={e => setOtroValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addOtro();
                      } else if (e.key === 'Escape') {
                        setOtroOpen(false);
                        setOtroValue('');
                      }
                    }}
                    placeholder="Nombre..."
                    maxLength={50}
                    autoFocus
                    className="h-8 text-sm"
                  />
                </div>
              ) : (
                <DropdownMenuItem
                  onSelect={e => { e.preventDefault(); setOtroOpen(true); setOtroValue(terceroExistente?.nombre || ''); }}
                  className="cursor-pointer"
                >
                  {terceroExistente ? `Otro: ${terceroExistente.nombre}` : 'Añadir otro…'}
                </DropdownMenuItem>
              )}
              {responsables.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={e => { e.preventDefault(); limpiar(); }}
                    className="cursor-pointer text-white/60"
                  >
                    Sin asignar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={() => onEdit(tarea)}
            className="p-1 text-white/40 hover:text-white/80"
            title="Editar"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(tarea.id)}
            className="p-1 text-white/40 hover:text-red-400"
            title="Eliminar"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
