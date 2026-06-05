import { useState } from 'react';
import { Download, Image, FileText, LayoutList, Armchair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSeatingEditor } from './SeatingEditorProvider';
import { generateSeatingListText } from '@/lib/plano-utils';
import { buildMesaPersonas, getListaMesasPdfHtml } from '@/lib/lista-mesas-pdf';
import { buildSeatingCards } from '@/lib/seating-cards-pdf';
import type { SeatingCard } from '@/lib/seating-cards-pdf';
import SeatingPreviewModal from './SeatingPreviewModal';

export function ExportMenu() {
  const { mesas, asignaciones, personas } = useSeatingEditor();
  const [previewCards, setPreviewCards] = useState<SeatingCard[] | null>(null);

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

  const handleExportListaPdf = () => {
    const mesasPersonas = buildMesaPersonas(mesas, asignaciones, personas);
    const html = getListaMesasPdfHtml(mesasPersonas);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const handleExportSeatingCards = () => {
    const cards = buildSeatingCards(mesas, asignaciones, personas);
    setPreviewCards(cards);
  };

  return (
    <>
    {previewCards && (
      <SeatingPreviewModal
        cards={previewCards}
        onClose={() => setPreviewCards(null)}
      />
    )}
    <div className="absolute bottom-4 left-4 z-20">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 sm:h-8 px-2 sm:px-3 text-xs gap-1.5 bg-card/95 backdrop-blur shadow-md"
            title="Exportar"
          >
            <Download className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleExportImage}>
            <Image className="w-4 h-4 mr-2" />
            Descargar imagen (PNG)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportList}>
            <FileText className="w-4 h-4 mr-2" />
            Descargar listado (TXT)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleExportListaPdf}>
            <LayoutList className="w-4 h-4 mr-2" />
            Lista de mesas (PDF)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportSeatingCards}>
            <Armchair className="w-4 h-4 mr-2" />
            Seating A5 (PDF)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    </>
  );
}
