import { Plus, Undo2, Redo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSeatingEditor } from './SeatingEditorProvider';
import { LegendPopover } from './LegendPopover';

export function CanvasToolbar() {
  const { addTable, undo, redo, canUndo, canRedo } = useSeatingEditor();

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-card/95 backdrop-blur border rounded-xl px-2 py-1.5 shadow-md">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 text-xs gap-1.5"
        onClick={() => addTable('poligonal', 8)}
      >
        <Plus className="w-3.5 h-3.5" />
        Poligonal
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 text-xs gap-1.5"
        onClick={() => addTable('rectangular', 10)}
      >
        <Plus className="w-3.5 h-3.5" />
        Rectangular
      </Button>

      <div className="w-px h-5 bg-border mx-1" />

      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={!canUndo} title="Deshacer (Ctrl+Z)">
        <Undo2 className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={!canRedo} title="Rehacer (Ctrl+Y)">
        <Redo2 className="w-4 h-4" />
      </Button>

      <div className="w-px h-5 bg-border mx-1" />

      <LegendPopover />
    </div>
  );
}
