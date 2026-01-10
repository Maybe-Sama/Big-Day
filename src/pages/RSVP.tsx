import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Plus, Minus, User, Heart, Baby, Bus, Save, Edit, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { dbService } from "@/lib/database";
import { GrupoInvitados, Acompanante } from "@/types/invitados";
import { ConfiguracionBuses } from "@/types/bus";
import PageLayout from "@/components/layouts/PageLayout";
import PageHeader from "@/components/common/PageHeader";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";

const RSVP = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [grupo, setGrupo] = useState<GrupoInvitados | null>(null);
  const [configBuses, setConfigBuses] = useState<ConfiguracionBuses | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Resetear el estado del video cada vez que se monta el componente (incluye refrescos)
  useEffect(() => {
    setShowVideo(true);
    setVideoError(false);
    console.log("Componente RSVP montado - mostrando video");
  }, []); // Ejecutar solo al montar el componente

  // Intentar reproducir el video automáticamente cuando esté listo
  useEffect(() => {
    if (showVideo && videoRef.current) {
      const video = videoRef.current;
      
      // Función para intentar reproducir
      const tryPlay = async () => {
        try {
          if (video.paused) {
            await video.play();
            console.log("Video reproducido automáticamente");
          }
        } catch (err) {
          console.warn("No se pudo reproducir automáticamente:", err);
        }
      };

      // Intentar reproducir cuando el video esté listo
      if (video.readyState >= 2) {
        // Si ya tiene datos suficientes, reproducir inmediatamente
        tryPlay();
      } else {
        // Si no, esperar a que esté listo
        video.addEventListener('loadeddata', tryPlay, { once: true });
        video.addEventListener('canplay', tryPlay, { once: true });
        video.addEventListener('canplaythrough', tryPlay, { once: true });
      }

      return () => {
        video.removeEventListener('loadeddata', tryPlay);
        video.removeEventListener('canplay', tryPlay);
        video.removeEventListener('canplaythrough', tryPlay);
      };
    }
  }, [showVideo]);

  useEffect(() => {
    const loadData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        await dbService.init();
        const grupoData = await dbService.getGrupoByToken(token);
        
        if (!grupoData) {
          setLoading(false);
          return;
        }

        setGrupo(grupoData);
        
        // Cargar configuración de buses
        const busesConfig = await dbService.getConfiguracionBuses();
        setConfigBuses(busesConfig);
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading grupo:", error);
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  const updateInvitadoPrincipal = (field: keyof GrupoInvitados['invitadoPrincipal'], value: string) => {
    if (!grupo) return;
    setGrupo({
      ...grupo,
      invitadoPrincipal: {
        ...grupo.invitadoPrincipal,
        [field]: value,
      },
    });
  };

  const addAcompanante = (tipo: 'pareja' | 'hijo') => {
    if (!grupo) return;
    const nuevoAcompanante: Acompanante = {
      id: Date.now().toString(),
      nombre: '',
      apellidos: '',
      tipo,
      asistencia: 'pendiente',
      alergias: '',
      ...(tipo === 'hijo' && { edad: 0 }),
    };
    setGrupo({
      ...grupo,
      acompanantes: [...grupo.acompanantes, nuevoAcompanante],
    });
  };

  const removeAcompanante = (id: string) => {
    if (!grupo) return;
    setGrupo({
      ...grupo,
      acompanantes: grupo.acompanantes.filter(ac => ac.id !== id),
    });
  };

  const updateAcompanante = (id: string, field: keyof Acompanante, value: string | number | 'pendiente' | 'confirmado' | 'rechazado' | undefined) => {
    if (!grupo) return;
    setGrupo({
      ...grupo,
      acompanantes: grupo.acompanantes.map(ac =>
        ac.id === id ? { ...ac, [field]: value } : ac
      ),
    });
  };

  const handleSaveMember = async () => {
    if (!grupo) return;

    // Validar que al menos el invitado principal tenga nombre y apellidos
    if (!grupo.invitadoPrincipal.nombre || !grupo.invitadoPrincipal.apellidos) {
      toast({
        title: "Error",
        description: "Por favor, completa al menos el nombre y apellidos del invitado principal",
        variant: "destructive",
      });
      return;
    }

    // Validar acompañantes: si tienen nombre, deben tener apellidos
    const acompanantesInvalidos = grupo.acompanantes.filter(ac => 
      (ac.nombre && !ac.apellidos) || (!ac.nombre && ac.apellidos)
    );
    
    if (acompanantesInvalidos.length > 0) {
      toast({
        title: "Error",
        description: "Los acompañantes deben tener nombre y apellidos completos",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      // Filtrar acompañantes válidos (con nombre y apellidos)
      const acompanantesValidos = grupo.acompanantes.filter(ac => ac.nombre && ac.apellidos);

      // Calcular estado del grupo basado en asistencias
      const todasAsistencias = [
        grupo.invitadoPrincipal.asistencia,
        ...acompanantesValidos.map(ac => ac.asistencia)
      ];

      let estadoGrupo: 'pendiente' | 'confirmado' | 'rechazado' = 'pendiente';
      if (todasAsistencias.some(a => a === 'confirmado')) {
        estadoGrupo = 'confirmado';
      } else if (todasAsistencias.every(a => a === 'rechazado')) {
        estadoGrupo = 'rechazado';
      }

      // Obtener información del bus si está seleccionado
      const busIdSeleccionado = grupo.ubicacion_bus;
      const busInfo = configBuses?.buses.find(b => 
        b.id === busIdSeleccionado || 
        b.nombre === busIdSeleccionado ||
        `Bus #${b.numero}` === busIdSeleccionado
      );
      const paradaInfo = busInfo?.paradas.find(p => p.nombre === grupo.parada_bus);

      const grupoActualizado: GrupoInvitados = {
        ...grupo,
        invitadoPrincipal: {
          ...grupo.invitadoPrincipal,
          alergias: grupo.invitadoPrincipal.alergias?.trim() || undefined,
        },
        acompanantes: acompanantesValidos.map(ac => ({
          ...ac,
          alergias: ac.alergias?.trim() || undefined,
        })),
        asistencia: estadoGrupo,
        fechaActualizacion: new Date().toISOString(),
        ubicacion_bus: grupo.confirmacion_bus && busInfo?.nombre 
          ? busInfo.nombre 
          : (grupo.confirmacion_bus && busInfo ? `Bus #${busInfo.numero}` : undefined),
        parada_bus: grupo.confirmacion_bus && paradaInfo ? paradaInfo.nombre : undefined,
      };

      await dbService.saveGrupo(grupoActualizado);
      setGrupo(grupoActualizado);
      setIsEditing(false);
      
      toast({
        title: "¡Cambios guardados!",
        description: "La información se ha guardado exitosamente",
      });
    } catch (error) {
      console.error("Error saving grupo:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la información. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInvitation = async () => {
    if (!grupo) return;

    // Validar que al menos el invitado principal tenga nombre y apellidos
    if (!grupo.invitadoPrincipal.nombre || !grupo.invitadoPrincipal.apellidos) {
      toast({
        title: "Error",
        description: "Por favor, completa al menos el nombre y apellidos del invitado principal",
        variant: "destructive",
      });
      return;
    }

    // Validar acompañantes: si tienen nombre, deben tener apellidos
    const acompanantesInvalidos = grupo.acompanantes.filter(ac => 
      (ac.nombre && !ac.apellidos) || (!ac.nombre && ac.apellidos)
    );
    
    if (acompanantesInvalidos.length > 0) {
      toast({
        title: "Error",
        description: "Los acompañantes deben tener nombre y apellidos completos",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      // Filtrar acompañantes válidos
      const acompanantesValidos = grupo.acompanantes.filter(ac => ac.nombre && ac.apellidos);

      // Calcular estado del grupo basado en asistencias actuales
      const todasAsistencias = [
        grupo.invitadoPrincipal.asistencia,
        ...acompanantesValidos.map(ac => ac.asistencia)
      ];

      let estadoGrupo: 'pendiente' | 'confirmado' | 'rechazado' = 'pendiente';
      if (todasAsistencias.some(a => a === 'confirmado')) {
        estadoGrupo = 'confirmado';
      } else if (todasAsistencias.every(a => a === 'rechazado')) {
        estadoGrupo = 'rechazado';
      }

      // Obtener información del bus si está seleccionado
      const busIdSeleccionado = grupo.ubicacion_bus;
      const busInfo = configBuses?.buses.find(b => 
        b.id === busIdSeleccionado || 
        b.nombre === busIdSeleccionado ||
        `Bus #${b.numero}` === busIdSeleccionado
      );
      const paradaInfo = busInfo?.paradas.find(p => p.nombre === grupo.parada_bus);

      const grupoActualizado: GrupoInvitados = {
        ...grupo,
        invitadoPrincipal: {
          ...grupo.invitadoPrincipal,
          alergias: grupo.invitadoPrincipal.alergias?.trim() || undefined,
        },
        acompanantes: acompanantesValidos.map(ac => ({
          ...ac,
          alergias: ac.alergias?.trim() || undefined,
        })),
        asistencia: estadoGrupo,
        fechaActualizacion: new Date().toISOString(),
        ubicacion_bus: grupo.confirmacion_bus && busInfo?.nombre 
          ? busInfo.nombre 
          : (grupo.confirmacion_bus && busInfo ? `Bus #${busInfo.numero}` : undefined),
        parada_bus: grupo.confirmacion_bus && paradaInfo ? paradaInfo.nombre : undefined,
      };

      await dbService.saveGrupo(grupoActualizado);
      setGrupo(grupoActualizado);
      
      toast({
        title: "¡Invitación guardada!",
        description: "Los datos se han guardado exitosamente. Puedes continuar completando la información más tarde.",
      });
    } catch (error) {
      console.error("Error saving grupo:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la información. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!grupo) return;

    // Validar que todos los miembros hayan confirmado o rechazado
    const todasAsistencias = [
      grupo.invitadoPrincipal.asistencia,
      ...grupo.acompanantes.map(ac => ac.asistencia)
    ];

    const hayPendientes = todasAsistencias.some(a => a === 'pendiente');
    
    if (hayPendientes) {
      toast({
        title: "Respuesta incompleta",
        description: "Por favor, confirma o rechaza la asistencia para todos los miembros antes de enviar",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      // Filtrar acompañantes válidos
      const acompanantesValidos = grupo.acompanantes.filter(ac => ac.nombre && ac.apellidos);

      // Calcular estado del grupo basado en asistencias
      let estadoGrupo: 'pendiente' | 'confirmado' | 'rechazado' = 'pendiente';
      if (todasAsistencias.some(a => a === 'confirmado')) {
        estadoGrupo = 'confirmado';
      } else if (todasAsistencias.every(a => a === 'rechazado')) {
        estadoGrupo = 'rechazado';
      }

      // Obtener información del bus si está seleccionado
      const busIdSeleccionado = grupo.ubicacion_bus;
      const busInfo = configBuses?.buses.find(b => 
        b.id === busIdSeleccionado || 
        b.nombre === busIdSeleccionado ||
        `Bus #${b.numero}` === busIdSeleccionado
      );
      const paradaInfo = busInfo?.paradas.find(p => p.nombre === grupo.parada_bus);

      const grupoActualizado: GrupoInvitados = {
        ...grupo,
        invitadoPrincipal: {
          ...grupo.invitadoPrincipal,
          alergias: grupo.invitadoPrincipal.alergias?.trim() || undefined,
        },
        acompanantes: acompanantesValidos.map(ac => ({
          ...ac,
          alergias: ac.alergias?.trim() || undefined,
        })),
        asistencia: estadoGrupo,
        fechaActualizacion: new Date().toISOString(),
        ubicacion_bus: grupo.confirmacion_bus && busInfo?.nombre 
          ? busInfo.nombre 
          : (grupo.confirmacion_bus && busInfo ? `Bus #${busInfo.numero}` : undefined),
        parada_bus: grupo.confirmacion_bus && paradaInfo ? paradaInfo.nombre : undefined,
      };

      await dbService.saveGrupo(grupoActualizado);
      
      setSubmitted(true);
      toast({
        title: "¡Respuesta enviada!",
        description: "Tu confirmación ha sido enviada exitosamente",
      });
    } catch (error) {
      console.error("Error saving grupo:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar la respuesta. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Mostrar video primero cuando se entra a la página
  if (showVideo && !videoError) {
    return (
      <PageLayout>
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            preload="auto"
            loop={false}
            className="w-full h-full object-contain"
            onClick={(e) => {
              // Si el usuario hace clic y el video está pausado, reproducir
              const video = e.currentTarget;
              if (video.paused) {
                video.play().catch((err) => {
                  console.warn("Error al reproducir al hacer clic:", err);
                });
              }
            }}
            onEnded={() => {
              console.log("Video terminado");
              setShowVideo(false);
            }}
            onError={(e) => {
              const video = e.currentTarget;
              const error = video.error;
              console.error("Error al reproducir el video:", {
                code: error?.code,
                message: error?.message,
                mediaError: error
              });
              // No ocultar inmediatamente, dar tiempo para que el usuario vea el error
              setTimeout(() => {
                setVideoError(true);
                setShowVideo(false);
              }, 2000);
            }}
            onLoadedData={() => {
              console.log("Video cargado correctamente");
              // Intentar reproducir si no se inició automáticamente
              if (videoRef.current && videoRef.current.paused) {
                videoRef.current.play().catch((err) => {
                  console.warn("No se pudo reproducir en loadeddata:", err);
                });
              }
            }}
            onCanPlay={() => {
              console.log("Video listo para reproducir");
              // Intentar reproducir cuando pueda reproducirse
              if (videoRef.current && videoRef.current.paused) {
                videoRef.current.play().catch((err) => {
                  console.warn("No se pudo reproducir en canplay:", err);
                });
              }
            }}
            onCanPlayThrough={() => {
              console.log("Video completamente cargado y listo");
              // Intentar reproducir cuando esté completamente listo
              if (videoRef.current && videoRef.current.paused) {
                videoRef.current.play().catch((err) => {
                  console.warn("No se pudo reproducir en canplaythrough:", err);
                });
              }
            }}
            onLoadStart={() => {
              console.log("Iniciando carga del video desde:", "/invi.mov");
            }}
            onStalled={() => {
              console.warn("Video se ha detenido (stalled)");
            }}
            onWaiting={() => {
              console.log("Video esperando datos...");
            }}
          >
            <source src="/invi.mov" type="video/quicktime" />
            <source src="/invi.mov" type="video/mp4" />
            <source src="/invi.mov" type="video/x-m4v" />
            Tu navegador no soporta la reproducción de video.
          </video>
          {/* Botón para saltar el video */}
          <button
            onClick={() => {
              console.log("Saltando video manualmente");
              setShowVideo(false);
            }}
            className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
            aria-label="Saltar video"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </PageLayout>
    );
  }

  if (loading) {
    return (
      <PageLayout>
        <LoadingState message="Cargando invitación..." />
      </PageLayout>
    );
  }

  if (!token || !grupo) {
    return (
      <PageLayout>
        <ErrorState
          title="Acceso Restringido"
          description="Esta página solo es accesible mediante una invitación personalizada. Si recibiste una invitación, por favor usa el enlace que te enviamos."
        />
      </PageLayout>
    );
  }

  if (submitted) {
    const totalConfirmados = [
      grupo.invitadoPrincipal,
      ...grupo.acompanantes
    ].filter(p => p.asistencia === 'confirmado').length;

    return (
      <PageLayout>
        <div className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-4">
          <div className="container mx-auto max-w-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-xl sm:rounded-2xl shadow-soft p-6 sm:p-8 text-center"
            >
              <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-primary mx-auto mb-4 sm:mb-6" />
              <h1 className="font-playfair text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">
                ¡Confirmación Guardada!
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground mb-3 sm:mb-4">
                Hola {grupo.invitadoPrincipal.nombre}, hemos guardado tu información correctamente.
              </p>
              {totalConfirmados > 0 && (
                <p className="text-sm sm:text-base text-muted-foreground">
                  {totalConfirmados} persona{totalConfirmados > 1 ? 's' : ''} confirmada{totalConfirmados > 1 ? 's' : ''} su asistencia.
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Buscar el bus seleccionado (puede estar guardado como ID, nombre o "Bus #X")
  const busActual = configBuses?.buses.find(b => {
    if (!grupo.ubicacion_bus) return false;
    return (
      b.id === grupo.ubicacion_bus || 
      b.nombre === grupo.ubicacion_bus ||
      `Bus #${b.numero}` === grupo.ubicacion_bus
    );
  });
  const paradasDisponibles = busActual?.paradas || [];
  
  // ID del bus seleccionado para el Select
  const busSeleccionadoId = busActual?.id || '';

  return (
    <PageLayout>
      <div className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <PageHeader
            title="Confirma tu Asistencia"
            description={`Hola ${grupo.invitadoPrincipal.nombre}, completa tu información para confirmar tu asistencia`}
            variant="simple"
          />

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-4 sm:space-y-6"
          >
            {/* Invitado Principal */}
            <Card>
              <CardHeader className="p-4 sm:p-5 md:p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    Invitado Principal
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={isEditing ? handleSaveMember : () => setIsEditing(true)}
                    disabled={saving}
                    className="text-xs sm:text-sm h-8 sm:h-9"
                  >
                    {isEditing ? (
                      <>
                        <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        {saving ? "Guardando..." : "Guardar"}
                      </>
                    ) : (
                      <>
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        Editar
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 md:p-6 pt-0 space-y-3 sm:space-y-4">
                {isEditing ? (
                  // MODO EDICIÓN
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="nombre-principal" className="text-sm">Nombre *</Label>
                        <Input
                          id="nombre-principal"
                          value={grupo.invitadoPrincipal.nombre}
                          onChange={(e) => updateInvitadoPrincipal('nombre', e.target.value)}
                          placeholder="Nombre"
                          className="text-sm h-9 sm:h-10 mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="apellidos-principal" className="text-sm">Apellidos *</Label>
                        <Input
                          id="apellidos-principal"
                          value={grupo.invitadoPrincipal.apellidos}
                          onChange={(e) => updateInvitadoPrincipal('apellidos', e.target.value)}
                          placeholder="Apellidos"
                          className="text-sm h-9 sm:h-10 mt-1"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email-principal" className="text-sm">Email</Label>
                      <Input
                        id="email-principal"
                        type="email"
                        value={grupo.invitadoPrincipal.email}
                        onChange={(e) => updateInvitadoPrincipal('email', e.target.value)}
                        placeholder="email@ejemplo.com"
                        className="text-sm h-9 sm:h-10 mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="alergias-principal" className="text-sm">Alergias / Intolerancias</Label>
                      <Input
                        id="alergias-principal"
                        value={grupo.invitadoPrincipal.alergias || ''}
                        onChange={(e) => updateInvitadoPrincipal('alergias', e.target.value)}
                        placeholder="Ej: Gluten, lactosa, frutos secos..."
                        className="text-sm h-9 sm:h-10 mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Deja en blanco si no hay alergias</p>
                    </div>
                    <div>
                      <Label className="text-sm">Confirmar Asistencia *</Label>
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="principal-edit-confirmado"
                            checked={grupo.invitadoPrincipal.asistencia === 'confirmado'}
                            onCheckedChange={(checked) => {
                              updateInvitadoPrincipal('asistencia', checked ? 'confirmado' : 'pendiente');
                            }}
                          />
                          <Label htmlFor="principal-edit-confirmado" className="text-xs sm:text-sm text-green-600 cursor-pointer">Confirmar</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="principal-edit-rechazado"
                            checked={grupo.invitadoPrincipal.asistencia === 'rechazado'}
                            onCheckedChange={(checked) => {
                              updateInvitadoPrincipal('asistencia', checked ? 'rechazado' : 'pendiente');
                            }}
                          />
                          <Label htmlFor="principal-edit-rechazado" className="text-xs sm:text-sm text-red-600 cursor-pointer">Rechazar</Label>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  // MODO SOLO LECTURA
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Nombre completo</Label>
                      <p className="text-base sm:text-lg mt-1">
                        {grupo.invitadoPrincipal.nombre} {grupo.invitadoPrincipal.apellidos}
                      </p>
                    </div>
                    {grupo.invitadoPrincipal.email && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                        <p className="text-sm sm:text-base mt-1 break-all">{grupo.invitadoPrincipal.email}</p>
                      </div>
                    )}
                    {grupo.invitadoPrincipal.alergias && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Alergias / Intolerancias</Label>
                        <p className="text-sm sm:text-base mt-1">{grupo.invitadoPrincipal.alergias}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm font-medium">Confirmar Asistencia *</Label>
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="principal-confirmado"
                            checked={grupo.invitadoPrincipal.asistencia === 'confirmado'}
                            onCheckedChange={(checked) => {
                              updateInvitadoPrincipal('asistencia', checked ? 'confirmado' : 'pendiente');
                            }}
                          />
                          <Label htmlFor="principal-confirmado" className="text-xs sm:text-sm text-green-600 cursor-pointer">Confirmar</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="principal-rechazado"
                            checked={grupo.invitadoPrincipal.asistencia === 'rechazado'}
                            onCheckedChange={(checked) => {
                              updateInvitadoPrincipal('asistencia', checked ? 'rechazado' : 'pendiente');
                            }}
                          />
                          <Label htmlFor="principal-rechazado" className="text-xs sm:text-sm text-red-600 cursor-pointer">Rechazar</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
                {grupo.acompanantes.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    <Heart className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">No hay acompañantes añadidos</p>
                    <p className="text-xs sm:text-sm mt-1">Usa los botones de arriba para añadir pareja o hijos</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {grupo.acompanantes.map((acompanante) => (
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
                              placeholder="Nombre"
                              className="text-sm h-9 sm:h-10 mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Apellidos</Label>
                            <Input
                              value={acompanante.apellidos}
                              onChange={(e) => updateAcompanante(acompanante.id, 'apellidos', e.target.value)}
                              placeholder="Apellidos"
                              className="text-sm h-9 sm:h-10 mt-1"
                            />
                          </div>
                          {acompanante.tipo === 'hijo' && (
                            <div>
                              <Label className="text-sm">Edad</Label>
                              <Input
                                type="number"
                                value={acompanante.edad || ''}
                                onChange={(e) => updateAcompanante(acompanante.id, 'edad', parseInt(e.target.value) || 0)}
                                placeholder="Edad"
                                min="0"
                                max="18"
                                className="text-sm h-9 sm:h-10 mt-1"
                              />
                            </div>
                          )}
                          <div className="col-span-full">
                            <Label className="text-sm">Alergias / Intolerancias</Label>
                            <Input
                              value={acompanante.alergias || ''}
                              onChange={(e) => updateAcompanante(acompanante.id, 'alergias', e.target.value)}
                              placeholder="Ej: Gluten, lactosa, frutos secos..."
                              className="text-sm h-9 sm:h-10 mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Deja en blanco si no hay alergias</p>
                          </div>
                          <div className="col-span-full">
                            <Label className="text-xs sm:text-sm font-medium">Confirmar Asistencia *</Label>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:gap-4 mt-2">
                              <div className="flex items-center space-x-1.5 sm:space-x-2">
                                <Checkbox
                                  id={`${acompanante.id}-confirmado`}
                                  checked={acompanante.asistencia === 'confirmado'}
                                  onCheckedChange={(checked) => {
                                    updateAcompanante(acompanante.id, 'asistencia', checked ? 'confirmado' : 'pendiente');
                                  }}
                                />
                                <Label htmlFor={`${acompanante.id}-confirmado`} className="text-xs text-green-600 cursor-pointer">Confirmar</Label>
                              </div>
                              <div className="flex items-center space-x-1.5 sm:space-x-2">
                                <Checkbox
                                  id={`${acompanante.id}-rechazado`}
                                  checked={acompanante.asistencia === 'rechazado'}
                                  onCheckedChange={(checked) => {
                                    updateAcompanante(acompanante.id, 'asistencia', checked ? 'rechazado' : 'pendiente');
                                  }}
                                />
                                <Label htmlFor={`${acompanante.id}-rechazado`} className="text-xs text-red-600 cursor-pointer">Rechazar</Label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transporte en Bus */}
            <Card>
              <CardHeader className="p-4 sm:p-5 md:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Bus className="w-4 h-4 sm:w-5 sm:h-5" />
                  Transporte en Bus
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 md:p-6 pt-0 space-y-3 sm:space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="confirmacion-bus"
                    checked={grupo.confirmacion_bus}
                    onCheckedChange={(checked) => {
                      setGrupo({
                        ...grupo,
                        confirmacion_bus: !!checked,
                        ubicacion_bus: !checked ? undefined : grupo.ubicacion_bus,
                        parada_bus: !checked ? undefined : grupo.parada_bus,
                      });
                    }}
                  />
                  <Label htmlFor="confirmacion-bus" className="text-sm cursor-pointer">
                    Utilizaremos el servicio de bus
                  </Label>
                </div>
                
                {grupo.confirmacion_bus && (
                  <div className="space-y-3 sm:space-y-4 pt-2 border-t">
                    {!configBuses || configBuses.buses.length === 0 ? (
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          No hay buses configurados. Contacta con los novios para más información.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div>
                          <Label htmlFor="bus-seleccionado" className="text-sm">Seleccionar Bus</Label>
                          <Select
                            value={busSeleccionadoId}
                            onValueChange={(value) => {
                              const busSeleccionado = configBuses.buses.find(b => b.id === value);
                              if (busSeleccionado) {
                                setGrupo({
                                  ...grupo,
                                  ubicacion_bus: busSeleccionado.id,
                                  parada_bus: undefined,
                                });
                              }
                            }}
                          >
                            <SelectTrigger id="bus-seleccionado" className="text-sm h-9 sm:h-10 mt-1">
                              <SelectValue placeholder="Selecciona un bus" />
                            </SelectTrigger>
                            <SelectContent>
                              {configBuses.buses.map((bus) => (
                                <SelectItem key={bus.id} value={bus.id}>
                                  {bus.nombre ? `${bus.nombre} (Bus #${bus.numero})` : `Bus #${bus.numero}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {busActual && paradasDisponibles.length > 0 && (
                          <div>
                            <Label htmlFor="parada-seleccionada" className="text-sm">Seleccionar Parada</Label>
                            <Select
                              value={grupo.parada_bus || ''}
                              onValueChange={(value) => {
                                setGrupo({
                                  ...grupo,
                                  parada_bus: value || undefined,
                                });
                              }}
                            >
                              <SelectTrigger id="parada-seleccionada" className="text-sm h-9 sm:h-10 mt-1">
                                <SelectValue placeholder="Selecciona una parada" />
                              </SelectTrigger>
                              <SelectContent>
                                {paradasDisponibles.map((parada) => (
                                  <SelectItem key={parada.id} value={parada.nombre}>
                                    {parada.nombre}
                                    {parada.ubicacion && ` - ${parada.ubicacion}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                              Parada donde subirán al {busActual.nombre || `Bus #${busActual.numero}`}
                            </p>
                          </div>
                        )}
                        
                        {busActual && paradasDisponibles.length === 0 && (
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                            <p className="text-xs text-yellow-800 dark:text-yellow-200">
                              Este bus no tiene paradas configuradas. Contacta con los novios.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Botones de envío */}
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              {/* Botón para guardar datos en cualquier momento */}
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleSaveInvitation}
                disabled={saving}
                className="w-full sm:w-auto text-base sm:text-lg h-12 sm:h-14"
              >
                {saving ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Enviar Invitación
                  </>
                )}
              </Button>

              {/* Botón para enviar respuesta final (solo cuando todos han respondido) */}
              {(() => {
                // Verificar si todos los miembros han confirmado o rechazado
                const todasAsistencias = [
                  grupo.invitadoPrincipal.asistencia,
                  ...grupo.acompanantes.map(ac => ac.asistencia)
                ];
                const todosHanRespondido = todasAsistencias.every(a => a === 'confirmado' || a === 'rechazado');
                
                return todosHanRespondido ? (
                  <Button
                    type="submit"
                    size="lg"
                    className="shadow-gold w-full sm:w-auto text-base sm:text-lg h-12 sm:h-14"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Enviar Respuesta
                      </>
                    )}
                  </Button>
                ) : null;
              })()}
            </div>
          </motion.form>
        </div>
      </div>
    </PageLayout>
  );
};

export default RSVP;
