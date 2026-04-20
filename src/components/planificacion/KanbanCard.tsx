import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Edit } from 'lucide-react';
import { Tarea } from '@/types/planificacion';

interface KanbanCardProps {
  tarea: Tarea;
  onEdit: (tarea: Tarea) => void;
  onDelete: (id: string) => void;
}

export default function KanbanCard({ tarea, onEdit, onDelete }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tarea.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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
          {tarea.responsable && (
            <span className="inline-block mt-2 text-xs bg-white/10 text-white/70 rounded-full px-2 py-0.5">
              {tarea.responsable}
            </span>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(tarea)}
            className="p-1 text-white/40 hover:text-white/80"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(tarea.id)}
            className="p-1 text-white/40 hover:text-red-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
