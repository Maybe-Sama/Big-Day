import { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
  DragOverlay,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { nanoid } from 'nanoid';
import { Tarea, ColumnaKanban, COLUMNAS_CONFIG, TipoResponsable } from '@/types/planificacion';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import TaskModal from './TaskModal';

interface KanbanBoardProps {
  tareas: Tarea[];
  onTareasChange: (tareas: Tarea[]) => void;
}

export default function KanbanBoard({ tareas, onTareasChange }: KanbanBoardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTarea, setEditingTarea] = useState<Tarea | null>(null);
  const [activeColumn, setActiveColumn] = useState<ColumnaKanban>('todo');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const collisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;
    return rectIntersection(args);
  };

  const tareasOrdenadas = useMemo(() => {
    const byColumn: Record<ColumnaKanban, Tarea[]> = { todo: [], in_progress: [], done: [] };
    [...tareas].sort((a, b) => a.orden - b.orden).forEach(t => {
      byColumn[t.columna].push(t);
    });
    return byColumn;
  }, [tareas]);

  const responsablesSugeridos = useMemo(() => {
    const set = new Set(tareas.map(t => t.responsable).filter(Boolean));
    return Array.from(set);
  }, [tareas]);

  const activeTarea = activeId ? tareas.find(t => t.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(_event: DragOverEvent) {
    // Visual feedback only - actual move happens in handleDragEnd
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeTarea = tareas.find(t => t.id === active.id);
    if (!activeTarea) return;

    // Determine target column
    let targetColumn: ColumnaKanban;
    const overTarea = tareas.find(t => t.id === over.id);
    if (overTarea) {
      targetColumn = overTarea.columna;
    } else if (over.id in COLUMNAS_CONFIG) {
      targetColumn = over.id as ColumnaKanban;
    } else {
      return;
    }

    // Move to new column if needed
    let updated = tareas.map(t =>
      t.id === active.id ? { ...t, columna: targetColumn, fechaActualizacion: new Date().toISOString() } : t
    );

    // Reorder within same column if dropping on another task
    if (overTarea && overTarea.columna === targetColumn) {
      const columnTareas = updated
        .filter(t => t.columna === targetColumn)
        .sort((a, b) => a.orden - b.orden);
      const oldIndex = columnTareas.findIndex(t => t.id === active.id);
      const newIndex = columnTareas.findIndex(t => t.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(columnTareas, oldIndex, newIndex);
        updated = updated.map(t => {
          const idx = reordered.findIndex(r => r.id === t.id);
          if (idx !== -1) return { ...t, orden: idx };
          return t;
        });
      }
    }

    // Assign final order for the target column
    const finalColumnTareas = updated
      .filter(t => t.columna === targetColumn)
      .sort((a, b) => a.orden - b.orden);
    updated = updated.map(t => {
      const idx = finalColumnTareas.findIndex(r => r.id === t.id);
      if (idx !== -1) return { ...t, orden: idx };
      return t;
    });

    onTareasChange(updated);
  }

  function handleAddTask(columna: ColumnaKanban) {
    setEditingTarea(null);
    setActiveColumn(columna);
    setModalOpen(true);
  }

  function handleEditTask(tarea: Tarea) {
    setEditingTarea(tarea);
    setActiveColumn(tarea.columna);
    setModalOpen(true);
  }

  function handleDeleteTask(id: string) {
    if (deleteConfirm === id) {
      onTareasChange(tareas.filter(t => t.id !== id));
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  }

  function handleAssign(id: string, tipo: TipoResponsable | null, nombre: string) {
    const now = new Date().toISOString();
    onTareasChange(tareas.map(t =>
      t.id === id
        ? { ...t, responsableTipo: tipo || undefined, responsable: nombre, fechaActualizacion: now }
        : t
    ));
  }

  function handleSaveTask(data: Partial<Tarea> & { columna: ColumnaKanban }) {
    const now = new Date().toISOString();
    if (data.id) {
      // Edit
      onTareasChange(tareas.map(t =>
        t.id === data.id ? { ...t, ...data, fechaActualizacion: now } : t
      ));
    } else {
      // Create
      const newTarea: Tarea = {
        id: nanoid(10),
        titulo: data.titulo || '',
        descripcion: data.descripcion || '',
        responsable: data.responsable || '',
        columna: data.columna,
        orden: tareasOrdenadas[data.columna].length,
        fechaCreacion: now,
        fechaActualizacion: now,
      };
      onTareasChange([...tareas, newTarea]);
    }
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(COLUMNAS_CONFIG) as ColumnaKanban[]).map(col => (
            <KanbanColumn
              key={col}
              columna={col}
              tareas={tareasOrdenadas[col]}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onAssign={handleAssign}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTarea ? (
            <div className="opacity-80">
              <KanbanCard tarea={activeTarea} onEdit={() => {}} onDelete={() => {}} onAssign={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveTask}
        tarea={editingTarea}
        columna={activeColumn}
        responsablesSugeridos={responsablesSugeridos}
      />
    </>
  );
}
