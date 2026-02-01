import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Bus, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppModal } from '@/components/common';
import { ConfiguracionBuses, BusConfig } from '@/types/bus';
import { GrupoInvitados } from '@/types/invitados';
import { contarPasajerosBus } from '@/lib/bus-utils';
import { dbService } from '@/lib/database';

interface ConfigBusesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConfigBusesModal = ({ isOpen, onClose }: ConfigBusesModalProps) => {
  const [buses, setBuses] = useState<BusConfig[]>([]);
  const [grupos, setGrupos] = useState<GrupoInvitados[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Cargar configuración y grupos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const [config, gruposData] = await Promise.all([
        dbService.getConfiguracionBuses(),
        dbService.getAllGrupos(),
      ]);
      if (config) {
        setBuses(config.buses);
      } else {
        setBuses([]);
      }
      setGrupos(gruposData);
    } catch (error) {
      console.error('Error cargando configuración de buses:', error);
      setBuses([]);
      setGrupos([]);
    } finally {
      setLoading(false);
    }
  };

  const pasajerosPorBus = useMemo(
    () => buses.map(bus => contarPasajerosBus(grupos, bus)),
    [buses, grupos]
  );

  const handleSave = async () => {
    try {
      setSaving(true);
      const config: ConfiguracionBuses = {
        id: 'config-buses',
        buses: buses,
        fechaActualizacion: new Date().toISOString(),
      };
      await dbService.saveConfiguracionBuses(config);
      onClose();
    } catch (error) {
      console.error('Error guardando configuración de buses:', error);
      alert('Error al guardar la configuración. Por favor, intenta de nuevo.');
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
  };

  const updateBus = (busId: string, field: keyof BusConfig, value: string) => {
    setBuses(buses.map(bus =>
      bus.id === busId ? { ...bus, [field]: value } : bus
    ));
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Configurar Buses"
      description="Define el número de buses y su ubicación"
      maxWidth="4xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto text-sm" disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="shadow-gold w-full sm:w-auto text-sm"
            disabled={saving || loading}
          >
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Cargando configuración...</p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Botón para añadir bus */}
          <div className="flex justify-end">
            <Button
              onClick={addBus}
              variant="outline"
              size="sm"
              className="text-sm h-9"
            >
              <Plus className="w-4 h-4 mr-2" />
              Añadir Bus
            </Button>
          </div>

          {/* Lista de buses */}
          {buses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bus className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No hay buses configurados</p>
              <p className="text-xs mt-1">Haz clic en "Añadir Bus" para comenzar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {buses.map((bus, index) => (
                <motion.div
                  key={bus.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4 sm:p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <Bus className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <Label className="text-sm font-medium">Bus #{bus.numero}</Label>
                        <Input
                          value={bus.nombre || ''}
                          onChange={(e) => updateBus(bus.id, 'nombre', e.target.value)}
                          placeholder="Nombre del bus (opcional)"
                          className="text-sm h-9 sm:h-10 mt-1"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBus(bus.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                    <Users className="w-4 h-4" />
                    <span>
                      {pasajerosPorBus[index]} pasajero{pasajerosPorBus[index] !== 1 ? 's' : ''} confirmado{pasajerosPorBus[index] !== 1 ? 's' : ''}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </AppModal>
  );
};

export default ConfigBusesModal;

