import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Trash2, Users, Table, Crown, Copy, Check, QrCode, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppModal } from '@/components/common';
import { ConfiguracionMesas, MesaConfig } from '@/types/mesas';
import { dbService } from '@/lib/database';
import { GrupoInvitados } from '@/types/invitados';
import { generateToken } from '@/lib/tokens';
import { useToast } from '@/hooks/use-toast';

interface ConfigMesasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConfigMesasModal = ({ isOpen, onClose }: ConfigMesasModalProps) => {
  const [mesas, setMesas] = useState<MesaConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [grupos, setGrupos] = useState<GrupoInvitados[]>([]);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [expandedMesas, setExpandedMesas] = useState<Set<string>>(new Set());
  const [initialMesaIds, setInitialMesaIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Cargar configuración y grupos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadConfig();
      loadGrupos();
      // Resetear estado de expansión al abrir
      setExpandedMesas(new Set());
    } else {
      // Resetear estado al cerrar
      setExpandedMesas(new Set());
      setInitialMesaIds(new Set());
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const config = await dbService.getConfiguracionMesas();
      if (config) {
        // Generar tokens automáticamente para mesas que no lo tengan
        const mesasConTokens = config.mesas.map(mesa => {
          if (!mesa.token) {
            return { ...mesa, token: generateToken() };
          }
          return mesa;
        });
        setMesas(mesasConTokens);
        // Guardar los IDs de las mesas iniciales para determinar cuáles están guardadas
        setInitialMesaIds(new Set(mesasConTokens.map(m => m.id)));
        
        // Si se generaron tokens, guardar la configuración actualizada
        if (mesasConTokens.some((m, i) => m.token !== config.mesas[i]?.token)) {
          const configActualizada: ConfiguracionMesas = {
            ...config,
            mesas: mesasConTokens,
            fechaActualizacion: new Date().toISOString(),
          };
          await dbService.saveConfiguracionMesas(configActualizada);
        }
      } else {
        setMesas([]);
      }
    } catch (error) {
      console.error('Error cargando configuración de mesas:', error);
      setMesas([]);
    } finally {
      setLoading(false);
    }
  };

  const loadGrupos = async () => {
    try {
      const gruposData = await dbService.getAllGrupos();
      setGrupos(gruposData);
    } catch (error) {
      console.error('Error cargando grupos:', error);
      setGrupos([]);
    }
  };

  // Calcular ocupación de cada mesa
  const getOcupacionMesa = (mesaId: string) => {
    return grupos.filter(grupo => grupo.mesa === mesaId).reduce((total, grupo) => {
      // Contar solo los confirmados
      let personas = 0;
      if (grupo.invitadoPrincipal.asistencia === 'confirmado') {
        personas++;
      }
      grupo.acompanantes.forEach(ac => {
        if (ac.asistencia === 'confirmado') {
          personas++;
        }
      });
      return total + personas;
    }, 0);
  };

  const handleSave = async () => {
    // Validar que todas las mesas tengan nombre
    const mesasInvalidas = mesas.filter(m => !m.nombre || !m.nombre.trim());
    if (mesasInvalidas.length > 0) {
      alert('Por favor, completa el nombre de todas las mesas antes de guardar.');
      return;
    }

    // Validar que todas las mesas tengan capacidad válida
    const mesasSinCapacidad = mesas.filter(m => !m.capacidad || m.capacidad <= 0);
    if (mesasSinCapacidad.length > 0) {
      alert('Por favor, establece una capacidad válida (mayor a 0) para todas las mesas.');
      return;
    }

    try {
      setSaving(true);
      const config: ConfiguracionMesas = {
        id: 'config-mesas',
        mesas: mesas,
        fechaActualizacion: new Date().toISOString(),
      };
      await dbService.saveConfiguracionMesas(config);
      // Actualizar los IDs iniciales para que todas las mesas se consideren guardadas
      setInitialMesaIds(new Set(mesas.map(m => m.id)));
      onClose();
    } catch (error) {
      console.error('Error guardando configuración de mesas:', error);
      alert('Error al guardar la configuración. Por favor, intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const addMesa = () => {
    const nuevaMesa: MesaConfig = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      nombre: `Mesa ${mesas.length + 1}`,
      capacidad: 8,
      token: generateToken(), // Generar token automáticamente
    };
    setMesas([...mesas, nuevaMesa]);
    // Expandir automáticamente la nueva mesa para editarla
    setExpandedMesas(new Set([...expandedMesas, nuevaMesa.id]));
  };

  const toggleMesa = (mesaId: string) => {
    const newExpanded = new Set(expandedMesas);
    if (newExpanded.has(mesaId)) {
      newExpanded.delete(mesaId);
    } else {
      newExpanded.add(mesaId);
    }
    setExpandedMesas(newExpanded);
  };

  // Determinar si una mesa está guardada (existía al cargar la configuración)
  const isMesaSaved = (mesa: MesaConfig) => {
    return initialMesaIds.has(mesa.id);
  };

  const generateMesaToken = (mesaId: string) => {
    setMesas(mesas.map(mesa =>
      mesa.id === mesaId ? { ...mesa, token: generateToken() } : mesa
    ));
    toast({
      title: "Token generado",
      description: "Se ha generado un nuevo token para esta mesa",
    });
  };

  const copyMesaLink = (mesa: MesaConfig) => {
    if (!mesa.token) {
      toast({
        title: "Sin token",
        description: "Primero genera un token para esta mesa",
        variant: "destructive",
      });
      return;
    }

    const mesaLink = `${window.location.origin}/mesa?token=${mesa.token}`;
    
    navigator.clipboard.writeText(mesaLink).then(() => {
      setCopiedTokenId(mesa.id);
      setTimeout(() => setCopiedTokenId(null), 3000);
      
      toast({
        title: "Link copiado",
        description: `Link de la mesa copiado al portapapeles. Úsalo para generar el QR.`,
      });
    }).catch(() => {
      toast({
        title: "Link generado",
        description: mesaLink,
        variant: "destructive",
      });
    });
  };

  const removeMesa = (mesaId: string) => {
    // Verificar si hay grupos asignados a esta mesa
    const gruposEnMesa = grupos.filter(g => g.mesa === mesaId);
    if (gruposEnMesa.length > 0) {
      const confirmar = confirm(
        `Esta mesa tiene ${gruposEnMesa.length} grupo(s) asignado(s). ¿Estás seguro de que quieres eliminarla? Los grupos quedarán sin mesa asignada.`
      );
      if (!confirmar) return;
    }
    setMesas(mesas.filter(m => m.id !== mesaId));
  };

  const updateMesa = (mesaId: string, field: keyof MesaConfig, value: string | number) => {
    setMesas(mesas.map(mesa =>
      mesa.id === mesaId ? { ...mesa, [field]: value } : mesa
    ));
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Configurar Mesas"
      description="Crea y gestiona las mesas del evento. Asigna mesas a los grupos desde el panel de edición."
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
          {/* Botón para añadir mesa */}
          <div className="flex justify-end">
            <Button
              onClick={addMesa}
              variant="outline"
              size="sm"
              className="text-sm h-9"
            >
              <Plus className="w-4 h-4 mr-2" />
              Añadir Mesa
            </Button>
          </div>

          {/* Lista de mesas */}
          {mesas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Table className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No hay mesas configuradas</p>
              <p className="text-xs mt-1">Haz clic en "Añadir Mesa" para comenzar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {mesas.map((mesa) => {
                const ocupacion = getOcupacionMesa(mesa.id);
                const porcentajeOcupacion = (ocupacion / mesa.capacidad) * 100;
                const estaLlena = ocupacion >= mesa.capacidad;
                const casiLlena = porcentajeOcupacion >= 80;
                const isExpanded = expandedMesas.has(mesa.id);
                const isSaved = isMesaSaved(mesa);

                return (
                  <motion.div
                    key={mesa.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg overflow-hidden"
                  >
                    {/* Header colapsable */}
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Table className="w-5 h-5 text-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm sm:text-base truncate">
                              {mesa.nombre || `Mesa ${mesa.id.slice(-6)}`}
                            </div>
                            {isSaved && (
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant={estaLlena ? "destructive" : casiLlena ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {ocupacion} / {mesa.capacidad} personas
                                </Badge>
                                {mesa.ubicacion && (
                                  <span className="text-xs text-muted-foreground truncate">
                                    {mesa.ubicacion}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isSaved && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleMesa(mesa.id)}
                              className="h-8 w-8 p-0"
                              title={isExpanded ? "Colapsar" : "Expandir para editar"}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMesa(mesa.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Eliminar mesa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Contenido expandible */}
                    <AnimatePresence>
                      {(!isSaved || isExpanded) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t pt-4 space-y-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
                                <div className="flex-1 min-w-0">
                                  <Label className="text-sm font-medium">Nombre de la Mesa *</Label>
                                  <Input
                                    value={mesa.nombre}
                                    onChange={(e) => updateMesa(mesa.id, 'nombre', e.target.value)}
                                    placeholder="Ej: Mesa 1, Mesa Principal, Mesa VIP"
                                    className="text-sm h-9 sm:h-10 mt-1"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Capacidad *</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={mesa.capacidad}
                                  onChange={(e) => updateMesa(mesa.id, 'capacidad', parseInt(e.target.value) || 1)}
                                  placeholder="Número de personas"
                                  className="text-sm h-9 sm:h-10 mt-1"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Máximo de personas en esta mesa</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Ubicación</Label>
                                <Input
                                  value={mesa.ubicacion || ''}
                                  onChange={(e) => updateMesa(mesa.id, 'ubicacion', e.target.value)}
                                  placeholder="Ej: Salón principal, Terraza, etc."
                                  className="text-sm h-9 sm:h-10 mt-1"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Opcional: ubicación de la mesa</p>
                              </div>
                            </div>

                            {/* Selector de Capitán */}
                            <div className="mt-4 pt-4 border-t">
                              <Label className="text-sm font-medium flex items-center gap-2">
                                <Crown className="w-4 h-4 text-yellow-600" />
                                Capitán de Mesa
                              </Label>
                              <Select
                                value={mesa.capitanId || 'none'}
                                onValueChange={(value) => updateMesa(mesa.id, 'capitanId', value === 'none' ? undefined : value)}
                              >
                                <SelectTrigger className="text-sm h-9 sm:h-10 mt-1">
                                  <SelectValue placeholder="Seleccionar capitán (opcional)" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Sin capitán asignado</SelectItem>
                                  {grupos
                                    .filter(grupo => grupo.mesa === mesa.id) // Solo grupos asignados a esta mesa
                                    .flatMap((grupo) => {
                                      const miembros: Array<{ id: string; nombre: string; apellidos: string; tipo: string; email?: string }> = [
                                        {
                                          id: `${grupo.id}:principal`,
                                          nombre: grupo.invitadoPrincipal.nombre,
                                          apellidos: grupo.invitadoPrincipal.apellidos,
                                          tipo: 'Invitado Principal',
                                          email: grupo.invitadoPrincipal.email,
                                        },
                                        ...grupo.acompanantes.map(ac => ({
                                          id: `${grupo.id}:${ac.id}`,
                                          nombre: ac.nombre,
                                          apellidos: ac.apellidos,
                                          tipo: ac.tipo === 'pareja' ? 'Pareja' : 'Hijo',
                                        })),
                                      ];
                                      return miembros.map((miembro) => (
                                        <SelectItem key={miembro.id} value={miembro.id}>
                                          {miembro.nombre} {miembro.apellidos}
                                          <span className="text-muted-foreground ml-2">
                                            ({miembro.tipo})
                                          </span>
                                        </SelectItem>
                                      ));
                                    })}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground mt-1">
                                El capitán debe estar asignado a esta mesa. Si no hay grupos asignados a esta mesa, primero asigna grupos desde el panel de edición de grupos.
                              </p>
                              {grupos.filter(g => g.mesa === mesa.id).length === 0 && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                  ⚠️ No hay grupos asignados a esta mesa. Asigna grupos primero para poder seleccionar un capitán.
                                </p>
                              )}
                              {mesa.capitanId && (() => {
                                // Parsear el formato "grupoId:miembroId"
                                const [grupoId, miembroId] = mesa.capitanId.split(':');
                                const capitanGrupo = grupos.find(g => g.id === grupoId);
                                if (capitanGrupo) {
                                  let capitanNombre = '';
                                  let capitanApellidos = '';
                                  let capitanEmail = '';
                                  
                                  if (miembroId === 'principal') {
                                    capitanNombre = capitanGrupo.invitadoPrincipal.nombre;
                                    capitanApellidos = capitanGrupo.invitadoPrincipal.apellidos;
                                    capitanEmail = capitanGrupo.invitadoPrincipal.email;
                                  } else {
                                    const acompanante = capitanGrupo.acompanantes.find(ac => ac.id === miembroId);
                                    if (acompanante) {
                                      capitanNombre = acompanante.nombre;
                                      capitanApellidos = acompanante.apellidos;
                                    }
                                  }
                                  
                                  if (capitanNombre) {
                                    return (
                                      <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                        <div className="flex items-center gap-2">
                                          <Crown className="w-4 h-4 text-yellow-600" />
                                          <div className="flex-1">
                                            <p className="text-xs font-medium text-yellow-900 dark:text-yellow-100">
                                              {capitanNombre} {capitanApellidos}
                                            </p>
                                            {capitanEmail && (
                                              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                                                {capitanEmail}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }
                                }
                                return null;
                              })()}
                            </div>

                            {/* Token y Link de la Mesa */}
                            <div className="mt-4 pt-4 border-t">
                              <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                                <QrCode className="w-4 h-4 text-primary" />
                                Acceso a la Mesa (QR)
                              </Label>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => copyMesaLink(mesa)}
                                  className={`h-9 sm:h-10 text-xs ${
                                    copiedTokenId === mesa.id ? 'bg-green-600 hover:bg-green-700' : ''
                                  }`}
                                  title="Copiar link para QR"
                                  disabled={!mesa.token}
                                >
                                  {copiedTokenId === mesa.id ? (
                                    <>
                                      <Check className="w-3 h-3 mr-1" />
                                      Copiado
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3 mr-1" />
                                      Copiar Link
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => generateMesaToken(mesa.id)}
                                  className="h-9 sm:h-10 text-xs"
                                  title="Generar nuevo token"
                                >
                                  Regenerar
                                </Button>
                              </div>
                            </div>

                            {/* Resumen de ocupación */}
                            <div className="mt-4 pt-4 border-t">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">Ocupación</span>
                                </div>
                                <Badge
                                  variant={estaLlena ? "destructive" : casiLlena ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {ocupacion} / {mesa.capacidad} personas
                                </Badge>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    estaLlena
                                      ? 'bg-red-500'
                                      : casiLlena
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(porcentajeOcupacion, 100)}%` }}
                                />
                              </div>
                              {ocupacion > 0 && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  {grupos.filter(g => g.mesa === mesa.id).length} grupo(s) asignado(s) a esta mesa
                                </p>
                              )}
                              {mesa.capitanId && (() => {
                                // Parsear el formato "grupoId:miembroId"
                                const [grupoId, miembroId] = mesa.capitanId.split(':');
                                const capitanGrupo = grupos.find(g => g.id === grupoId);
                                if (capitanGrupo) {
                                  let capitanNombre = '';
                                  let capitanApellidos = '';
                                  
                                  if (miembroId === 'principal') {
                                    capitanNombre = capitanGrupo.invitadoPrincipal.nombre;
                                    capitanApellidos = capitanGrupo.invitadoPrincipal.apellidos;
                                  } else {
                                    const acompanante = capitanGrupo.acompanantes.find(ac => ac.id === miembroId);
                                    if (acompanante) {
                                      capitanNombre = acompanante.nombre;
                                      capitanApellidos = acompanante.apellidos;
                                    }
                                  }
                                  
                                  if (capitanNombre) {
                                    return (
                                      <div className="mt-3 pt-3 border-t">
                                        <div className="flex items-center gap-2">
                                          <Crown className="w-3.5 h-3.5 text-yellow-600" />
                                          <span className="text-xs font-medium">Capitán:</span>
                                          <span className="text-xs text-muted-foreground">
                                            {capitanNombre} {capitanApellidos}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  }
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </AppModal>
  );
};

export default ConfigMesasModal;

