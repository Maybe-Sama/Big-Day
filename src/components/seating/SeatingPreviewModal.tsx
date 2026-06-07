import { useState, useEffect } from 'react';
import { X, GripVertical, FileDown, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SeatingCard, getSeatingCardsPdfHtml } from '@/lib/seating-cards-pdf';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Orden guardado: { [mesaNumero]: string[] de nombres }
type OrdenGuardado = Record<string, string[]>;

interface SeatingPreviewModalProps {
  cards: SeatingCard[];
  onClose: () => void;
}

/** Aplica el orden guardado a las cards, manteniendo nuevos al final y eliminando los que ya no estan */
function applyOrden(cards: SeatingCard[], orden: OrdenGuardado): SeatingCard[] {
  return cards.map(card => {
    const key = `${card.label}-${card.numero}`;
    const savedOrder = orden[key];
    if (!savedOrder || savedOrder.length === 0) return card;

    const remaining = new Set(card.nombres);
    const ordered: string[] = [];

    // Primero los que estan en el orden guardado y siguen existiendo
    for (const nombre of savedOrder) {
      if (remaining.has(nombre)) {
        ordered.push(nombre);
        remaining.delete(nombre);
      }
    }

    // Luego los nuevos que no estaban en el orden guardado
    for (const nombre of card.nombres) {
      if (remaining.has(nombre)) {
        ordered.push(nombre);
      }
    }

    return { ...card, nombres: ordered };
  });
}

function buildOrden(cards: SeatingCard[]): OrdenGuardado {
  const orden: OrdenGuardado = {};
  for (const card of cards) {
    orden[`${card.label}-${card.numero}`] = [...card.nombres];
  }
  return orden;
}

// --- Sortable name item ---

interface SortableNameProps {
  id: string;
  nombre: string;
  index: number;
}

function SortableName({ id, nombre, index }: SortableNameProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isSorting ? transition : undefined,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 bg-white/5 rounded px-2 py-1.5 group/item ${
        isDragging ? 'z-10 shadow-lg ring-1 ring-amber-400/40' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="text-white/25 hover:text-white/60 cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <span className="text-xs text-white/20 w-4 text-right select-none">{index + 1}</span>
      <span className="text-sm text-white/80 flex-1 select-none">{nombre}</span>
    </div>
  );
}

// --- Drag overlay (the ghost that follows the cursor) ---

function DragOverlayItem({ nombre }: { nombre: string }) {
  return (
    <div className="flex items-center gap-2 bg-[#1a1a2e] border border-amber-400/50 rounded px-2 py-1.5 shadow-xl">
      <GripVertical className="w-3.5 h-3.5 text-amber-400/60" />
      <span className="text-sm text-white/90 select-none">{nombre}</span>
    </div>
  );
}

export default function SeatingPreviewModal({ cards: initialCards, onClose }: SeatingPreviewModalProps) {
  const [cards, setCards] = useState<SeatingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeNombre, setActiveNombre] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  // Cargar orden guardado al abrir
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/config?kind=seating-orden`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === 'object') {
            setCards(applyOrden(initialCards, data as OrdenGuardado));
            setLoading(false);
            return;
          }
        }
      } catch { /* ignore */ }
      setCards(initialCards.map(c => ({ ...c, nombres: [...c.nombres] })));
      setLoading(false);
    })();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const orden = buildOrden(cards);
      await fetch(`${API_BASE}/config?kind=seating-orden`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orden),
      });
      setDirty(false);
    } catch { /* ignore */ }
    setSaving(false);
  }

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as string;
    // id format: "cardIdx-nameIdx"
    const [ciStr, niStr] = id.split('-');
    const ci = parseInt(ciStr);
    const ni = parseInt(niStr);
    if (!isNaN(ci) && !isNaN(ni) && cards[ci]) {
      setActiveNombre(cards[ci].nombres[ni] ?? null);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveNombre(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const [activeCard, activeIdx] = (active.id as string).split('-').map(Number);
    const [overCard, overIdx] = (over.id as string).split('-').map(Number);

    // Only allow reordering within the same card/mesa
    if (activeCard !== overCard) return;

    setCards(prev => prev.map((card, ci) => {
      if (ci !== activeCard) return card;
      return { ...card, nombres: arrayMove(card.nombres, activeIdx, overIdx) };
    }));
    setDirty(true);
  }

  function handleGenerate() {
    const html = getSeatingCardsPdfHtml(cards);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <h3 className="text-lg font-semibold text-white">
            Ordenar nombres por mesa
          </h3>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-white/40" />
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 p-4 space-y-4">
            <p className="text-sm text-white/40">
              Arrastra para reordenar. El orden se guarda y se mantiene aunque cambien los invitados.
            </p>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              {cards.map((card, cardIdx) => {
                const mesaName = card.label === 'Nupcial' ? 'Nupcial' : `Mesa ${card.numero}`;
                const itemIds = card.nombres.map((_, ni) => `${cardIdx}-${ni}`);
                return (
                  <div key={cardIdx} className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-amber-300">{mesaName}</span>
                      <span className="text-xs text-white/30">{card.nombres.length} personas</span>
                    </div>
                    <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                      <div className="space-y-0.5">
                        {card.nombres.map((nombre, nameIdx) => (
                          <SortableName
                            key={`${cardIdx}-${nameIdx}`}
                            id={`${cardIdx}-${nameIdx}`}
                            nombre={nombre}
                            index={nameIdx}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </div>
                );
              })}

              <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
                {activeNombre ? <DragOverlayItem nombre={activeNombre} /> : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-white/10 flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="border-white/10 text-black">
            Cerrar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!dirty || saving}
            variant="outline"
            className={`border-white/10 ${dirty ? 'text-amber-400 border-amber-500/30' : 'text-white/30'}`}
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar orden
          </Button>
          <Button onClick={handleGenerate} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white">
            <FileDown className="w-4 h-4 mr-2" /> Generar PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
