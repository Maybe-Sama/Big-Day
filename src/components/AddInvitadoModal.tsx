import { useState } from 'react';
import { User, Plus, Heart, Baby, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GrupoInvitados, Acompanante } from '@/types/invitados';
import { generateToken } from '@/lib/tokens';
import { AppModal } from '@/components/common';
import { motion } from 'framer-motion';

interface AddInvitadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (grupo: GrupoInvitados) => void;
}

const AddInvitadoModal = ({ isOpen, onClose, onSave }: AddInvitadoModalProps) => {
  // Datos del invitado principal
  const [invitadoPrincipal, setInvitadoPrincipal] = useState({
    nombre: '',
    apellidos: '',
    asistencia: 'pendiente' as 'pendiente' | 'confirmado' | 'rechazado',
    alergias: '', // Se completará en RSVP
  });

  // Acompañantes que los novios pueden pre-llenar
  const [acompanantes, setAcompanantes] = useState<Acompanante[]>([]);

  const addAcompanante = (tipo: 'pareja' | 'hijo') => {
    const nuevoAcompanante: Acompanante = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      nombre: '',
      apellidos: '',
      tipo,
      asistencia: 'pendiente',
      alergias: '',
      ...(tipo === 'hijo' && { edad: undefined }),
    };
    setAcompanantes([...acompanantes, nuevoAcompanante]);
  };

  const removeAcompanante = (id: string) => {
    setAcompanantes(acompanantes.filter(ac => ac.id !== id));
  };

  const updateAcompanante = (id: string, field: keyof Acompanante, value: string | number | 'pendiente' | 'confirmado' | 'rechazado' | undefined) => {
    setAcompanantes(acompanantes.map(ac =>
      ac.id === id ? { ...ac, [field]: value } : ac
    ));
  };

  const handleSave = () => {
    if (!invitadoPrincipal.nombre || !invitadoPrincipal.apellidos) {
      return;
    }

    // Filtrar acompañantes válidos (con nombre y apellidos, o vacíos para que se completen en RSVP)
    const acompanantesValidos = acompanantes.map(ac => ({
      ...ac,
      nombre: ac.nombre.trim(),
      apellidos: ac.apellidos.trim(),
      alergias: ac.alergias?.trim() || undefined,
    }));

    // Crear grupo con invitado principal y acompañantes pre-llenados
    const grupo: GrupoInvitados = {
      id: Date.now().toString(),
      invitadoPrincipal: {
        nombre: invitadoPrincipal.nombre.trim(),
        apellidos: invitadoPrincipal.apellidos.trim(),
        // No pedimos correo al crear el grupo desde el panel
        // (se mantiene como string para no romper búsquedas/tabla existentes).
        email: '',
        asistencia: 'pendiente', // Se confirmará en RSVP
        alergias: undefined, // Se añadirá en RSVP
      },
      acompanantes: acompanantesValidos, // Acompañantes pre-llenados por los novios
      token: generateToken(),
      asistencia: 'pendiente', // Se calculará en RSVP
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
      notas: undefined, // Opcional, se puede añadir después
      confirmacion_bus: false, // Se configurará en RSVP
      ubicacion_bus: undefined,
    };

    console.log("=== DEBUG: Grupo a guardar ===");
    console.log("Grupo completo:", grupo);
    console.log("Validación del grupo:", {
      tieneId: !!grupo.id,
      tieneInvitadoPrincipal: !!grupo.invitadoPrincipal,
      tieneNombre: !!grupo.invitadoPrincipal.nombre,
      tieneApellidos: !!grupo.invitadoPrincipal.apellidos,
      tieneToken: !!grupo.token,
      tieneAsistencia: !!grupo.asistencia,
      tieneFechaCreacion: !!grupo.fechaCreacion,
      tieneConfirmacionBus: grupo.confirmacion_bus !== undefined,
      numeroAcompanantes: grupo.acompanantes.length,
    });

    try {
      onSave(grupo);
      handleClose();
    } catch (error) {
      console.error("Error al llamar onSave:", error);
    }
  };

  const handleClose = () => {
    setInvitadoPrincipal({ nombre: '', apellidos: '', asistencia: 'pendiente', alergias: '' });
    setAcompanantes([]);
    onClose();
  };

  const isFormValid = invitadoPrincipal.nombre && invitadoPrincipal.apellidos;

  return (
      <AppModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Añadir Grupo de Invitados"
      description="Crea un nuevo grupo con los datos del invitado principal y sus acompañantes. Los campos que dejes vacíos se completarán cuando el invitado confirme su asistencia."
      maxWidth="4xl"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto text-sm">
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!isFormValid}
            className="shadow-gold w-full sm:w-auto text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Grupo
          </Button>
        </>
      }
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Invitado Principal */}
        <Card>
          <CardHeader className="p-4 sm:p-5 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
              Invitado Principal
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 md:p-6 pt-0 space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="nombre" className="text-sm">Nombre *</Label>
                <Input
                  id="nombre"
                  value={invitadoPrincipal.nombre}
                  onChange={(e) => setInvitadoPrincipal(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre del invitado principal"
                  className="text-sm h-9 sm:h-10 mt-1"
                />
              </div>
              <div>
                <Label htmlFor="apellidos" className="text-sm">Apellidos *</Label>
                <Input
                  id="apellidos"
                  value={invitadoPrincipal.apellidos}
                  onChange={(e) => setInvitadoPrincipal(prev => ({ ...prev, apellidos: e.target.value }))}
                  placeholder="Apellidos del invitado principal"
                  className="text-sm h-9 sm:h-10 mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acompañantes */}
        <Card>
          <CardHeader className="p-4 sm:p-5 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                Acompañantes
              </CardTitle>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => addAcompanante('pareja')}
                  className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  Añadir Pareja
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => addAcompanante('hijo')}
                  className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  Añadir Hijo
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
            {acompanantes.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <Heart className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                <p className="text-sm sm:text-base">No hay acompañantes añadidos</p>
                <p className="text-xs sm:text-sm mt-1">Usa los botones de arriba para añadir pareja o hijos</p>
                <p className="text-xs text-muted-foreground mt-2">Puedes dejar los campos vacíos para que los invitados los completen</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {acompanantes.map((acompanante) => (
                  <motion.div
                    key={acompanante.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {acompanante.tipo === 'pareja' ? (
                          <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-pink-500" />
                        ) : (
                          <Baby className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                        )}
                        <Badge variant={acompanante.tipo === 'pareja' ? 'default' : 'secondary'} className="text-xs">
                          {acompanante.tipo === 'pareja' ? 'Pareja' : 'Hijo'}
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeAcompanante(acompanante.id)}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      >
                        <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label className="text-sm">Nombre</Label>
                        <Input
                          value={acompanante.nombre}
                          onChange={(e) => updateAcompanante(acompanante.id, 'nombre', e.target.value)}
                          placeholder="Nombre (opcional)"
                          className="text-sm h-9 sm:h-10 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Apellidos</Label>
                        <Input
                          value={acompanante.apellidos}
                          onChange={(e) => updateAcompanante(acompanante.id, 'apellidos', e.target.value)}
                          placeholder="Apellidos (opcional)"
                          className="text-sm h-9 sm:h-10 mt-1"
                        />
                      </div>
                      {acompanante.tipo === 'hijo' && (
                        <div>
                          <Label className="text-sm">Edad</Label>
                          <Input
                            type="number"
                            value={acompanante.edad || ''}
                            onChange={(e) => updateAcompanante(acompanante.id, 'edad', e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="Edad (opcional)"
                            min="0"
                            max="18"
                            className="text-sm h-9 sm:h-10 mt-1"
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Los campos vacíos se completarán cuando el invitado confirme su asistencia
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppModal>
  );
};

export default AddInvitadoModal;
