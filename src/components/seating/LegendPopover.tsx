import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function LegendPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Leyenda">
          <HelpCircle className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" side="bottom">
        <h4 className="font-semibold text-sm mb-3">Leyenda</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-primary/80 border-2 border-primary flex items-center justify-center text-[7px] text-primary-foreground font-bold">JL</div>
            <span>Silla ocupada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border-2 border-dashed border-muted-foreground/30" />
            <span>Silla libre (soltar aqui)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-pink-400" />
            <span>Pareja (se arrastran juntos)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Individual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-400" />
            <span>Hijo/a</span>
          </div>

          <hr className="my-2" />

          <h4 className="font-semibold text-sm mb-1">Controles</h4>
          <div className="space-y-1">
            <div className="flex justify-between"><span>Arrastrar persona a silla</span><span className="text-muted-foreground">Asignar</span></div>
            <div className="flex justify-between"><span>Arrastrar centro de mesa</span><span className="text-muted-foreground">Mover mesa</span></div>
            <div className="flex justify-between"><span>Click en mesa</span><span className="text-muted-foreground">Editar</span></div>
            <div className="flex justify-between"><span>Scroll rueda</span><span className="text-muted-foreground">Zoom</span></div>
            <div className="flex justify-between"><span>Click + arrastrar fondo</span><span className="text-muted-foreground">Mover vista</span></div>
            <div className="flex justify-between"><span>Ctrl+Z / Ctrl+Y</span><span className="text-muted-foreground">Deshacer / Rehacer</span></div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
