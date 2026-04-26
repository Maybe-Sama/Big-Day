import { useState, useMemo } from 'react';
import { useSeatingEditor } from './SeatingEditorProvider';
import { DraggableGuest } from './DraggableGuest';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, PanelLeftClose, PanelLeftOpen, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function GuestSidebar() {
  const { unassigned, personas, asignaciones, grupos, novioDesdeGrupoId, setNovioDesdeGrupo } = useSeatingEditor();
  const [search, setSearch] = useState('');
  // Desktop: collapsed (narrow strip) vs expanded
  const [collapsed, setCollapsed] = useState(false);
  // Mobile: overlay open vs closed
  const [mobileOpen, setMobileOpen] = useState(false);

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

  // ── DESKTOP: collapsed strip (md+ only, hidden on mobile) ──
  if (collapsed) {
    return (
      <>
        {/* Mobile floating menu button (when desktop is collapsed and on mobile) */}
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden fixed top-14 left-2 z-30 w-10 h-10 rounded-full bg-card border shadow-md flex items-center justify-center"
          aria-label="Abrir invitados"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Desktop strip — hidden on mobile */}
        <div className="hidden md:flex w-10 border-r bg-card flex-col items-center py-2 shrink-0">
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

        {/* Mobile overlay sidebar */}
        {mobileOpen && (
          <SidebarMobileOverlay
            unassigned={unassigned}
            assignedCount={assignedCount}
            noviaCount={noviaCount}
            novioCount={novioCount}
            grupos={grupos}
            novioDesdeGrupoId={novioDesdeGrupoId}
            setNovioDesdeGrupo={setNovioDesdeGrupo}
            search={search}
            setSearch={setSearch}
            displayItems={displayItems}
            onClose={() => setMobileOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      {/* Desktop sidebar — unchanged on PC; hidden on mobile */}
      <div className="hidden md:flex w-72 border-r bg-card flex-col shrink-0">
        <SidebarContent
          collapsible
          onCollapse={() => setCollapsed(true)}
          unassigned={unassigned}
          assignedCount={assignedCount}
          noviaCount={noviaCount}
          novioCount={novioCount}
          grupos={grupos}
          novioDesdeGrupoId={novioDesdeGrupoId}
          setNovioDesdeGrupo={setNovioDesdeGrupo}
          search={search}
          setSearch={setSearch}
          displayItems={displayItems}
        />
      </div>

      {/* Mobile floating menu button (when sidebar is closed on mobile) */}
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden fixed top-14 left-2 z-30 w-10 h-10 rounded-full bg-card border shadow-md flex items-center justify-center"
          aria-label="Abrir invitados"
        >
          <Menu className="w-4 h-4" />
        </button>
      )}

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <SidebarMobileOverlay
          unassigned={unassigned}
          assignedCount={assignedCount}
          noviaCount={noviaCount}
          novioCount={novioCount}
          grupos={grupos}
          novioDesdeGrupoId={novioDesdeGrupoId}
          setNovioDesdeGrupo={setNovioDesdeGrupo}
          search={search}
          setSearch={setSearch}
          displayItems={displayItems}
          onClose={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}

// ── Shared content body (used by both PC sidebar and mobile overlay) ──

interface ContentProps {
  collapsible?: boolean;
  onCollapse?: () => void;
  unassigned: ReturnType<typeof useSeatingEditor>['unassigned'];
  assignedCount: number;
  noviaCount: number;
  novioCount: number;
  grupos: ReturnType<typeof useSeatingEditor>['grupos'];
  novioDesdeGrupoId: string | undefined;
  setNovioDesdeGrupo: (id: string | undefined) => void;
  search: string;
  setSearch: (v: string) => void;
  displayItems: Array<{ personas: ReturnType<typeof useSeatingEditor>['personas'] }>;
}

function SidebarContent({
  collapsible, onCollapse, unassigned, assignedCount, noviaCount, novioCount,
  grupos, novioDesdeGrupoId, setNovioDesdeGrupo, search, setSearch, displayItems,
}: ContentProps) {
  return (
    <>
      {/* Header with collapse button — only shown on desktop sidebar */}
      {collapsible && onCollapse && (
        <div className="p-2 border-b flex items-center justify-between">
          <span className="text-xs font-semibold pl-1">Invitados</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onCollapse}
            title="Cerrar panel"
          >
            <PanelLeftClose className="w-4 h-4" />
          </Button>
        </div>
      )}

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
    </>
  );
}

// ── Mobile overlay drawer ──

function SidebarMobileOverlay(props: Omit<ContentProps, 'collapsible' | 'onCollapse'> & { onClose: () => void }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="md:hidden fixed inset-0 bg-black/40 z-40"
        onClick={props.onClose}
      />
      {/* Panel */}
      <div className="md:hidden fixed inset-y-0 left-0 w-[85vw] max-w-sm bg-card border-r z-50 flex flex-col shadow-2xl">
        <div className="p-2 border-b flex items-center justify-between">
          <span className="text-xs font-semibold pl-1">Invitados</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={props.onClose}
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Reuse the rest of the content (no header inside) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <SidebarContent {...props} />
        </div>
      </div>
    </>
  );
}
