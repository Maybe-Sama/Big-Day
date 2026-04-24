import { useSeatingEditor } from './SeatingEditorProvider';
import { Check, Loader2, AlertCircle } from 'lucide-react';

export function AutosaveIndicator() {
  const { saveStatus } = useSeatingEditor();

  const config = {
    saved: { icon: Check, text: 'Guardado', className: 'text-green-600 bg-green-500/10' },
    saving: { icon: Loader2, text: 'Guardando...', className: 'text-yellow-600 bg-yellow-500/10' },
    error: { icon: AlertCircle, text: 'Error al guardar', className: 'text-red-600 bg-red-500/10' },
  }[saveStatus];

  const Icon = config.icon;

  return (
    <div className={`absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${config.className}`}>
      <Icon className={`w-3.5 h-3.5 ${saveStatus === 'saving' ? 'animate-spin' : ''}`} />
      {config.text}
    </div>
  );
}
