import { useState } from 'react';
import { X, ChevronUp, ChevronDown, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SeatingCard, getSeatingCardsPdfHtml } from '@/lib/seating-cards-pdf';

interface SeatingPreviewModalProps {
  cards: SeatingCard[];
  onClose: () => void;
}

export default function SeatingPreviewModal({ cards: initialCards, onClose }: SeatingPreviewModalProps) {
  const [cards, setCards] = useState<SeatingCard[]>(
    () => initialCards.map(c => ({ ...c, nombres: [...c.nombres] }))
  );

  function moveNombre(cardIdx: number, nameIdx: number, dir: -1 | 1) {
    const newCards = cards.map((c, ci) => {
      if (ci !== cardIdx) return c;
      const nombres = [...c.nombres];
      const targetIdx = nameIdx + dir;
      if (targetIdx < 0 || targetIdx >= nombres.length) return c;
      [nombres[nameIdx], nombres[targetIdx]] = [nombres[targetIdx], nombres[nameIdx]];
      return { ...c, nombres };
    });
    setCards(newCards);
  }

  function handleGenerate() {
    const html = getSeatingCardsPdfHtml(cards);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
    onClose();
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
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          <p className="text-sm text-white/40">
            Usa las flechas para reordenar los nombres dentro de cada mesa. El orden que veas aqui sera el del PDF.
          </p>

          {cards.map((card, cardIdx) => {
            const mesaName = card.label === 'Nupcial' ? 'Nupcial' : `Mesa ${card.numero}`;
            return (
              <div key={cardIdx} className="bg-white/5 border border-white/10 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-amber-300">{mesaName}</span>
                  <span className="text-xs text-white/30">{card.nombres.length} personas</span>
                </div>
                <div className="space-y-0.5">
                  {card.nombres.map((nombre, nameIdx) => (
                    <div
                      key={nameIdx}
                      className="flex items-center gap-2 bg-white/5 rounded px-2 py-1.5 group"
                    >
                      <span className="text-xs text-white/20 w-4 text-right">{nameIdx + 1}</span>
                      <span className="text-sm text-white/80 flex-1">{nombre}</span>
                      <div className="flex gap-0.5 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => moveNombre(cardIdx, nameIdx, -1)}
                          disabled={nameIdx === 0}
                          className="p-0.5 text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveNombre(cardIdx, nameIdx, 1)}
                          disabled={nameIdx === card.nombres.length - 1}
                          className="p-0.5 text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-white/10 flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1 border-white/10 text-black">
            Cancelar
          </Button>
          <Button onClick={handleGenerate} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white">
            <FileDown className="w-4 h-4 mr-2" /> Generar PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
