import { useState, useMemo } from 'react';
import { useSeatingEditor } from './SeatingEditorProvider';
import { DraggableGuest } from './DraggableGuest';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function GuestSidebar() {
  const { unassigned, personas, asignaciones, grupos, novioDesdeGrupoId, setNovioDesdeGrupo } = useSeatingEditor();
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  const assignedCount = asignaciones.length;

  const displayItems = useMemo(() => {
    const filtered = search
      ? unassigned.filter(p =>
          `${p.nombre} ${p.apellidos}`.toLowerCase().includes(search.toLowerCase())
        )
      : unassigned;

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

  const noviaCount = personas.filter(p => p.lado === 'novia').length;
  const novioCount = personas.filter(p => p.lado === 'novio').length;

  if (collapsed) {
    return (
      <div className="w-10 border-r bg-card flex flex-col items-center py-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCollapsed(false)}
          title="Abrir panel"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </Button>
        <div className="mt-3 flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold text-orange-600">{unassigned.length}</span>
          <span className="text-[8px] text-muted-foreground -rotate-90 whitespace-nowrap mt-2">Sin mesa</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 border-r bg-card flex flex-col shrink-0">
      {/* Header with collapse button */}
      <div className="p-2 border-b flex items-center justify-between">
        <span className="text-xs font-semibold pl-1">Invitados</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCollapsed(true)}
          title="Cerrar panel"
        >
          <PanelLeftClose className="w-4 h-4" />
        </Button>
      </div>

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
        <div className="flex-1 bg-pink-500/10 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-pink-600">{noviaCount}</div>
          <div className="text-[10px] text-muted-foreground">Novia</div>
        </div>
        <div className="flex-1 bg-blue-500/10 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-blue-600">{novioCount}</div>
          <div className="text-[10px] text-muted-foreground">Novio</div>
        </div>
      </div>

      {/* Novio divider selector */}
      <div className="p-3 border-b">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          Novio desde
        </Label>
        <Select
          value={novioDesdeGrupoId || 'none'}
          onValueChange={(v) => setNovioDesdeGrupo(v === 'none' ? undefined : v)}
        >
          <SelectTrigger className="h-8 text-xs mt-1">
            <SelectValue placeholder="Todos son de la novia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Todos novia (sin corte)</SelectItem>
            {grupos.map(g => (
              <SelectItem key={g.id} value={g.id}>
                {g.invitadoPrincipal.nombre} {g.invitadoPrincipal.apellidos}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
