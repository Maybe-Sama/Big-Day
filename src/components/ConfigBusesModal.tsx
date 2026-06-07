import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Bus, Trash2, Users, ChevronDown, ChevronUp, User, Baby, Heart, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AppModal } from '@/components/common';
import { ConfiguracionBuses, BusConfig } from '@/types/bus';
import { GrupoInvitados } from '@/types/invitados';
import { contarPasajerosBus, grupoUsaEsteBus } from '@/lib/bus-utils';
import { dbService } from '@/lib/database';
import { getListaBusesPdfHtml, type BusPasajeros } from '@/lib/lista-buses-pdf';

interface ConfigBusesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PasajeroInfo {
  nombre: string;
  tipo: 'principal' | 'pareja' | 'hijo' | 'familiar' | 'otro';
  grupoNombre: string;
}

function getPasajerosBus(grupos: GrupoInvitados[], bus: BusConfig): PasajeroInfo[] {
  const pasajeros: PasajeroInfo[] = [];

  for (const grupo of grupos) {
    if (!grupoUsaEsteBus(grupo, bus)) continue;

    const usaPrincipal = grupo.invitadoPrincipal.confirmacion_bus ?? grupo.confirmacion_bus;
    if (usaPrincipal) {
      pasajeros.push({
        nombre: `${grupo.invitadoPrincipal.nombre} ${grupo.invitadoPrincipal.apellidos}`,
        tipo: 'principal',
        grupoNombre: `${grupo.invitadoPrincipal.nombre} ${grupo.invitadoPrincipal.apellidos}`,
      });
    }

    for (const ac of grupo.acompanantes) {
      const usaAc = ac.confirmacion_bus ?? grupo.confirmacion_bus;
      if (usaAc) {
        const tipo = ac.tipo === 'pareja' ? 'pareja'
          : ac.tipo === 'hijo' ? 'hijo'
          : ['madre', 'padre', 'hermano', 'hermana', 'abuelo', 'abuela', 'tio', 'tia', 'primo', 'prima'].includes(ac.tipo)
            ? 'familiar'
            : 'otro';
        pasajeros.push({
          nombre: `${ac.nombre} ${ac.apellidos}`,
          tipo,
          grupoNombre: `${grupo.invitadoPrincipal.nombre} ${grupo.invitadoPrincipal.apellidos}`,
        });
      }
    }
  }

  return pasajeros;
}

function getTipoIcon(tipo: PasajeroInfo['tipo']) {
  switch (tipo) {
    case 'principal': return <User className="w-3 h-3" />;
    case 'pareja': return <Heart className="w-3 h-3" />;
    case 'hijo': return <Baby className="w-3 h-3" />;
    default: return <User className="w-3 h-3" />;
  }
}

function getTipoBadgeClass(tipo: PasajeroInfo['tipo']) {
  switch (tipo) {
    case 'principal': return 'bg-blue-500/10 text-blue-700 border-blue-200';
    case 'pareja': return 'bg-pink-500/10 text-pink-700 border-pink-200';
    case 'hijo': return 'bg-orange-500/10 text-orange-700 border-orange-200';
    case 'familiar': return 'bg-purple-500/10 text-purple-700 border-purple-200';
    default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
  }
}

const ConfigBusesModal = ({ isOpen, onClose }: ConfigBusesModalProps) => {
  const [buses, setBuses] = useState<BusConfig[]>([]);
  const [grupos, setGrupos] = useState<GrupoInvitados[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedBusId, setExpandedBusId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
      setExpandedBusId(null);
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const [config, gruposData] = await Promise.all([
        dbService.getConfiguracionBuses(),
        dbService.getAllGrupos(),
      ]);
      setBuses(config?.buses || []);
      setGrupos(gruposData);
    } catch (error) {
      console.error('Error cargando configuracion de buses:', error);
      setBuses([]);
      setGrupos([]);
    } finally {
      setLoading(false);
    }
  };

  const pasajerosPorBus = useMemo(
    () => buses.map(bus => ({
      count: contarPasajerosBus(grupos, bus),
      pasajeros: getPasajerosBus(grupos, bus),
    })),
    [buses, grupos]
  );

  const totalPasajeros = useMemo(
    () => pasajerosPorBus.reduce((sum, b) => sum + b.count, 0),
    [pasajerosPorBus]
  );

  const handleSave = async () => {
    try {
      setSaving(true);
      const config: ConfiguracionBuses = {
        id: 'config-buses',
        buses,
        fechaActualizacion: new Date().toISOString(),
      };
      await dbService.saveConfiguracionBuses(config);
      onClose();
    } catch (error) {
      console.error('Error guardando configuracion de buses:', error);
      alert('Error al guardar la configuracion. Por favor, intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const addBus = () => {
    const nuevoBus: BusConfig = {
      id: Date.now().toString(),
      numero: buses.length + 1,
      nombre: '',
    };
    setBuses([...buses, nuevoBus]);
  };

  const removeBus = (busId: string) => {
    const nuevosBuses = buses
      .filter(bus => bus.id !== busId)
      .map((bus, index) => ({ ...bus, numero: index + 1 }));
    setBuses(nuevosBuses);
    if (expandedBusId === busId) setExpandedBusId(null);
  };

  const updateBus = (busId: string, field: keyof BusConfig, value: string) => {
    setBuses(buses.map(bus =>
      bus.id === busId ? { ...bus, [field]: value } : bus
    ));
  };

  const toggleExpanded = (busId: string) => {
    setExpandedBusId(prev => prev === busId ? null : busId);
  };

  const handleGeneratePdf = () => {
    const data: BusPasajeros[] = buses.map((bus, i) => ({
      busNombre: `Bus #${bus.numero}${bus.nombre ? ` — ${bus.nombre}` : ''}`,
      pasajeros: pasajerosPorBus[i].pasajeros.map(p => ({
        nombre: p.nombre,
        grupoNombre: p.grupoNombre,
      })),
    }));
    const html = getListaBusesPdfHtml(data);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Buses y Paradas"
      description="Configura los buses y consulta los pasajeros confirmados"
      maxWidth="4xl"
      footer={
        <>
          <Button
            variant="outline"
            onClick={handleGeneratePdf}
            className="w-full sm:w-auto text-sm gap-1.5"
            disabled={loading || buses.length === 0}
          >
            <FileDown className="w-4 h-4" />
            Generar PDF
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto text-sm" disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="shadow-gold w-full sm:w-auto text-sm"
            disabled={saving || loading}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Cargando configuracion...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Bus className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{buses.length} bus{buses.length !== 1 ? 'es' : ''}</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{totalPasajeros} pasajero{totalPasajeros !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <Button onClick={addBus} variant="outline" size="sm" className="text-xs h-8">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Anadir Bus
            </Button>
          </div>

          {/* Bus list */}
          {buses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bus className="w-14 h-14 mx-auto mb-4 opacity-30" />
              <p className="text-sm font-medium">No hay buses configurados</p>
              <p className="text-xs mt-1 opacity-70">Haz clic en "Anadir Bus" para comenzar</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {buses.map((bus, index) => {
                  const { count, pasajeros } = pasajerosPorBus[index];
                  const isExpanded = expandedBusId === bus.id;

                  return (
                    <motion.div
                      key={bus.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="border rounded-xl overflow-hidden bg-card"
                    >
                      {/* Bus header */}
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Bus icon with number */}
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                            <Bus className="w-5 h-5" />
                          </div>

                          {/* Name and input */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Label className="text-sm font-semibold">Bus #{bus.numero}</Label>
                              <Badge variant="secondary" className="text-[10px] h-5">
                                {count} pasajero{count !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                            <Input
                              value={bus.nombre || ''}
                              onChange={(e) => updateBus(bus.id, 'nombre', e.target.value)}
                              placeholder="Nombre o parada (ej: Centro, Estacion...)"
                              className="text-sm h-8"
                            />
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(bus.id)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                              title={isExpanded ? 'Ocultar pasajeros' : 'Ver pasajeros'}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBus(bus.id)}
                              className="h-8 w-8 p-0 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded passenger list */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="border-t bg-muted/30 px-4 py-3">
                              {pasajeros.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-3">
                                  Ningun invitado ha confirmado este bus todavia
                                </p>
                              ) : (
                                <div className="space-y-1.5">
                                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">
                                    Pasajeros confirmados ({pasajeros.length})
                                  </div>
                                  {pasajeros.map((p, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-card/80 border border-border/50"
                                    >
                                      <div className={`flex items-center justify-center w-6 h-6 rounded-full ${getTipoBadgeClass(p.tipo)}`}>
                                        {getTipoIcon(p.tipo)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <span className="text-sm font-medium truncate block">{p.nombre}</span>
                                      </div>
                                      <span className="text-[10px] text-muted-foreground truncate shrink-0 max-w-[120px]">
                                        {p.grupoNombre}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </AppModal>
  );
};

export default ConfigBusesModal;
