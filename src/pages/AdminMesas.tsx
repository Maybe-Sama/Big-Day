import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SeatingEditorProvider, useSeatingEditor } from '@/components/seating/SeatingEditorProvider';
import { SeatingDndProvider } from '@/components/seating/SeatingDndProvider';
import { GuestSidebar } from '@/components/seating/GuestSidebar';
import { SeatingCanvas } from '@/components/seating/SeatingCanvas';
import { CanvasToolbar } from '@/components/seating/CanvasToolbar';
import { ZoomControls } from '@/components/seating/ZoomControls';
import { AutosaveIndicator } from '@/components/seating/AutosaveIndicator';
import { ExportMenu } from '@/components/seating/ExportMenu';

function EditorContent() {
  const navigate = useNavigate();
  const { isLoading } = useSeatingEditor();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando plano de mesas...</p>
        </div>
      </div>
    );
  }

  return (
    <SeatingDndProvider>
      <div className="h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="h-12 border-b flex items-center px-4 gap-3 shrink-0 bg-card">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate('/admin/oculto')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-sm font-semibold">Plano de Mesas</h1>
        </header>

        {/* Main layout */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          <GuestSidebar />
          <div className="flex-1 relative min-h-0">
            <CanvasToolbar />
            <AutosaveIndicator />
            <SeatingCanvas />
            <ZoomControls />
            <ExportMenu />
          </div>
        </div>
      </div>
    </SeatingDndProvider>
  );
}

export default function AdminMesas() {
  return (
    <SeatingEditorProvider>
      <EditorContent />
    </SeatingEditorProvider>
  );
}
