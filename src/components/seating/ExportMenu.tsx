import { Download, Image, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSeatingEditor } from './SeatingEditorProvider';
import { generateSeatingListText } from '@/lib/plano-utils';

export function ExportMenu() {
  const { mesas, asignaciones, personas } = useSeatingEditor();

  const handleExportImage = async () => {
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = document.getElementById('seating-canvas-viewport');
      if (!canvas) return;
      const result = await html2canvas(canvas, {
        backgroundColor: null,
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = 'plano-mesas.png';
      link.href = result.toDataURL('image/png');
      link.click();
    } catch {
      // html2canvas not installed, fallback
      alert('Error al exportar imagen. Instala html2canvas: pnpm add html2canvas');
    }
  };

  const handleExportList = () => {
    const text = generateSeatingListText(mesas, asignaciones, personas);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.download = 'listado-mesas.txt';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="absolute bottom-4 left-4 z-20">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 bg-card/95 backdrop-blur shadow-md">
            <Download className="w-3.5 h-3.5" />
            Exportar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleExportImage}>
            <Image className="w-4 h-4 mr-2" />
            Descargar imagen (PNG)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportList}>
            <FileText className="w-4 h-4 mr-2" />
            Descargar listado
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
