import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Tarea, ColumnaKanban, COLUMNAS_CONFIG } from '@/types/planificacion';
import KanbanCard from './KanbanCard';

interface KanbanColumnProps {
  columna: ColumnaKanban;
  tareas: Tarea[];
  onAddTask: (columna: ColumnaKanban) => void;
  onEditTask: (tarea: Tarea) => void;
  onDeleteTask: (id: string) => void;
}

export default function KanbanColumn({ columna, tareas, onAddTask, onEditTask, onDeleteTask }: KanbanColumnProps) {
  const config = COLUMNAS_CONFIG[columna];
  const { setNodeRef, isOver } = useDroppable({ id: columna });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border p-3 min-h-[300px] transition-colors ${config.color} ${isOver ? 'ring-2 ring-white/30' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white/80">
          {config.label}
          <span className="ml-2 text-xs text-white/40">({tareas.length})</span>
        </h3>
        <button
          onClick={() => onAddTask(columna)}
          className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white/80 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 space-y-2 min-h-[200px]">
        <SortableContext items={tareas.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tareas.map(tarea => (
            <KanbanCard
              key={tarea.id}
              tarea={tarea}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))}
        </SortableContext>
        {tareas.length === 0 && (
          <p className="text-xs text-white/30 text-center py-8 pointer-events-none">Sin tareas</p>
        )}
      </div>
    </div>
  );
}
