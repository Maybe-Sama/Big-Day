import { useState, useMemo } from 'react';
import { useSeatingEditor } from './SeatingEditorProvider';
import { DraggableGuest } from './DraggableGuest';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export function GuestSidebar() {
  const { unassigned, personas, asignaciones } = useSeatingEditor();
  const [search, setSearch] = useState('');

  const assignedCount = asignaciones.length;
  const totalCount = personas.length;

  // Group linked couples for display
  const displayItems = useMemo(() => {
    const filtered = search
      ? unassigned.filter(p =>
          `${p.nombre} ${p.apellidos}`.toLowerCase().includes(search.toLowerCase())
        )
      : unassigned;

    // Build display list: couples shown as single items
    const seen = new Set<string>();
    const items: Array<{ personas: typeof filtered }> = [];

    for (const p of filtered) {
      if (seen.has(p.personaId)) continue;
      seen.add(p.personaId);

      if (p.parejaId && p.parejaVinculada) {
        const partner = filtered.find(pp => pp.personaId === p.parejaId);
        if (partner && !seen.has(partner.personaId)) {
          seen.add(partner.personaId);
          items.push({ personas: [p, partner] });
          continue;
        }
      }
      items.push({ personas: [p] });
    }

    return items;
  }, [unassigned, search]);

  return (
    <div className="w-72 border-r bg-card flex flex-col shrink-0">
      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar invitado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="p-3 border-b flex gap-2">
        <div className="flex-1 bg-green-500/10 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-green-600">{assignedCount}</div>
          <div className="text-[10px] text-muted-foreground">Asignados</div>
        </div>
        <div className="flex-1 bg-orange-500/10 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-orange-600">{unassigned.length}</div>
          <div className="text-[10px] text-muted-foreground">Sin mesa</div>
        </div>
      </div>

      {/* Header */}
      <div className="px-3 pt-3 pb-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Sin asignar ({unassigned.length})
        </span>
      </div>

      {/* Guest list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {displayItems.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {search ? 'Sin resultados' : 'Todos asignados'}
          </p>
        )}
        {displayItems.map(item => (
          <DraggableGuest
            key={item.personas.map(p => p.personaId).join('+')}
            personas={item.personas}
          />
        ))}
      </div>
    </div>
  );
}
