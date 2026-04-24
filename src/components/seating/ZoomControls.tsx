import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSeatingEditor } from './SeatingEditorProvider';

export function ZoomControls() {
  const { zoom, setZoom } = useSeatingEditor();

  return (
    <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1 bg-card/95 backdrop-blur border rounded-xl p-1 shadow-md">
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(zoom + 0.1)}>
        <Plus className="w-3.5 h-3.5" />
      </Button>
      <div className="text-[10px] text-center text-muted-foreground font-medium py-0.5">
        {Math.round(zoom * 100)}%
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(zoom - 0.1)}>
        <Minus className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
