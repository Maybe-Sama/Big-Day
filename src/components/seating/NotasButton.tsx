import { useState } from 'react';
import { StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSeatingEditor } from './SeatingEditorProvider';
import { NotasModal } from './NotasModal';

export function NotasButton() {
  const { notas } = useSeatingEditor();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="absolute bottom-[120px] right-4 z-20">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 bg-card/95 backdrop-blur shadow-md relative"
          onClick={() => setShowModal(true)}
          title="Notas de invitados"
        >
          <StickyNote className="w-4 h-4" />
          {notas.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-900 text-white text-[9px] font-bold flex items-center justify-center">
              {notas.length}
            </span>
          )}
        </Button>
      </div>
      <NotasModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
