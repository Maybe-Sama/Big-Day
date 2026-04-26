import { Plus, Undo2, Redo2, Circle, RectangleHorizontal, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useSeatingEditor } from './SeatingEditorProvider';
import { LegendPopover } from './LegendPopover';

const CAPACIDADES = [4, 6, 8, 10, 12, 15, 20];

export function CanvasToolbar() {
  const { addTable, undo, redo, canUndo, canRedo } = useSeatingEditor();

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-card/95 backdrop-blur border rounded-xl px-2 py-1.5 shadow-md">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 px-2 sm:px-3">
            <Circle className="w-3.5 h-3.5" />
            <Plus className="w-3 h-3" />
            <span className="hidden sm:inline">Poligonal</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className="text-xs">Plazas</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {CAPACIDADES.map(cap => (
            <DropdownMenuItem key={cap} onClick={() => addTable('poligonal', cap)} className="text-sm">
              {cap} plazas
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 px-2 sm:px-3">
            <RectangleHorizontal className="w-3.5 h-3.5" />
            <Plus className="w-3 h-3" />
            <span className="hidden sm:inline">Rectangular</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className="text-xs">Plazas</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {CAPACIDADES.map(cap => (
            <DropdownMenuItem key={cap} onClick={() => addTable('rectangular', cap)} className="text-sm">
              {cap} plazas
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="sm"
        className="h-8 text-xs gap-1.5 px-2 sm:px-3"
        onClick={() => addTable('rectangular', 6, { esNupcial: true, nombre: 'Mesa Nupcial' })}
      >
        <Crown className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Nupcial</span>
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
