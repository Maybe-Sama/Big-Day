import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { MesaConfig, ConfiguracionMesas } from '@/types/mesas';
import { GrupoInvitados } from '@/types/invitados';
import { AsignacionSilla, PlanoMesas, PersonaPlano } from '@/types/plano';
import { apiService } from '@/lib/api-service';
import { flattenGrupos, getUnassignedPersonas, syncGrupoMesas } from '@/lib/plano-utils';
import { nanoid } from 'nanoid';
import { useToast } from '@/hooks/use-toast';

// ── State shape ──

interface SeatingEditorState {
  mesas: MesaConfig[];
  personas: PersonaPlano[];
  asignaciones: AsignacionSilla[];
  grupos: GrupoInvitados[];
  zoom: number;
  panX: number;
  panY: number;
  isLoading: boolean;
  saveStatus: 'saved' | 'saving' | 'error';
  selectedMesaId: string | null;
}

interface HistoryEntry {
  mesas: MesaConfig[];
  asignaciones: AsignacionSilla[];
}

// ── Context interface ──

interface SeatingEditorContextValue extends SeatingEditorState {
  unassigned: PersonaPlano[];
  // Mesa actions
  addTable: (forma: 'poligonal' | 'rectangular', capacidad: number) => void;
  updateTable: (mesaId: string, updates: Partial<MesaConfig>) => void;
  deleteTable: (mesaId: string) => void;
  moveTable: (mesaId: string, x: number, y: number) => void;
  selectTable: (mesaId: string | null) => void;
  // Seat actions
  assignSeat: (personaId: string, mesaId: string, sillaIndex: number) => void;
  unassignSeat: (personaId: string) => void;
  moveSeat: (personaId: string, newMesaId: string, newSillaIndex: number) => void;
  // Couple actions
  toggleParejaLink: (personaId: string) => void;
  // Viewport
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  // History
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  // Persona lookup
  getPersonaById: (id: string) => PersonaPlano | undefined;
  getAssignmentForSeat: (mesaId: string, sillaIndex: number) => AsignacionSilla | undefined;
  getAssignmentForPersona: (personaId: string) => AsignacionSilla | undefined;
}

const SeatingEditorContext = createContext<SeatingEditorContextValue | null>(null);

export function useSeatingEditor() {
  const ctx = useContext(SeatingEditorContext);
  if (!ctx) throw new Error('useSeatingEditor must be used within SeatingEditorProvider');
  return ctx;
}

// ── Provider ──

const MAX_HISTORY = 50;
const AUTOSAVE_DELAY = 3000;

export function SeatingEditorProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  // Core state
  const [mesas, setMesas] = useState<MesaConfig[]>([]);
  const [personas, setPersonas] = useState<PersonaPlano[]>([]);
  const [asignaciones, setAsignaciones] = useState<AsignacionSilla[]>([]);
  const [grupos, setGrupos] = useState<GrupoInvitados[]>([]);
  const [zoom, setZoomState] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [selectedMesaId, setSelectedMesaId] = useState<string | null>(null);

  // History
  const [undoStack, setUndoStack] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);

  // Autosave timer
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef(false);

  // Computed
  const unassigned = useMemo(
    () => getUnassignedPersonas(personas, asignaciones),
    [personas, asignaciones]
  );

  const personaMap = useMemo(
    () => new Map(personas.map(p => [p.personaId, p])),
    [personas]
  );

  // ── Load data ──

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [gruposData, configMesas, plano] = await Promise.all([
        apiService.getAllGrupos(),
        apiService.getConfiguracionMesas(),
        apiService.getPlano(),
      ]);

      setGrupos(gruposData);
      setPersonas(flattenGrupos(gruposData));

      const mesasData = configMesas?.mesas || [];
      // Assign default positions to mesas without x/y
      const mesasWithPositions = mesasData.map((m, i) => ({
        ...m,
        forma: m.forma || 'poligonal' as const,
        x: m.x ?? 100 + (i % 4) * 250,
        y: m.y ?? 100 + Math.floor(i / 4) * 250,
      }));
      setMesas(mesasWithPositions);

      if (plano) {
        setAsignaciones(plano.asignaciones || []);
        setZoomState(plano.zoom || 1);
        setPanX(plano.panX || 0);
        setPanY(plano.panY || 0);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: 'No se pudo cargar el plano', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  // ── Autosave ──

  const triggerAutosave = useCallback(() => {
    isDirtyRef.current = true;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => doSave(), AUTOSAVE_DELAY);
  }, []);

  async function doSave() {
    if (!isDirtyRef.current) return;
    setSaveStatus('saving');
    try {
      // Get current state via refs/callbacks
      const currentMesas = mesasRef.current;
      const currentAsignaciones = asignacionesRef.current;
      const currentGrupos = gruposRef.current;

      // Save plano
      const plano: PlanoMesas = {
        asignaciones: currentAsignaciones,
        zoom: zoomRef.current,
        panX: panXRef.current,
        panY: panYRef.current,
        ultimaActualizacion: new Date().toISOString(),
      };
      await apiService.savePlano(plano);

      // Save mesas config
      const configMesas: ConfiguracionMesas = {
        id: 'config-mesas',
        mesas: currentMesas,
        fechaActualizacion: new Date().toISOString(),
      };
      await apiService.saveConfiguracionMesas(configMesas);

      // Sync grupo.mesa fields
      const updatedGrupos = syncGrupoMesas(currentGrupos, currentAsignaciones);
      const changedGrupos = updatedGrupos.filter((g, i) => g.mesa !== currentGrupos[i]?.mesa);
      for (const g of changedGrupos) {
        await apiService.saveGrupo(g);
      }

      isDirtyRef.current = false;
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  }

  // Refs for latest state (used in async save)
  const mesasRef = useRef(mesas);
  const asignacionesRef = useRef(asignaciones);
  const gruposRef = useRef(grupos);
  const zoomRef = useRef(zoom);
  const panXRef = useRef(panX);
  const panYRef = useRef(panY);

  useEffect(() => { mesasRef.current = mesas; }, [mesas]);
  useEffect(() => { asignacionesRef.current = asignaciones; }, [asignaciones]);
  useEffect(() => { gruposRef.current = grupos; }, [grupos]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panXRef.current = panX; }, [panX]);
  useEffect(() => { panYRef.current = panY; }, [panY]);

  // ── History helpers ──

  function pushHistory() {
    setUndoStack(prev => {
      const entry: HistoryEntry = {
        mesas: mesasRef.current,
        asignaciones: asignacionesRef.current,
      };
      const next = [...prev, entry];
      if (next.length > MAX_HISTORY) next.shift();
      return next;
    });
    setRedoStack([]);
  }

  const undo = useCallback(() => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev;
      const newStack = [...prev];
      const entry = newStack.pop()!;
      // Save current to redo
      setRedoStack(r => [...r, { mesas: mesasRef.current, asignaciones: asignacionesRef.current }]);
      setMesas(entry.mesas);
      setAsignaciones(entry.asignaciones);
      triggerAutosave();
      return newStack;
    });
  }, [triggerAutosave]);

  const redo = useCallback(() => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev;
      const newStack = [...prev];
      const entry = newStack.pop()!;
      // Save current to undo
      setUndoStack(u => [...u, { mesas: mesasRef.current, asignaciones: asignacionesRef.current }]);
      setMesas(entry.mesas);
      setAsignaciones(entry.asignaciones);
      triggerAutosave();
      return newStack;
    });
  }, [triggerAutosave]);

  // ── Mesa actions ──

  const addTable = useCallback((forma: 'poligonal' | 'rectangular', capacidad: number) => {
    pushHistory();
    const newMesa: MesaConfig = {
      id: nanoid(8),
      nombre: `Mesa ${mesasRef.current.length + 1}`,
      capacidad,
      forma,
      x: 200 + Math.random() * 200,
      y: 200 + Math.random() * 200,
    };
    setMesas(prev => [...prev, newMesa]);
    triggerAutosave();
  }, [triggerAutosave]);

  const updateTable = useCallback((mesaId: string, updates: Partial<MesaConfig>) => {
    pushHistory();
    setMesas(prev => prev.map(m => m.id === mesaId ? { ...m, ...updates } : m));
    // If capacity decreased, remove excess seat assignments
    if (updates.capacidad !== undefined) {
      setAsignaciones(prev => prev.filter(a => {
        if (a.mesaId !== mesaId) return true;
        return a.sillaIndex < updates.capacidad!;
      }));
    }
    triggerAutosave();
  }, [triggerAutosave]);

  const deleteTable = useCallback((mesaId: string) => {
    pushHistory();
    setMesas(prev => prev.filter(m => m.id !== mesaId));
    setAsignaciones(prev => prev.filter(a => a.mesaId !== mesaId));
    setSelectedMesaId(prev => prev === mesaId ? null : prev);
    triggerAutosave();
  }, [triggerAutosave]);

  const moveTable = useCallback((mesaId: string, x: number, y: number) => {
    // No history for moves (too noisy), just save
    setMesas(prev => prev.map(m => m.id === mesaId ? { ...m, x, y } : m));
    triggerAutosave();
  }, [triggerAutosave]);

  const selectTable = useCallback((mesaId: string | null) => {
    setSelectedMesaId(mesaId);
  }, []);

  // ── Seat actions ──

  const assignSeat = useCallback((personaId: string, mesaId: string, sillaIndex: number) => {
    pushHistory();
    setAsignaciones(prev => {
      // Remove any existing assignment for this persona
      const filtered = prev.filter(a => a.personaId !== personaId);
      // Remove any existing assignment for this seat
      const cleared = filtered.filter(a => !(a.mesaId === mesaId && a.sillaIndex === sillaIndex));
      return [...cleared, { mesaId, sillaIndex, personaId }];
    });
    triggerAutosave();
  }, [triggerAutosave]);

  const unassignSeat = useCallback((personaId: string) => {
    pushHistory();
    setAsignaciones(prev => prev.filter(a => a.personaId !== personaId));
    triggerAutosave();
  }, [triggerAutosave]);

  const moveSeat = useCallback((personaId: string, newMesaId: string, newSillaIndex: number) => {
    pushHistory();
    setAsignaciones(prev => {
      const filtered = prev.filter(a => a.personaId !== personaId);
      const cleared = filtered.filter(a => !(a.mesaId === newMesaId && a.sillaIndex === newSillaIndex));
      return [...cleared, { mesaId: newMesaId, sillaIndex: newSillaIndex, personaId }];
    });
    triggerAutosave();
  }, [triggerAutosave]);

  // ── Couple toggle ──

  const toggleParejaLink = useCallback((personaId: string) => {
    setPersonas(prev => prev.map(p => {
      if (p.personaId === personaId) {
        return { ...p, parejaVinculada: !p.parejaVinculada };
      }
      // Also toggle the partner
      const persona = prev.find(pp => pp.personaId === personaId);
      if (persona?.parejaId && p.personaId === persona.parejaId) {
        return { ...p, parejaVinculada: !p.parejaVinculada };
      }
      return p;
    }));
  }, []);

  // ── Viewport ──

  const setZoom = useCallback((z: number) => {
    const clamped = Math.max(0.25, Math.min(2, z));
    setZoomState(clamped);
    triggerAutosave();
  }, [triggerAutosave]);

  const setPan = useCallback((x: number, y: number) => {
    setPanX(x);
    setPanY(y);
  }, []);

  // ── Lookups ──

  const getPersonaById = useCallback((id: string) => personaMap.get(id), [personaMap]);

  const getAssignmentForSeat = useCallback(
    (mesaId: string, sillaIndex: number) =>
      asignaciones.find(a => a.mesaId === mesaId && a.sillaIndex === sillaIndex),
    [asignaciones]
  );

  const getAssignmentForPersona = useCallback(
    (personaId: string) => asignaciones.find(a => a.personaId === personaId),
    [asignaciones]
  );

  // ── Keyboard shortcuts ──

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const value: SeatingEditorContextValue = {
    mesas,
    personas,
    asignaciones,
    grupos,
    zoom,
    panX,
    panY,
    isLoading,
    saveStatus,
    selectedMesaId,
    unassigned,
    addTable,
    updateTable,
    deleteTable,
    moveTable,
    selectTable,
    assignSeat,
    unassignSeat,
    moveSeat,
    toggleParejaLink,
    setZoom,
    setPan,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    getPersonaById,
    getAssignmentForSeat,
    getAssignmentForPersona,
  };

  return (
    <SeatingEditorContext.Provider value={value}>
      {children}
    </SeatingEditorContext.Provider>
  );
}
