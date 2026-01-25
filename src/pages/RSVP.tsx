import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Plus, Minus, User, Heart, Baby, Bus, Save, Edit, Hand, Calendar, MapPin, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { dbService } from "@/lib/database";
import { GrupoInvitados, Acompanante } from "@/types/invitados";
import { ConfiguracionBuses } from "@/types/bus";
import PageLayout from "@/components/layouts/PageLayout";
import PageHeader from "@/components/common/PageHeader";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import Countdown from "@/components/Countdown";
import heroImage from "@/assets/hero-wedding.jpg";
import heroImageDesktop from "@/assets/hero-wedding-h.png";
import { activities } from "@/data/activities";
import Lottie from "lottie-react";
import scrollDownAnimation from "@/assets/scroll-down.json";

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
  const [showAlergiasPrincipal, setShowAlergiasPrincipal] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const alergiasPrincipalInitRef = useRef(false);
  const allowedAcompananteIdsRef = useRef<Set<string>>(new Set());

  const normalizedToken = useMemo(() => token?.trim() || "", [token]);

  // Normalización defensiva: config de buses puede venir con shape inválido desde KV
  // (legacy/backup). Nunca asumir que `configBuses.buses` existe o es array.
  const busesArr = useMemo(
    () => (Array.isArray(configBuses?.buses) ? configBuses.buses : []),
    [configBuses]
  );

  const patchRsvp = async (payload: unknown, attempt: 0 | 1 = 0): Promise<GrupoInvitados> => {
    if (!normalizedToken) {
      throw new Error("Token requerido");
    }

    const response = await fetch(`/api/rsvp?token=${encodeURIComponent(normalizedToken)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // 409: retry una sola vez con backoff simple 250–400ms
      if (response.status === 409) {
        if (attempt === 0) {
          const delayMs = 250 + Math.floor(Math.random() * 151); // 250..400
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          return patchRsvp(payload, 1);
        }
        throw new Error("Se actualizó hace un momento. Refresca la página y vuelve a intentarlo.");
      }

      let message = `Error ${response.status}`;
      try {
        const data = await response.json();
        if (data?.error) message = data.error;
      } catch {
        // ignore parse errors
      }
      throw new Error(message);
    }

    return response.json();
  };

  // Detectar iOS
  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);
    console.log("Es dispositivo iOS:", isIOSDevice);
  }, []);

  // Resetear el estado del video cada vez que se monta el componente (incluye refrescos)
  useEffect(() => {
    setShowVideo(true);
    setVideoPlaying(false);
    setVideoReady(false);
    setUserInteracted(false);
    console.log("Componente RSVP montado - mostrando primer frame del video");
  }, []); // Ejecutar solo al montar el componente

  // Reproducir música de fondo automáticamente
  useEffect(() => {
    const playAudio = async () => {
      if (audioRef.current) {
        try {
          audioRef.current.volume = 0.5; // Ajustar volumen al 50%
          await audioRef.current.play();
          console.log("Música de fondo iniciada");
        } catch (error) {
          console.warn("No se pudo reproducir el audio automáticamente (puede requerir interacción del usuario):", error);
          // Intentar reproducir cuando el usuario haga clic en el video
        }
      }
    };

    playAudio();
  }, []);

  // Función para forzar la carga del video (necesaria en iOS)
  const forceVideoLoad = async () => {
    if (videoRef.current && !userInteracted) {
      setUserInteracted(true);
      const video = videoRef.current;
      
      try {
        // Forzar la carga del video llamando a load()
        video.load();
        
        // Intentar establecer el primer frame después de que se cargue
        const checkReady = setInterval(() => {
          if (video.readyState >= 2) {
            clearInterval(checkReady);
            video.currentTime = 0;
            video.pause();
            setVideoReady(true);
            console.log("Video forzado a cargar en iOS - primer frame listo");
          }
        }, 100);

        // Timeout de seguridad
        setTimeout(() => {
          clearInterval(checkReady);
          if (video.readyState >= 1) {
            video.currentTime = 0;
            video.pause();
            setVideoReady(true);
            console.log("Video cargado con timeout de seguridad");
          }
        }, 3000);
      } catch (error) {
        console.error("Error al forzar carga del video:", error);
      }
    }
  };

  // Cargar el primer frame del video sin reproducirlo
  useEffect(() => {
    if (showVideo && videoRef.current && !videoPlaying) {
      const video = videoRef.current;
      
      // Asegurar que el video esté pausado
      if (!video.paused) {
        video.pause();
      }
      
      // En iOS, si el usuario no ha interactuado, no intentar cargar automáticamente
      if (isIOS && !userInteracted) {
        return;
      }
      
      // Cargar el primer frame del video
      const loadFirstFrame = () => {
        if (video.readyState >= 2 && !videoPlaying) {
          // Si ya tiene datos suficientes, mostrar el primer frame
          video.currentTime = 0;
          video.pause(); // Asegurar que esté pausado
          setVideoReady(true);
          console.log("Primer frame del video cargado y pausado");
        }
      };

      // Cargar el primer frame cuando el video esté listo
      if (video.readyState >= 2) {
        loadFirstFrame();
      } else {
        video.addEventListener('loadeddata', loadFirstFrame, { once: true });
        video.addEventListener('canplay', loadFirstFrame, { once: true });
        video.addEventListener('loadedmetadata', () => {
          if (video.readyState >= 1 && !videoReady) {
            video.currentTime = 0;
            video.pause();
            if (video.readyState >= 2) {
              setVideoReady(true);
            }
          }
        }, { once: true });
      }

      return () => {
        video.removeEventListener('loadeddata', loadFirstFrame);
        video.removeEventListener('canplay', loadFirstFrame);
      };
    }
  }, [showVideo, videoPlaying, isIOS, userInteracted, videoReady]);

  // Función para manejar el clic en el loader (iOS necesita esto)
  const handleLoaderClick = () => {
    if (!videoReady && isIOS) {
      forceVideoLoad();
    }
  };

  // Función para iniciar la reproducción del video cuando el usuario hace clic
  const handleVideoClick = async () => {
    if (!videoPlaying && videoRef.current) {
      // Si el video no está listo en iOS, forzar la carga primero
      if (isIOS && !videoReady && !userInteracted) {
        await forceVideoLoad();
        // Esperar un momento para que el video se cargue
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      try {
        setVideoPlaying(true);
        await videoRef.current.play();
        console.log("Video iniciado por clic del usuario");
        
        // Intentar reproducir el audio si no se ha iniciado automáticamente
        if (audioRef.current && audioRef.current.paused) {
          try {
            await audioRef.current.play();
            console.log("Música de fondo iniciada por interacción del usuario");
          } catch (audioErr) {
            console.warn("No se pudo reproducir el audio:", audioErr);
          }
        }
      } catch (err) {
        console.error("Error al iniciar el video:", err);
        setVideoPlaying(false);
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const grupoData = await dbService.getGrupoByToken(token);
        
        if (!grupoData) {
          setLoading(false);
          return;
        }

        setGrupo(grupoData);
        allowedAcompananteIdsRef.current = new Set((grupoData.acompanantes || []).map((ac) => ac.id));
        
        // Cargar configuración de buses
        const busesConfig = await dbService.getConfiguracionBuses();
        setConfigBuses(busesConfig);
        
        setLoading(false);
      } catch (error: any) {
        console.error("Error loading grupo:", error);
        // El error ya viene con mensaje claro de api-service
        setLoading(false);
        // El error se mostrará en el ErrorState si grupoData es null
      }
    };

    loadData();
  }, [token]);

  useEffect(() => {
    if (!grupo) return;
    if (alergiasPrincipalInitRef.current) return;
    setShowAlergiasPrincipal(Boolean(grupo.invitadoPrincipal.alergias?.trim()));
    alergiasPrincipalInitRef.current = true;
  }, [grupo]);

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
    // Seguridad: el endpoint RSVP NO permite crear acompañantes nuevos.
    toast({
      title: "No permitido",
      description: "No se pueden añadir acompañantes desde este formulario. Contacta con los organizadores.",
      variant: "destructive",
    });
    return;
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
    // Seguridad: el endpoint RSVP NO permite eliminar acompañantes.
    toast({
      title: "No permitido",
      description: "No se pueden eliminar acompañantes desde este formulario. Contacta con los organizadores.",
      variant: "destructive",
    });
    return;
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
      const busInfo = busesArr.find(b => 
        b.id === busIdSeleccionado || 
        b.nombre === busIdSeleccionado ||
        `Bus #${b.numero}` === busIdSeleccionado
      );

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
      };

      const payload = {
        asistencia: grupoActualizado.asistencia,
        confirmacion_bus: grupoActualizado.confirmacion_bus,
        ubicacion_bus: grupoActualizado.ubicacion_bus,
        invitadoPrincipal: {
          asistencia: grupoActualizado.invitadoPrincipal.asistencia,
          alergias: grupoActualizado.invitadoPrincipal.alergias,
        },
        acompanantes: grupoActualizado.acompanantes
          .filter((ac) => allowedAcompananteIdsRef.current.has(ac.id))
          .map((ac) => ({
            id: ac.id,
            asistencia: ac.asistencia,
            alergias: ac.alergias,
          })),
      };

      const serverGrupo = await patchRsvp(payload);
      // Refrescar estado local sin “perder” token/email originales.
      setGrupo((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ...serverGrupo,
          token: prev.token,
          invitadoPrincipal: {
            ...prev.invitadoPrincipal,
            ...serverGrupo.invitadoPrincipal,
            email: prev.invitadoPrincipal.email,
          },
        };
      });
      setIsEditing(false);
      
      toast({
        title: "¡Cambios guardados!",
        description: "La información se ha guardado exitosamente",
      });
    } catch (error: any) {
      console.error("Error saving grupo:", error);
      toast({
        title: "Error",
        description: error?.message
          ? `No se pudo guardar: ${error.message}`
          : "No se pudo guardar la información. Por favor, intenta de nuevo.",
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
      const busInfo = busesArr.find(b => 
        b.id === busIdSeleccionado || 
        b.nombre === busIdSeleccionado ||
        `Bus #${b.numero}` === busIdSeleccionado
      );

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
      };

      const payload = {
        asistencia: grupoActualizado.asistencia,
        confirmacion_bus: grupoActualizado.confirmacion_bus,
        ubicacion_bus: grupoActualizado.ubicacion_bus,
        invitadoPrincipal: {
          asistencia: grupoActualizado.invitadoPrincipal.asistencia,
          alergias: grupoActualizado.invitadoPrincipal.alergias,
        },
        acompanantes: grupoActualizado.acompanantes
          .filter((ac) => allowedAcompananteIdsRef.current.has(ac.id))
          .map((ac) => ({
            id: ac.id,
            asistencia: ac.asistencia,
            alergias: ac.alergias,
          })),
      };

      const serverGrupo = await patchRsvp(payload);
      setGrupo((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ...serverGrupo,
          token: prev.token,
          invitadoPrincipal: {
            ...prev.invitadoPrincipal,
            ...serverGrupo.invitadoPrincipal,
            email: prev.invitadoPrincipal.email,
          },
        };
      });
      
      toast({
        title: "¡Invitación guardada!",
        description: "Los datos se han guardado exitosamente. Puedes continuar completando la información más tarde.",
      });
    } catch (error: any) {
      console.error("Error saving grupo:", error);
      toast({
        title: "Error",
        description: error?.message
          ? `No se pudo guardar: ${error.message}`
          : "No se pudo guardar la información. Por favor, intenta de nuevo.",
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
      const busInfo = busesArr.find(b => 
        b.id === busIdSeleccionado || 
        b.nombre === busIdSeleccionado ||
        `Bus #${b.numero}` === busIdSeleccionado
      );

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
      };

      const payload = {
        asistencia: grupoActualizado.asistencia,
        confirmacion_bus: grupoActualizado.confirmacion_bus,
        ubicacion_bus: grupoActualizado.ubicacion_bus,
        invitadoPrincipal: {
          asistencia: grupoActualizado.invitadoPrincipal.asistencia,
          alergias: grupoActualizado.invitadoPrincipal.alergias,
        },
        acompanantes: grupoActualizado.acompanantes
          .filter((ac) => allowedAcompananteIdsRef.current.has(ac.id))
          .map((ac) => ({
            id: ac.id,
            asistencia: ac.asistencia,
            alergias: ac.alergias,
          })),
      };

      const serverGrupo = await patchRsvp(payload);
      setGrupo((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ...serverGrupo,
          token: prev.token,
          invitadoPrincipal: {
            ...prev.invitadoPrincipal,
            ...serverGrupo.invitadoPrincipal,
            email: prev.invitadoPrincipal.email,
          },
        };
      });
      
      setSubmitted(true);
      toast({
        title: "¡Respuesta enviada!",
        description: "Tu confirmación ha sido enviada exitosamente",
      });
    } catch (error: any) {
      console.error("Error saving grupo:", error);
      toast({
        title: "Error",
        description: error?.message
          ? `No se pudo guardar: ${error.message}`
          : "No se pudo enviar la respuesta. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Mostrar video primero cuando se entra a la página
  if (showVideo) {
    return (
      <PageLayout>
        <audio
          ref={audioRef}
          src="/sounds/love.mp3"
          loop
          preload="auto"
        />
        <div 
          className="fixed inset-0 z-50 bg-black flex items-center justify-center cursor-pointer m-0 p-0"
          onClick={handleVideoClick}
          style={{ width: '100vw', height: '100vh', maxWidth: '100%', maxHeight: '100%' }}
        >
          <video
            ref={videoRef}
            muted
            playsInline
            preload={isIOS ? "metadata" : "auto"}
            loop={false}
            className={`w-full h-full object-cover min-w-full min-h-full transition-opacity duration-300 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onClick={(e) => {
              // Prevenir que el clic se propague al contenedor si ya está reproduciéndose
              e.stopPropagation();
              if (!videoPlaying && videoRef.current) {
                handleVideoClick();
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
              // No ocultar automáticamente el video si hay error
              // Solo mostrar el error en consola, el usuario puede cerrarlo manualmente
            }}
            onLoadedData={() => {
              console.log("Video cargado correctamente - mostrando primer frame");
              // Asegurar que el video muestre el primer frame y esté pausado
              if (videoRef.current && !videoPlaying) {
                videoRef.current.currentTime = 0;
                videoRef.current.pause(); // Asegurar que esté pausado
                setVideoReady(true);
              }
            }}
            onCanPlay={() => {
              console.log("Video listo para reproducir - primer frame visible");
              // Asegurar que el video muestre el primer frame y esté pausado
              if (videoRef.current && !videoPlaying) {
                videoRef.current.currentTime = 0;
                videoRef.current.pause(); // Asegurar que esté pausado
                setVideoReady(true);
              }
            }}
            onPlay={() => {
              // Si el video se reproduce sin que el usuario haya hecho clic, pausarlo
              if (!videoPlaying && videoRef.current) {
                console.warn("Video intentó reproducirse automáticamente, pausando...");
                videoRef.current.pause();
              }
            }}
            onLoadStart={() => {
              console.log("Iniciando carga del video desde:", "/invi.mp4");
              setVideoReady(false);
            }}
            onLoadedMetadata={() => {
              console.log("Metadata del video cargada");
              // Establecer el tiempo a 0 tan pronto como tengamos metadata
              if (videoRef.current && !videoPlaying) {
                videoRef.current.currentTime = 0;
                videoRef.current.pause();
                // En iOS, si tenemos metadata después de interacción, intentar mostrar
                if (isIOS && userInteracted && videoRef.current.readyState >= 1) {
                  setTimeout(() => {
                    if (videoRef.current && videoRef.current.readyState >= 2) {
                      setVideoReady(true);
                    }
                  }, 200);
                }
              }
            }}
            onStalled={() => {
              console.warn("Video se ha detenido (stalled)");
            }}
            onWaiting={() => {
              console.log("Video esperando datos...");
            }}
          >
            <source src="/invi.mp4" type="video/quicktime" />
            <source src="/invi.mp4" type="video/mp4" />
            <source src="/invi.mp4" type="video/x-m4v" />
            Tu navegador no soporta la reproducción de video.
          </video>
          {/* Loader con corona.png rotando mientras carga el video */}
          {!videoReady && (
            <div 
              className={`absolute inset-0 bg-black flex items-center justify-center z-20 ${isIOS ? 'cursor-pointer' : ''}`}
              onClick={(e) => {
                if (isIOS) {
                  e.stopPropagation();
                  handleLoaderClick();
                }
              }}
            >
              <div className="relative flex items-center justify-center">
                {/* Corona rotando */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40"
                >
                  <img
                    src="/corona.png"
                    alt="Cargando..."
                    className="w-full h-full object-contain"
                  />
                </motion.div>
              </div>
              {/* Texto indicativo solo en iOS */}
              {isIOS && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute bottom-8 sm:bottom-12 text-white text-sm sm:text-base opacity-75 text-center px-4"
                >
                  Toca para cargar el video
                </motion.p>
              )}
            </div>
          )}
          {/* Animación de puntero/dedo haciendo clic */}
          {!videoPlaying && videoReady && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-none z-10">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ 
                  opacity: [0, 1, 1, 1],
                  y: [0, 0, 8, 0],
                  scale: [1, 1, 0.9, 1]
                }}
                transition={{
                  opacity: { duration: 0.5 },
                  y: {
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 1,
                    ease: "easeInOut"
                  },
                  scale: {
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 1,
                    ease: "easeInOut"
                  }
                }}
                className="relative w-fit h-fit"
              >
                <Hand 
                  className="w-8 h-8 drop-shadow-[0_0_10px_rgba(0,0,0,0.8),0_2px_4px_rgba(0,0,0,0.5)]" 
                  fill="none"
                  stroke="currentColor"
                  style={{ color: 'rgb(180, 170, 150)' }}
                />
              </motion.div>
            </div>
          )}
        </div>
      </PageLayout>
    );
  }

  if (loading) {
    return (
      <PageLayout>
        <audio
          ref={audioRef}
          src="/sounds/love.mp3"
          loop
          preload="auto"
        />
        <LoadingState message="Cargando invitación..." />
      </PageLayout>
    );
  }

  if (!token || !grupo) {
    return (
      <PageLayout>
        <audio
          ref={audioRef}
          src="/sounds/love.mp3"
          loop
          preload="auto"
        />
        <ErrorState
          title="Token no encontrado"
          description={
            !token 
              ? "No se proporcionó un token de invitación. Por favor, usa el enlace completo que te enviaron."
              : "Token no encontrado."
          }
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
        <audio
          ref={audioRef}
          src="/sounds/love.mp3"
          loop
          preload="auto"
        />
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
  const busActual = busesArr.find(b => {
    if (!grupo.ubicacion_bus) return false;
    return (
      b.id === grupo.ubicacion_bus || 
      b.nombre === grupo.ubicacion_bus ||
      `Bus #${b.numero}` === grupo.ubicacion_bus
    );
  });
  
  // ID del bus seleccionado para el Select
  const busSeleccionadoId = busActual?.id || '';

  return (
    <PageLayout>
      <audio
        ref={audioRef}
        src="/sounds/love.mp3"
        loop
        preload="auto"
      />
      {/* Hero Section */}
      <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center hero-bg-position hero-bg-image"
          style={{
            ["--hero-image-mobile" as any]: `url(${heroImage})`,
            ["--hero-image-desktop" as any]: `url(${heroImageDesktop})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent via-70% to-background" />
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-6 sm:px-6 text-white max-w-5xl mx-auto mt-32 sm:mt-80 md:mt-80"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="font-playfair text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-4 sm:mb-6 leading-tight"
          >
            Virginia & Alejandro
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-base sm:text-lg md:text-xl lg:text-2xl font-light px-4 mb-6 sm:mb-8"
          >
            Nos casamos y queremos celebrarlo contigo
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="space-y-3 sm:space-y-4"
          >
            <div className="flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base md:text-lg lg:text-xl">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" />
              <span className="text-center">13 de Junio, 2026 • 19:00h</span>
            </div>
            
            <div className="flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base md:text-lg lg:text-xl px-4">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" />
              <span className="text-center">Hacienda Las Yeguas<br />Fuentes de Andalucía, Sevilla</span>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Animación Lottie en el tercio inferior de la imagen */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-30 bottom-[5%] lg:bottom-[1%]"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24">
            <Lottie 
              animationData={scrollDownAnimation}
              loop={true}
              className="w-full h-full"
            />
          </div>
        </motion.div>
      </section>

      {/* Countdown Section */}
      <section className="py-12 sm:py-16 md:py-20 px-6 sm:px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-10 md:mb-12"
          >
            <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-primary">
              Faltan...
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg px-4">
              Para el día más especial de nuestras vidas
            </p>
          </motion.div>
        </div>
        <div className="w-full overflow-hidden">
          <Countdown />
        </div>
      </section>

      {/* Info Section */}
      <section className="py-12 sm:py-16 md:py-20 px-6 sm:px-4 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-6 sm:gap-8"
          >
            <div className="bg-card rounded-2xl shadow-soft p-6 sm:p-8">
              <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
                Nuestra Historia
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Después de seis años juntos, conociéndonos de verdad, descendiendo montañas, descubriendo lugares y también a nosotros mismos,
                probando cada pista de pádel, bailando en la cocina y acumulando innumerables noches dormidos en el sofá...
                ¡Lo tenemos claro! <br />
                Vamos a dar el paso más importante de nuestras vidas.
                Queremos compartir este momento tan especial con 
                las personas que más queremos. Vuestra presencia es el mejor regalo 
                que podemos recibir.
              </p>
            </div>
            
            <div className="bg-card rounded-2xl shadow-soft p-6 sm:p-8">
              <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
                El Lugar
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-4">
                La celebración tendrá lugar en la encantadora Hacienda Las Yeguas, 
                un espacio único rodeado de naturaleza y elegancia, perfecto 
                para crear recuerdos inolvidables.
              </p>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="rounded-xl sm:rounded-2xl overflow-hidden shadow-medium h-64 sm:h-80 md:h-96"
              >
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1730.0834020846341!2d-5.356581926832529!3d37.47354133699385!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd12be54cac59d87%3A0xdfb78eea5b7e9d60!2sHacienda%20Las%20Yeguas!5e1!3m2!1ses!2ses!4v1763518614644!5m2!1ses!2ses"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Ubicación de la boda"
                />
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-6 sm:mt-8 text-center"
              >
                <Button asChild className="shadow-gold hover:shadow-medium transition-smooth w-full sm:w-auto text-sm sm:text-base">
                  <a
                    href="https://maps.google.com/?q=Hacienda+Las+Yeguas"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    Abrir en Google Maps
                  </a>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-8 sm:py-10 md:py-12 px-6 sm:px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-10 md:mb-12"
          >
            <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-primary">
              Cronograma del Día
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg px-4">
              Aquí encontrarás los detalles de los momentos y actividades más especiales de la boda
            </p>
          </motion.div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-6 sm:left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-border" />

            {/* Timeline Items */}
            <div className="space-y-8 sm:space-y-10 md:space-y-12">
              {activities.map((activity, index) => (
                <motion.div 
                  key={index} 
                  className="relative"
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-6 sm:left-8 md:left-1/2 -translate-x-1/2 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-primary border-2 sm:border-4 border-background z-10 shadow-gold" />

                  {/* Content */}
                  <div
                    className={`ml-14 sm:ml-16 md:ml-0 ${
                      index % 2 === 0 ? "md:pr-[calc(50%+2rem)]" : "md:pl-[calc(50%+2rem)] md:text-right"
                    }`}
                  >
                    <Card className="shadow-soft hover:shadow-medium transition-smooth">
                      <CardHeader className="p-4 sm:p-5 md:p-6">
                        <div className={`flex items-center gap-1.5 sm:gap-2 text-primary mb-1.5 sm:mb-2 ${index % 2 === 0 ? "" : "md:justify-end"}`}>
                          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="font-semibold text-sm sm:text-base">{activity.time}</span>
                        </div>
                        <CardTitle className="text-lg sm:text-xl md:text-2xl font-playfair">{activity.title}</CardTitle>
                        <CardDescription className="text-sm sm:text-base">{activity.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* RSVP Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8">
        <div className="container mx-auto max-w-6xl">
          {/* Marco decorativo con título y subtítulo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative w-full mb-8 sm:mb-10"
          >
            <div 
              className="relative w-full aspect-[4/3] sm:aspect-[3/2] md:aspect-[21/10] lg:aspect-[24/10] min-h-[240px] sm:min-h-[280px] md:min-h-[320px] lg:min-h-[360px] bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: 'url(/confirmar.png)' }}
            >
              {/* Contenedor para el texto centrado en el área negra */}
              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 sm:px-10 md:px-14 lg:px-20 xl:px-24">
                <h2 className="font-playfair text-2xl sm:text-3xl md:text-4xl font-bold text-black text-center mb-2 sm:mb-3 leading-tight">
                  Confirma tu Asistencia
                </h2>
                <p className="text-black text-sm sm:text-base md:text-lg text-center max-w-2xl leading-snug">
                  <span className="block">
                    Hola{" "}
                    <span className="font-playfair font-bold text-lg sm:text-xl md:text-2xl">
                      {grupo.invitadoPrincipal.nombre}
                    </span>
                    ,
                  </span>
                  <span className="block">Esperamos que puedas venir</span>
                  <span className="block">¿Nos acompañas?</span>
                </p>
              </div>
            </div>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-4 sm:space-y-6 mt-8 sm:mt-10"
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
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">¿Alguna alergía/intolerancia?</Label>
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="principal-alergias-si"
                            checked={showAlergiasPrincipal}
                            onCheckedChange={(checked) => {
                              const next = checked === true;
                              setShowAlergiasPrincipal(next);
                              if (!next) updateInvitadoPrincipal('alergias', '');
                            }}
                          />
                          <Label htmlFor="principal-alergias-si" className="text-xs sm:text-sm cursor-pointer">Sí</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="principal-alergias-no"
                            checked={!showAlergiasPrincipal}
                            onCheckedChange={(checked) => {
                              const next = checked === true;
                              if (!next) return;
                              setShowAlergiasPrincipal(false);
                              updateInvitadoPrincipal('alergias', '');
                            }}
                          />
                          <Label htmlFor="principal-alergias-no" className="text-xs sm:text-sm cursor-pointer">No</Label>
                        </div>
                      </div>
                      {showAlergiasPrincipal && (
                        <div className="mt-2">
                          <Input
                            id="alergias-principal-readonly"
                            value={grupo.invitadoPrincipal.alergias || ''}
                            onChange={(e) => updateInvitadoPrincipal('alergias', e.target.value)}
                            placeholder="Ej: Gluten, lactosa, frutos secos..."
                            className="text-sm h-9 sm:h-10 mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Deja en blanco si no hay alergias</p>
                        </div>
                      )}
                    </div>
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
                  Transporte en Bus (Hora por confirmar)
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
                      });
                    }}
                  />
                  <Label htmlFor="confirmacion-bus" className="text-sm cursor-pointer">
                    Utilizaremos el servicio de bus
                  </Label>
                </div>
                
                {grupo.confirmacion_bus && (
                  <div className="space-y-3 sm:space-y-4 pt-2 border-t">
                    {busesArr.length === 0 ? (
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
                              const busSeleccionado = busesArr.find(b => b.id === value);
                              if (busSeleccionado) {
                                setGrupo({
                                  ...grupo,
                                  ubicacion_bus: busSeleccionado.id,
                                });
                              }
                            }}
                          >
                            <SelectTrigger id="bus-seleccionado" className="text-sm h-9 sm:h-10 mt-1">
                              <SelectValue placeholder="Selecciona un bus" />
                            </SelectTrigger>
                            <SelectContent>
                              {busesArr.map((bus) => (
                                <SelectItem key={bus.id} value={bus.id}>
                                  {bus.nombre ? `${bus.nombre} (Bus #${bus.numero})` : `Bus #${bus.numero}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
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
      </section>
    </PageLayout>
  );
};

export default RSVP;
