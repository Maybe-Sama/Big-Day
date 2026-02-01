import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, TrendingUp, Edit, Save, Plus, Copy, Check, Trash2, Eye, Heart, Baby, X, User, Bus, Minus, Table, Crown, Trophy, Camera, CheckCircle2, Download, Upload } from "lucide-react";
import PageLayout from "@/components/layouts/PageLayout";
import PageHeader from "@/components/common/PageHeader";
import { AppModal } from "@/components/common";
import AddInvitadoModal from "@/components/AddInvitadoModal";
import ConfigBusesModal from "@/components/ConfigBusesModal";
import ConfigMesasModal from "@/components/ConfigMesasModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { generateToken } from "@/lib/tokens";
import { dbService } from "@/lib/database";
import { migrateOldData } from "@/lib/migration";
import { GrupoInvitados, InvitadoStats, Acompanante } from "@/types/invitados";
import { ConfiguracionBuses } from "@/types/bus";
import { ConfiguracionMesas } from "@/types/mesas";
import { CarreraFotos, TODAS_LAS_MISIONES } from "@/types/carrera-fotos";

const AdminOculto = () => {
  const { toast } = useToast();
  
  const [grupos, setGrupos] = useState<GrupoInvitados[]>([]);
  const [stats, setStats] = useState<InvitadoStats>({
    totalGrupos: 0,
    totalPersonas: 0,
    confirmados: 0,
    pendientes: 0,
    rechazados: 0,
    totalAsistentes: 0,
    parejas: 0,
    hijos: 0,
  });
  const [showStats, setShowStats] = useState(false);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfigBusesModal, setShowConfigBusesModal] = useState(false);
  const [showConfigMesasModal, setShowConfigMesasModal] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState<GrupoInvitados | null>(null);
  const [editingGrupo, setEditingGrupo] = useState<GrupoInvitados | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [configBuses, setConfigBuses] = useState<ConfiguracionBuses | null>(null);
  const [configMesas, setConfigMesas] = useState<ConfiguracionMesas | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [asistenciaFilter, setAsistenciaFilter] = useState<'all' | 'pendiente' | 'confirmado' | 'rechazado'>('all');
  const [carreras, setCarreras] = useState<CarreraFotos[]>([]);
  const [showCarreras, setShowCarreras] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Backup/Restore
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [backupDryRunResult, setBackupDryRunResult] = useState<any | null>(null);
  const [backupConfirmText, setBackupConfirmText] = useState('');
  const [isBackupBusy, setIsBackupBusy] = useState(false);
  const [backupLastSnapshotKey, setBackupLastSnapshotKey] = useState<string | null>(null);

  // Verificar sesión al cargar
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // Intentar cargar datos para verificar si hay sesión activa
      const gruposData = await dbService.getAllGrupos();
      setIsLoggedIn(true);
      loadAllData();
    } catch (error: any) {
      // Si es 401, no hay sesión
      if (error.message.includes('401') || error.message.includes('No autorizado')) {
        setIsLoggedIn(false);
      } else {
        // Otro error, mostrar toast
        toast({
          title: "Error",
          description: "No se pudo verificar la sesión. Inténtalo más tarde.",
          variant: "destructive",
        });
      }
    } finally {
      setIsCheckingSession(false);
    }
  };

  const loadAllData = async () => {
    loadGrupos();
    
    // Cargar configuración de mesas
    const loadMesasConfig = async () => {
      try {
        const mesasConfig = await dbService.getConfiguracionMesas();
        setConfigMesas(mesasConfig);
      } catch (error) {
        console.error('Error cargando configuración de mesas:', error);
      }
    };
    loadMesasConfig();

    // Cargar carreras de fotos
    const loadCarreras = async () => {
      try {
        const carrerasData = await dbService.getAllCarreras();
        setCarreras(carrerasData);
      } catch (error) {
        console.error('Error cargando carreras:', error);
      }
    };
    loadCarreras();
  };

  const downloadBackup = async () => {
    setIsBackupBusy(true);
    setBackupLastSnapshotKey(null);
    try {
      const response = await fetch('/api/admin?action=backup-export', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        let message = `Error ${response.status}`;
        try {
          const data = await response.json();
          if (data?.error) message = data.error;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const disposition = response.headers.get('content-disposition') || '';
      const filenameMatch = disposition.match(/filename=\"?([^\";]+)\"?/i);
      const filename = filenameMatch?.[1] || `big-day-backup.json`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({
        title: "Backup descargado",
        description: "Se descargó el archivo de backup correctamente.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message ? `No se pudo descargar: ${error.message}` : "No se pudo descargar el backup.",
        variant: "destructive",
      });
    } finally {
      setIsBackupBusy(false);
    }
  };

  const readBackupFileJson = async (file: File): Promise<unknown> => {
    const text = await file.text();
    return JSON.parse(text);
  };

  const runBackupDryRun = async () => {
    if (!backupFile) {
      toast({ title: "Error", description: "Selecciona un archivo .json primero.", variant: "destructive" });
      return;
    }
    setIsBackupBusy(true);
    setBackupDryRunResult(null);
    setBackupLastSnapshotKey(null);
    try {
      const payload = await readBackupFileJson(backupFile);
      const response = await fetch('/api/admin?action=backup-import&mode=dry-run', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || `Error ${response.status}`);
      }

      setBackupDryRunResult(data);
      toast({
        title: "Backup analizado",
        description: "Dry-run completado. Revisa el resumen antes de restaurar.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message ? `No se pudo analizar: ${error.message}` : "No se pudo analizar el backup.",
        variant: "destructive",
      });
    } finally {
      setIsBackupBusy(false);
    }
  };

  const applyBackupRestore = async () => {
    if (!backupFile) {
      toast({ title: "Error", description: "Selecciona un archivo .json primero.", variant: "destructive" });
      return;
    }
    if (backupConfirmText.trim() !== 'RESTORE') {
      toast({
        title: "Confirmación requerida",
        description: "Escribe RESTORE para habilitar la restauración.",
        variant: "destructive",
      });
      return;
    }
    setIsBackupBusy(true);
    setBackupLastSnapshotKey(null);
    try {
      const payload = await readBackupFileJson(backupFile);
      const response = await fetch('/api/admin?action=backup-import&mode=apply', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || `Error ${response.status}`);
      }

      setBackupLastSnapshotKey(data?.snapshotKey || null);
      setBackupConfirmText('');
      setBackupDryRunResult(null);

      toast({
        title: "Backup restaurado",
        description: data?.snapshotKey
          ? `Restauración completada. Snapshot guardado: ${data.snapshotKey}`
          : "Restauración completada.",
      });

      // Recargar todo el panel
      loadAllData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message ? `No se pudo restaurar: ${error.message}` : "No se pudo restaurar el backup.",
        variant: "destructive",
      });
    } finally {
      setIsBackupBusy(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKeyInput.trim()) {
      toast({
        title: "Error",
        description: "Por favor, introduce la clave de administración",
        variant: "destructive",
      });
      return;
    }

    setIsLoggingIn(true);
    try {
      const response = await fetch('/api/admin?action=login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ key: adminKeyInput }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(error.error || 'Error al iniciar sesión');
      }

      const data = await response.json();
      if (data.ok) {
        // Verificar inmediatamente que la sesión funciona
        try {
          const gruposData = await dbService.getAllGrupos();
          // Si llegamos aquí, la sesión funciona
          setIsLoggedIn(true);
          setAdminKeyInput('');
          loadAllData();
          toast({
            title: "Sesión iniciada",
            description: "Has iniciado sesión correctamente",
          });
        } catch (sessionError: any) {
          // Si falla con 401, la cookie no se creó o no se está enviando
          if (sessionError.message.includes('401') || sessionError.message.includes('No autorizado')) {
            toast({
              title: "Error de sesión",
              description: "Sesión no creada correctamente. Revisa que las cookies estén habilitadas en tu navegador.",
              variant: "destructive",
            });
            console.error('[Login] La sesión no se creó correctamente. Verifica Set-Cookie en la respuesta del login.');
          } else {
            throw sessionError;
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Error de autenticación",
        description: error.message || "La clave de administración es incorrecta",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/admin?action=logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setIsLoggedIn(false);
        setGrupos([]);
        setStats({
          totalGrupos: 0,
          totalPersonas: 0,
          confirmados: 0,
          pendientes: 0,
          rechazados: 0,
          totalAsistentes: 0,
          parejas: 0,
          hijos: 0,
        });
        setConfigBuses(null);
        setConfigMesas(null);
        setCarreras([]);
        toast({
          title: "Sesión cerrada",
          description: "Has cerrado sesión correctamente",
        });
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión. Inténtalo más tarde.",
        variant: "destructive",
      });
    }
  };

  const loadGrupos = async () => {
    try {
      
      // Cargar datos
      const gruposData = await dbService.getAllGrupos();
      const statsData = await dbService.getStats();
      setGrupos(gruposData);
      setStats(statsData);
      
      // Debug: Mostrar información de grupos en consola
      console.log("=== DEBUG: Grupos en Base de Datos ===");
      console.log(`Total de grupos encontrados: ${gruposData.length}`);
      if (gruposData.length > 0) {
        console.log("Grupos encontrados:");
        gruposData.forEach((grupo, index) => {
          console.log(`\n[${index + 1}] Grupo ID: ${grupo.id}`);
          console.log(`  - Invitado Principal: ${grupo.invitadoPrincipal.nombre} ${grupo.invitadoPrincipal.apellidos}`);
          console.log(`  - Token: ${grupo.token}`);
          console.log(`  - Acompañantes: ${grupo.acompanantes.length}`);
          console.log(`  - Asistencia: ${grupo.asistencia}`);
          console.log(`  - Confirmación Bus: ${grupo.confirmacion_bus}`);
        });
      } else {
        console.log("⚠️ No hay grupos en la base de datos");
      }
      console.log("=== Fin Debug ===");
    } catch (error) {
      console.error("Error loading grupos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los grupos de invitados",
        variant: "destructive",
      });
    }
  };

  const handleSaveGrupo = async (grupo: GrupoInvitados) => {
    console.log("=== DEBUG: handleSaveGrupo llamado ===");
    console.log("Grupo recibido:", grupo);
    
    try {
      console.log("Iniciando guardado en base de datos...");
      await dbService.saveGrupo(grupo);
      console.log("✅ Grupo guardado exitosamente");
      
      console.log("Recargando grupos...");
      await loadGrupos();
      console.log("✅ Grupos recargados");
      
      toast({
        title: "Grupo creado",
        description: `Grupo de ${grupo.invitadoPrincipal.nombre} ${grupo.invitadoPrincipal.apellidos} creado exitosamente`,
      });
    } catch (error) {
      console.error("❌ Error saving grupo:", error);
      console.error("Detalles del error:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      toast({
        title: "Error",
        description: `No se pudo guardar el grupo: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  };

  const handleGenerateToken = async (grupoId: string) => {
    try {
      const grupo = grupos.find(g => g.id === grupoId);
      if (!grupo) return;

      const newToken = generateToken();
      const updatedGrupo = { ...grupo, token: newToken, fechaActualizacion: new Date().toISOString() };
      
      await dbService.saveGrupo(updatedGrupo);
      await loadGrupos();
      
      toast({
        title: "Token generado",
        description: `Nuevo token: ${newToken}`,
      });
    } catch (error) {
      console.error("Error generating token:", error);
      toast({
        title: "Error",
        description: "No se pudo generar el token",
        variant: "destructive",
      });
    }
  };

  const handleSendInvitation = (grupo: GrupoInvitados) => {
    // Usar variable de entorno si está disponible, sino usar window.location.origin
    const baseUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
    const invitationLink = `${baseUrl}/rsvp?token=${grupo.token}`;
    
    navigator.clipboard.writeText(invitationLink).then(() => {
      setCopiedTokenId(grupo.id);
      setTimeout(() => setCopiedTokenId(null), 3000);
      
      toast({
        title: "Link de invitación copiado",
        description: `Puedes enviarlo a ${grupo.invitadoPrincipal.nombre} ${grupo.invitadoPrincipal.apellidos} por WhatsApp o donde prefieras`,
      });
    }).catch(() => {
      toast({
        title: "Link generado",
        description: invitationLink,
        variant: "destructive",
      });
    });
  };

  const handleDeleteGrupo = async (grupoId: string) => {
    try {
      await dbService.deleteGrupo(grupoId);
      await loadGrupos();
      toast({
        title: "Grupo eliminado",
        description: "El grupo ha sido eliminado exitosamente",
      });
    } catch (error) {
      console.error("Error deleting grupo:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el grupo",
        variant: "destructive",
      });
    }
  };

  const handleViewGrupo = async (grupo: GrupoInvitados) => {
    setSelectedGrupo(grupo);
    setEditingGrupo({ ...grupo }); // Crear copia para edición
    setIsEditing(false);
    
    // Cargar configuración de buses y mesas
    const busesConfig = await dbService.getConfiguracionBuses();
    const mesasConfig = await dbService.getConfiguracionMesas();
    setConfigBuses(busesConfig);
    setConfigMesas(mesasConfig);
  };

  const handleStartEdit = async () => {
    if (selectedGrupo) {
      setIsEditing(true);
      setEditingGrupo({ ...selectedGrupo }); // Crear copia editable
      
      // Asegurar que tenemos la configuración de mesas cargada
      if (!configMesas) {
        const mesasConfig = await dbService.getConfiguracionMesas();
        setConfigMesas(mesasConfig);
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingGrupo(null);
  };

  const updateEditingGrupo = (field: keyof GrupoInvitados, value: any) => {
    if (!editingGrupo) return;
    setEditingGrupo({ ...editingGrupo, [field]: value });
  };

  const updateInvitadoPrincipal = (field: keyof GrupoInvitados['invitadoPrincipal'], value: string | boolean | 'pendiente' | 'confirmado' | 'rechazado') => {
    if (!editingGrupo) return;
    setEditingGrupo({
      ...editingGrupo,
      invitadoPrincipal: {
        ...editingGrupo.invitadoPrincipal,
        [field]: value,
      },
    });
  };

  const addAcompananteEdit = (tipo: 'pareja' | 'hijo') => {
    if (!editingGrupo) return;
    const nuevoAcompanante: Acompanante = {
      id: Date.now().toString(),
      nombre: '',
      apellidos: '',
      tipo,
      asistencia: 'pendiente',
      alergias: '',
      ...(tipo === 'hijo' && { edad: 0 }),
    };
    setEditingGrupo({
      ...editingGrupo,
      acompanantes: [...editingGrupo.acompanantes, nuevoAcompanante],
    });
  };

  const removeAcompananteEdit = (id: string) => {
    if (!editingGrupo) return;
    setEditingGrupo({
      ...editingGrupo,
      acompanantes: editingGrupo.acompanantes.filter(ac => ac.id !== id),
    });
  };

  const updateAcompananteEdit = (id: string, field: keyof Acompanante, value: string | number | boolean | 'pendiente' | 'confirmado' | 'rechazado' | undefined) => {
    if (!editingGrupo) return;
    setEditingGrupo({
      ...editingGrupo,
      acompanantes: editingGrupo.acompanantes.map(ac =>
        ac.id === id ? { ...ac, [field]: value } : ac
      ),
    });
  };

  const handleSaveEdit = async () => {
    if (!editingGrupo) return;

    try {
      // Validar datos
      if (!editingGrupo.invitadoPrincipal.nombre || !editingGrupo.invitadoPrincipal.apellidos) {
        toast({
          title: "Error",
          description: "El nombre y apellidos del invitado principal son obligatorios",
          variant: "destructive",
        });
        return;
      }

      // Filtrar acompañantes válidos
      const acompanantesValidos = editingGrupo.acompanantes.filter(ac => ac.nombre && ac.apellidos);

      // Validar acompañantes: si tienen nombre, deben tener apellidos
      const acompanantesInvalidos = acompanantesValidos.filter(ac => 
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

      // Confirmación bus: true si algún miembro usa bus
      const algunoUsaBus =
        editingGrupo.invitadoPrincipal.confirmacion_bus === true ||
        acompanantesValidos.some(ac => ac.confirmacion_bus === true) ||
        editingGrupo.confirmacion_bus;

      // Obtener información del bus si está seleccionado
      const busIdSeleccionado = editingGrupo.ubicacion_bus;
      const busInfo = configBuses?.buses.find(b => 
        b.id === busIdSeleccionado || 
        b.nombre === busIdSeleccionado ||
        `Bus #${b.numero}` === busIdSeleccionado
      );

      const grupoActualizado: GrupoInvitados = {
        ...editingGrupo,
        invitadoPrincipal: {
          ...editingGrupo.invitadoPrincipal,
          alergias: editingGrupo.invitadoPrincipal.alergias?.trim() || undefined,
        },
        acompanantes: acompanantesValidos.map(ac => ({
          ...ac,
          alergias: ac.alergias?.trim() || undefined,
        })),
        asistencia: editingGrupo.asistencia,
        confirmacion_bus: algunoUsaBus,
        fechaActualizacion: new Date().toISOString(),
        notas: editingGrupo.notas?.trim() || undefined,
        ubicacion_bus: algunoUsaBus && busInfo?.nombre 
          ? busInfo.nombre 
          : (algunoUsaBus && busInfo ? `Bus #${busInfo.numero}` : undefined),
      };

      await dbService.saveGrupo(grupoActualizado);
      await loadGrupos();
      
      setSelectedGrupo(grupoActualizado);
      setIsEditing(false);
      setEditingGrupo(null);
      
      toast({
        title: "Grupo actualizado",
        description: "Los cambios se han guardado exitosamente",
      });
    } catch (error) {
      console.error("Error saving grupo:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar los cambios",
        variant: "destructive",
      });
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredGrupos = grupos.filter(grupo => {
    const matchesSearch = !normalizedSearch ||
      grupo.invitadoPrincipal.nombre.toLowerCase().includes(normalizedSearch) ||
      grupo.invitadoPrincipal.apellidos.toLowerCase().includes(normalizedSearch);

    const matchesAsistencia = asistenciaFilter === 'all' ||
      grupo.invitadoPrincipal.asistencia === asistenciaFilter;

    return matchesSearch && matchesAsistencia;
  });

  // Pantalla de carga mientras verifica sesión
  if (isCheckingSession) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verificando sesión...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Pantalla de login
  if (!isLoggedIn) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Panel de Administración</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminKey">Clave de Administración</Label>
                  <Input
                    id="adminKey"
                    type="password"
                    value={adminKeyInput}
                    onChange={(e) => setAdminKeyInput(e.target.value)}
                    placeholder="Introduce la clave de administración"
                    disabled={isLoggingIn}
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoggingIn}>
                  {isLoggingIn ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </form>
              <div className="mt-4 p-3 bg-muted rounded-md text-sm text-muted-foreground">
                <p className="font-semibold mb-1">⚠️ Nota importante:</p>
                <p>Este panel requiere cookies habilitadas. Si tienes problemas al iniciar sesión, verifica que tu navegador permita cookies para este sitio.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="pt-12 sm:pt-14 md:pt-16 pb-8 sm:pb-12 md:pb-16 px-3 sm:px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex justify-between items-center pt-8 sm:pt-10 md:pt-12 pb-4 sm:pb-6">
            <PageHeader
              title="Panel de los Novios"
              description="Gestiona tus invitados y confirmaciones"
              variant="simple"
              className="pb-0"
            />
            <Button variant="outline" onClick={handleLogout} className="ml-4">
              Cerrar Sesión
            </Button>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-4 sm:mb-6"
          >
            <div className="bg-card rounded-lg shadow-soft p-2.5 sm:p-3 md:p-4 lg:p-6 text-center">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-primary mx-auto mb-0.5 sm:mb-1" />
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight">{stats.totalGrupos}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Grupos</div>
            </div>
            
            <div className="bg-card rounded-lg shadow-soft p-2.5 sm:p-3 md:p-4 lg:p-6 text-center">
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-blue-600 leading-tight">{stats.totalPersonas}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Personas</div>
            </div>
            
            <div className="bg-card rounded-lg shadow-soft p-2.5 sm:p-3 md:p-4 lg:p-6 text-center">
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-green-600 leading-tight">{stats.confirmados}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Confirmados</div>
            </div>
            
            <div className="bg-card rounded-lg shadow-soft p-2.5 sm:p-3 md:p-4 lg:p-6 text-center">
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-yellow-600 leading-tight">{stats.pendientes}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Pendientes</div>
            </div>
            
            <div className="bg-card rounded-lg shadow-soft p-2.5 sm:p-3 md:p-4 lg:p-6 text-center">
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-red-600 leading-tight">{stats.rechazados}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Rechazados</div>
            </div>
            
            <div className="bg-card rounded-lg shadow-soft p-2.5 sm:p-3 md:p-4 lg:p-6 text-center">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-pink-500 mx-auto mb-0.5 sm:mb-1" />
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-pink-600 leading-tight">{stats.parejas}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Parejas</div>
            </div>
            
            <div className="bg-gradient-gold rounded-lg shadow-gold p-2.5 sm:p-3 md:p-4 lg:p-6 text-center text-white">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 mx-auto mb-0.5 sm:mb-1" />
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight">{stats.totalAsistentes}</div>
              <div className="text-[10px] sm:text-xs opacity-90 mt-0.5">Asistentes</div>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-2 mb-4 sm:mb-6"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={() => setShowAddModal(true)} 
                className="shadow-gold w-full sm:flex-1 text-sm h-9 sm:h-10"
                size="sm"
              >
                <Plus className="mr-2 w-4 h-4" />
                Añadir Grupo
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowStats(!showStats)}
                className="w-full sm:flex-1 text-sm h-9 sm:h-10"
                size="sm"
              >
                <TrendingUp className="mr-2 w-4 h-4" />
                {showStats ? "Ocultar" : "Ver"} estadísticas
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowConfigBusesModal(true)}
                className="w-full sm:flex-1 text-sm h-9 sm:h-10"
                size="sm"
              >
                <Bus className="mr-2 w-4 h-4" />
                Configurar Buses y Paradas
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowConfigMesasModal(true)}
                className="w-full sm:flex-1 text-sm h-9 sm:h-10"
                size="sm"
              >
                <Table className="mr-2 w-4 h-4" />
                Configurar Mesas
              </Button>
              <Button 
                variant="outline" 
                onClick={async () => {
                  setShowCarreras(!showCarreras);
                  if (!showCarreras) {
                    const carrerasData = await dbService.getAllCarreras();
                    setCarreras(carrerasData);
                  }
                }}
                className="w-full sm:flex-1 text-sm h-9 sm:h-10"
                size="sm"
              >
                <Trophy className="mr-2 w-4 h-4" />
                {showCarreras ? "Ocultar" : "Ver"} Carreras de Fotos
              </Button>
              <Button 
                variant="outline" 
                onClick={async () => {
                  const gruposData = await dbService.getAllGrupos();
                  console.log("=== VERIFICACIÓN DE BASE DE DATOS ===");
                  console.log(`Total grupos: ${gruposData.length}`);
                  console.log("Grupos:", gruposData);
                  toast({
                    title: "Información de Base de Datos",
                    description: `Se encontraron ${gruposData.length} grupo(s) en la base de datos. Revisa la consola para más detalles.`,
                  });
                }}
                className="w-full sm:flex-1 text-sm h-9 sm:h-10"
                size="sm"
              >
                <Users className="mr-2 w-4 h-4" />
                Verificar BD
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Buscar por nombre o apellidos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-sm h-9 sm:h-10"
              />
              <Select
                value={asistenciaFilter}
                onValueChange={(value: 'all' | 'pendiente' | 'confirmado' | 'rechazado') => setAsistenciaFilter(value)}
              >
                <SelectTrigger className="w-full sm:w-[240px] text-sm h-9 sm:h-10">
                  <SelectValue placeholder="Filtrar por confirmación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="rechazado">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Backup / Restore */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              <Card>
                <CardHeader className="p-4 sm:p-5">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Descargar backup
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 pt-0">
                  <p className="text-sm text-muted-foreground mb-3">
                    Descarga un JSON con invitados + configuración (mesas, buses, carreras).
                  </p>
                  <Button
                    onClick={downloadBackup}
                    disabled={isBackupBusy}
                    className="w-full"
                  >
                    {isBackupBusy ? "Preparando..." : "Descargar backup"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 sm:p-5">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Restaurar backup
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 pt-0 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="backupFile">Archivo JSON</Label>
                    <Input
                      id="backupFile"
                      type="file"
                      accept="application/json"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setBackupFile(f);
                        setBackupDryRunResult(null);
                        setBackupLastSnapshotKey(null);
                        setBackupConfirmText('');
                      }}
                      disabled={isBackupBusy}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={runBackupDryRun}
                      disabled={!backupFile || isBackupBusy}
                      className="w-full"
                    >
                      Analizar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={applyBackupRestore}
                      disabled={!backupFile || isBackupBusy || backupConfirmText.trim() !== 'RESTORE'}
                      className="w-full"
                    >
                      Aplicar
                    </Button>
                  </div>

                  {backupDryRunResult && (
                    <div className="rounded-md border bg-muted/30 p-3 text-xs overflow-auto max-h-48">
                      <pre className="whitespace-pre-wrap break-words">
                        {JSON.stringify(backupDryRunResult, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="restoreConfirm" className="text-sm">
                      Confirmación (escribe <code>RESTORE</code>)
                    </Label>
                    <Input
                      id="restoreConfirm"
                      value={backupConfirmText}
                      onChange={(e) => setBackupConfirmText(e.target.value)}
                      placeholder="RESTORE"
                      disabled={isBackupBusy}
                    />
                    {backupLastSnapshotKey && (
                      <p className="text-xs text-muted-foreground">
                        Snapshot guardado en KV: <code>{backupLastSnapshotKey}</code>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Mobile Cards View */}
          <div className="block md:hidden space-y-2">
            {filteredGrupos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No hay grupos de invitados</p>
                {searchTerm && (
                  <p className="text-xs mt-1">No se encontraron resultados para "{searchTerm}"</p>
                )}
              </div>
            ) : (
              filteredGrupos.map((grupo) => {
              const totalPersonas = 1 + grupo.acompanantes.length;
              return (
                <motion.div
                  key={grupo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-lg shadow-soft p-3"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base mb-0.5 truncate">
                        {grupo.invitadoPrincipal.nombre} {grupo.invitadoPrincipal.apellidos}
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge
                          variant={
                            grupo.invitadoPrincipal.asistencia === "confirmado"
                              ? "default"
                              : grupo.invitadoPrincipal.asistencia === "rechazado"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-[10px] px-1.5 py-0"
                        >
                          {grupo.invitadoPrincipal.asistencia}
                        </Badge>
                        <Badge
                          variant={
                            grupo.asistencia === "confirmado"
                              ? "default"
                              : grupo.asistencia === "rechazado"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-[10px] px-1.5 py-0"
                        >
                          Grupo: {grupo.asistencia}
                        </Badge>
                        {(() => {
                          const busConfirmado = grupo.confirmacion_bus === true;
                          const busPendiente = grupo.asistencia === 'pendiente';
                          const busEstado = busConfirmado ? 'confirmado' : busPendiente ? 'pendiente' : 'denegado';
                          return (
                            <Badge
                              variant={
                                busEstado === "confirmado"
                                  ? "default"
                                  : busEstado === "denegado"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-[10px] px-1.5 py-0"
                            >
                              <Bus className="w-2.5 h-2.5 mr-0.5 inline" />
                              {busEstado}
                            </Badge>
                          );
                        })()}
                        {grupo.mesa && (() => {
                          const mesaConfig = configMesas?.mesas.find(m => m.id === grupo.mesa);
                          if (mesaConfig) {
                            return (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                <Table className="w-2.5 h-2.5 mr-1" />
                                {mesaConfig.nombre}
                              </Badge>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg sm:text-xl font-bold">{totalPersonas}</div>
                      <div className="text-[10px] text-muted-foreground">personas</div>
                    </div>
                  </div>

                  {grupo.acompanantes.length > 0 && (
                    <div className="mb-2 pt-2 border-t space-y-1">
                      {grupo.acompanantes.map((acompanante) => (
                        <div key={acompanante.id} className="flex items-center justify-between text-[10px] sm:text-xs">
                          <div className="flex items-center gap-1 min-w-0 flex-1">
                            {acompanante.tipo === 'pareja' ? (
                              <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-pink-500 flex-shrink-0" />
                            ) : (
                              <Baby className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-500 flex-shrink-0" />
                            )}
                            <span className="truncate">{acompanante.nombre} {acompanante.apellidos}</span>
                          </div>
                          <Badge
                            variant={
                              acompanante.asistencia === "confirmado"
                                ? "default"
                                : acompanante.asistencia === "rechazado"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-[10px] px-1.5 py-0 ml-1 flex-shrink-0"
                          >
                            {acompanante.asistencia}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-2 border-t">
                    <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded flex-1 truncate">
                      {grupo.token}
                    </code>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewGrupo(grupo)}
                        className="h-7 w-7 p-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleGenerateToken(grupo.id)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSendInvitation(grupo)}
                        className={`h-7 w-7 p-0 ${copiedTokenId === grupo.id ? "bg-green-600 hover:bg-green-700" : ""}`}
                      >
                        {copiedTokenId === grupo.id ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteGrupo(grupo.id)}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })
            )}
          </div>

          {/* Desktop Table View */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="hidden md:block bg-card rounded-xl sm:rounded-2xl shadow-soft overflow-hidden"
          >
            <div className="overflow-x-auto">
              <TableComponent>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-sm">Invitado Principal</TableHead>
                    <TableHead className="text-sm">Acompañantes</TableHead>
                    <TableHead className="text-sm">Total Personas</TableHead>
                    <TableHead className="text-sm">Asistencia</TableHead>
                    <TableHead className="text-sm">Bus</TableHead>
                    <TableHead className="text-sm">Mesa</TableHead>
                    <TableHead className="text-sm">Token</TableHead>
                    <TableHead className="text-right text-sm">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGrupos.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Users className="w-12 h-12 mb-4 opacity-50" />
                          <p className="text-sm">No hay grupos de invitados</p>
                          {searchTerm && (
                            <p className="text-xs mt-1">No se encontraron resultados para "{searchTerm}"</p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredGrupos.map((grupo) => {
                      const totalPersonas = 1 + grupo.acompanantes.length;
                      
                      return (
                        <TableRow key={grupo.id}>
                        <TableCell className="text-sm">
                          <div>
                            <div className="font-medium">
                              {grupo.invitadoPrincipal.nombre} {grupo.invitadoPrincipal.apellidos}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant={
                                  grupo.invitadoPrincipal.asistencia === "confirmado"
                                    ? "default"
                                    : grupo.invitadoPrincipal.asistencia === "rechazado"
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {grupo.invitadoPrincipal.asistencia}
                              </Badge>
                            </div>
                            {grupo.notas && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {grupo.notas}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="space-y-1">
                            {grupo.acompanantes.length === 0 ? (
                              <span className="text-muted-foreground text-xs">Sin acompañantes</span>
                            ) : (
                              grupo.acompanantes.map((acompanante) => (
                                <div key={acompanante.id} className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    {acompanante.tipo === 'pareja' ? (
                                      <Heart className="w-3 h-3 text-pink-500" />
                                    ) : (
                                      <Baby className="w-3 h-3 text-blue-500" />
                                    )}
                                    <span className="text-xs font-medium">
                                      {acompanante.nombre} {acompanante.apellidos}
                                    </span>
                                  </div>
                                  <Badge
                                    variant={
                                      acompanante.asistencia === "confirmado"
                                        ? "default"
                                        : acompanante.asistencia === "rechazado"
                                        ? "destructive"
                                        : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    {acompanante.asistencia}
                                  </Badge>
                                </div>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="text-center">
                            <div className="text-lg font-bold">{totalPersonas}</div>
                            <div className="text-xs text-muted-foreground">personas</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <Badge
                            variant={
                              grupo.asistencia === "confirmado"
                                ? "default"
                                : grupo.asistencia === "rechazado"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {grupo.asistencia}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {(() => {
                            const busConfirmado = grupo.confirmacion_bus === true;
                            const busPendiente = grupo.asistencia === 'pendiente';
                            const busEstado = busConfirmado ? 'confirmado' : busPendiente ? 'pendiente' : 'denegado';
                            return (
                              <Badge
                                variant={
                                  busEstado === "confirmado"
                                    ? "default"
                                    : busEstado === "denegado"
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                <Bus className="w-3 h-3 mr-1 inline" />
                                {busEstado}
                              </Badge>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {grupo.mesa ? (
                            (() => {
                              const mesaConfig = configMesas?.mesas.find(m => m.id === grupo.mesa);
                              if (mesaConfig) {
                                return (
                                  <Badge variant="outline" className="text-xs">
                                    <Table className="w-3 h-3 mr-1" />
                                    {mesaConfig.nombre}
                                  </Badge>
                                );
                              }
                              return <span className="text-xs text-muted-foreground">Mesa eliminada</span>;
                            })()
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin mesa</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {grupo.token}
                          </code>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewGrupo(grupo)}
                              title="Ver detalles"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleGenerateToken(grupo.id)}
                              title="Generar nuevo token"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSendInvitation(grupo)}
                              title="Copiar link de invitación"
                              className={copiedTokenId === grupo.id ? "bg-green-600 hover:bg-green-700" : ""}
                            >
                              {copiedTokenId === grupo.id ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteGrupo(grupo.id)}
                              title="Eliminar grupo"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                  )}
                </TableBody>
              </TableComponent>
            </div>
          </motion.div>

          {showStats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-6 sm:mt-8 bg-card rounded-xl sm:rounded-2xl shadow-soft p-5 sm:p-6 md:p-8"
            >
              <h2 className="font-playfair text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
                Estadísticas Detalladas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-3">Tasa de confirmación</h3>
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>Confirmados</span>
                      <span className="font-bold text-green-600">
                        {stats.totalGrupos > 0 ? ((stats.confirmados / stats.totalGrupos) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Pendientes</span>
                      <span className="font-bold text-yellow-600">
                        {stats.totalGrupos > 0 ? ((stats.pendientes / stats.totalGrupos) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Rechazados</span>
                      <span className="font-bold text-red-600">
                        {stats.totalGrupos > 0 ? ((stats.rechazados / stats.totalGrupos) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-3">Composición de acompañantes</h3>
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-1.5 sm:gap-2">
                        <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-pink-500" />
                        Parejas
                      </span>
                      <span className="font-bold text-pink-600">{stats.parejas}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-1.5 sm:gap-2">
                        <Baby className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                        Hijos
                      </span>
                      <span className="font-bold text-blue-600">{stats.hijos}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Total personas</span>
                      <span className="font-bold text-primary">{stats.totalPersonas}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-3">Proyección de asistentes</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm mb-2">
                    Total de personas que asistirán:
                  </p>
                  <div className="text-3xl sm:text-4xl font-bold text-primary">
                    {stats.totalAsistentes}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                    de {stats.totalPersonas} personas invitadas
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Sección de Carreras de Fotos */}
          {showCarreras && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 sm:mt-8 bg-card rounded-xl sm:rounded-2xl shadow-soft p-5 sm:p-6 md:p-8"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="font-playfair text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
                  Carreras de Fotos
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const carrerasData = await dbService.getAllCarreras();
                    setCarreras(carrerasData);
                    toast({
                      title: "Carreras actualizadas",
                      description: `Se cargaron ${carrerasData.length} carrera(s) de fotos`,
                    });
                  }}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Actualizar
                </Button>
              </div>

              {carreras.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No hay carreras de fotos iniciadas</p>
                  <p className="text-xs mt-1">Las carreras se crean automáticamente cuando un invitado accede a su mesa</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {carreras
                    .sort((a, b) => {
                      // Ordenar: primero las completadas (por fecha), luego por progreso
                      if (a.completada && !b.completada) return -1;
                      if (!a.completada && b.completada) return 1;
                      if (a.completada && b.completada) {
                        const fechaA = a.fechaCompletada ? new Date(a.fechaCompletada).getTime() : 0;
                        const fechaB = b.fechaCompletada ? new Date(b.fechaCompletada).getTime() : 0;
                        return fechaA - fechaB; // Primera completada primero
                      }
                      const totalMisionesA = a.misiones.length || 7;
                      const totalMisionesB = b.misiones.length || 7;
                      const progresoA = (a.fotos.filter(f => f.validada).length / totalMisionesA) * 100;
                      const progresoB = (b.fotos.filter(f => f.validada).length / totalMisionesB) * 100;
                      return progresoB - progresoA; // Mayor progreso primero
                    })
                    .map((carrera) => {
                      const mesaConfig = configMesas?.mesas.find(m => m.id === carrera.mesaId);
                      const totalMisiones = carrera.misiones.length || 7;
                      const misionesCompletadas = carrera.fotos.filter(f => f.validada).length;
                      const progreso = (misionesCompletadas / totalMisiones) * 100;
                      const fotosPendientes = carrera.fotos.filter(f => !f.validada);

                      return (
                        <Card key={carrera.mesaId} className="border-2">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <CardTitle className="flex items-center gap-2 text-lg">
                                {mesaConfig ? (
                                  <>
                                    <Table className="w-5 h-5" />
                                    {mesaConfig.nombre}
                                  </>
                                ) : (
                                  <>Mesa {carrera.mesaId}</>
                                )}
                                {carrera.completada && (
                                  <Badge className="bg-green-500 text-white">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    ¡Completada!
                                  </Badge>
                                )}
                              </CardTitle>
                              <div className="text-sm text-muted-foreground">
                                {misionesCompletadas} / {totalMisiones} misiones
                              </div>
                            </div>
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span>Progreso</span>
                                <span className="font-bold">{Math.round(progreso)}%</span>
                              </div>
                              <Progress value={progreso} className="h-2" />
                            </div>
                            {carrera.fechaCompletada && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Completada: {new Date(carrera.fechaCompletada).toLocaleString("es-ES")}
                              </p>
                            )}
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-semibold text-sm mb-2">Misiones asignadas:</h4>
                                <div className="flex flex-wrap gap-1">
                                  {carrera.misiones.map((misionId) => {
                                    const mision = TODAS_LAS_MISIONES.find(m => m.id === misionId);
                                    const foto = carrera.fotos.find(f => f.misionId === misionId);
                                    const validada = foto?.validada || false;
                                    
                                    return (
                                      <Badge
                                        key={misionId}
                                        variant={validada ? "default" : foto ? "outline" : "secondary"}
                                        className={`text-xs ${
                                          validada ? "bg-green-500" : foto ? "border-yellow-500" : ""
                                        }`}
                                      >
                                        {validada ? (
                                          <CheckCircle2 className="w-3 h-3 mr-1" />
                                        ) : foto ? (
                                          <Camera className="w-3 h-3 mr-1" />
                                        ) : null}
                                        {misionId}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </div>

                              {fotosPendientes.length > 0 && (
                                <div>
                                  <h4 className="font-semibold text-sm mb-2 text-yellow-700">
                                    Fotos pendientes de validación ({fotosPendientes.length}):
                                  </h4>
                                  <div className="space-y-2">
                                    {fotosPendientes.map((foto) => {
                                      const mision = TODAS_LAS_MISIONES.find(m => m.id === foto.misionId);
                                      return (
                                        <div
                                          key={foto.id}
                                          className="flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-200"
                                        >
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate">
                                              Misión {foto.misionId}: {mision?.titulo}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              Por: {foto.nombreInvitado}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {new Date(foto.fechaSubida).toLocaleString("es-ES")}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-2 ml-2">
                                            {foto.url && (
                                              <a
                                                href={foto.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:underline"
                                              >
                                                Ver foto
                                              </a>
                                            )}
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-7 text-xs"
                                              onClick={async () => {
                                                const fotoActualizada = { ...foto, validada: true };
                                                const carreraActualizada: CarreraFotos = {
                                                  ...carrera,
                                                  fotos: carrera.fotos.map(f =>
                                                    f.id === foto.id ? fotoActualizada : f
                                                  ),
                                                };
                                                await dbService.saveCarrera(carreraActualizada);
                                                const carrerasData = await dbService.getAllCarreras();
                                                setCarreras(carrerasData);
                                                toast({
                                                  title: "Foto validada",
                                                  description: `La misión ${foto.misionId} ha sido marcada como completada`,
                                                });
                                              }}
                                            >
                                              <CheckCircle2 className="w-3 h-3 mr-1" />
                                              Validar
                                            </Button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {carrera.fotos.filter(f => f.validada).length > 0 && (
                                <div>
                                  <h4 className="font-semibold text-sm mb-2 text-green-700">
                                    Fotos validadas ({carrera.fotos.filter(f => f.validada).length}):
                                  </h4>
                                  <div className="space-y-1">
                                    {carrera.fotos
                                      .filter(f => f.validada)
                                      .map((foto) => {
                                        const mision = TODAS_LAS_MISIONES.find(m => m.id === foto.misionId);
                                        return (
                                          <div
                                            key={foto.id}
                                            className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200"
                                          >
                                            <div className="flex-1">
                                              <p className="text-xs font-medium">
                                                Misión {foto.misionId}: {mision?.titulo}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                Por: {foto.nombreInvitado}
                                              </p>
                                            </div>
                                            {foto.url && (
                                              <a
                                                href={foto.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:underline ml-2"
                                              >
                                                Ver foto
                                              </a>
                                            )}
                                          </div>
                                        );
                                      })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddInvitadoModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveGrupo}
      />

      <ConfigBusesModal
        isOpen={showConfigBusesModal}
        onClose={() => setShowConfigBusesModal(false)}
      />

      <ConfigMesasModal
        isOpen={showConfigMesasModal}
        onClose={async () => {
          setShowConfigMesasModal(false);
          // Recargar configuración de mesas si estamos editando un grupo
          if (selectedGrupo) {
            const mesasConfig = await dbService.getConfiguracionMesas();
            setConfigMesas(mesasConfig);
          }
        }}
      />

      {/* Grupo Details Modal */}
      <AppModal
        isOpen={!!selectedGrupo}
        onClose={() => {
          setSelectedGrupo(null);
          setIsEditing(false);
          setEditingGrupo(null);
        }}
        title={isEditing ? "Editar Grupo" : "Detalles del Grupo"}
        description={selectedGrupo ? `${selectedGrupo.invitadoPrincipal.nombre} ${selectedGrupo.invitadoPrincipal.apellidos}` : ""}
        maxWidth="4xl"
        footer={
          <>
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancelEdit} className="w-full sm:w-auto text-sm">
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit} className="shadow-gold w-full sm:w-auto text-sm">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => {
                  setSelectedGrupo(null);
                  setIsEditing(false);
                  setEditingGrupo(null);
                }} className="w-full sm:w-auto text-sm">
                  Cerrar
                </Button>
                {selectedGrupo && (
                  <Button onClick={handleStartEdit} className="w-full sm:w-auto text-sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                )}
              </>
            )}
          </>
        }
      >
        {selectedGrupo && editingGrupo && (
          <div className="space-y-4 sm:space-y-6">
            {isEditing ? (
              // MODO EDICIÓN
              <>
                {/* Invitado Principal - Edición */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                      Invitado Principal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-nombre-principal" className="text-sm">Nombre *</Label>
                        <Input
                          id="edit-nombre-principal"
                          value={editingGrupo.invitadoPrincipal.nombre}
                          onChange={(e) => updateInvitadoPrincipal('nombre', e.target.value)}
                          className="mt-1 text-sm h-9 sm:h-10"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-apellidos-principal" className="text-sm">Apellidos *</Label>
                        <Input
                          id="edit-apellidos-principal"
                          value={editingGrupo.invitadoPrincipal.apellidos}
                          onChange={(e) => updateInvitadoPrincipal('apellidos', e.target.value)}
                          className="mt-1 text-sm h-9 sm:h-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="edit-asistencia-principal" className="text-sm">Estado de Asistencia</Label>
                      <Select
                        value={editingGrupo.invitadoPrincipal.asistencia}
                        onValueChange={(value: 'pendiente' | 'confirmado' | 'rechazado') => updateInvitadoPrincipal('asistencia', value)}
                      >
                        <SelectTrigger id="edit-asistencia-principal" className="mt-1 text-sm h-9 sm:h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="confirmado">Confirmado</SelectItem>
                          <SelectItem value="rechazado">Rechazado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-alergias-principal" className="text-sm">Alergias/Intolerancias</Label>
                      <Input
                        id="edit-alergias-principal"
                        value={editingGrupo.invitadoPrincipal.alergias || ''}
                        onChange={(e) => updateInvitadoPrincipal('alergias', e.target.value)}
                        placeholder="Ej: Gluten, Lactosa..."
                        className="mt-1 text-sm h-9 sm:h-10"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-bus-principal"
                        checked={editingGrupo.invitadoPrincipal.confirmacion_bus ?? editingGrupo.confirmacion_bus ?? false}
                        onCheckedChange={(checked) => updateInvitadoPrincipal('confirmacion_bus', checked === true)}
                      />
                      <Label htmlFor="edit-bus-principal" className="text-sm cursor-pointer flex items-center gap-1.5">
                        <Bus className="w-4 h-4" />
                        Usa el bus
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                {/* Acompañantes - Edición */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                        Acompañantes
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addAcompananteEdit('pareja')}
                          className="text-xs h-8"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Pareja
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addAcompananteEdit('hijo')}
                          className="text-xs h-8"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Hijo
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    {editingGrupo.acompanantes.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay acompañantes. Usa los botones de arriba para añadir.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {editingGrupo.acompanantes.map((acompanante) => (
                          <div key={acompanante.id} className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {acompanante.tipo === 'pareja' ? (
                                  <Heart className="w-4 h-4 text-pink-500" />
                                ) : (
                                  <Baby className="w-4 h-4 text-blue-500" />
                                )}
                                <Badge variant={acompanante.tipo === 'pareja' ? 'default' : 'secondary'} className="text-xs">
                                  {acompanante.tipo === 'pareja' ? 'Pareja' : 'Hijo'}
                                </Badge>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAcompananteEdit(acompanante.id)}
                                className="text-destructive h-8 w-8 p-0"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm">Nombre *</Label>
                                <Input
                                  value={acompanante.nombre}
                                  onChange={(e) => updateAcompananteEdit(acompanante.id, 'nombre', e.target.value)}
                                  className="mt-1 text-sm h-9 sm:h-10"
                                />
                              </div>
                              <div>
                                <Label className="text-sm">Apellidos *</Label>
                                <Input
                                  value={acompanante.apellidos}
                                  onChange={(e) => updateAcompananteEdit(acompanante.id, 'apellidos', e.target.value)}
                                  className="mt-1 text-sm h-9 sm:h-10"
                                />
                              </div>
                            </div>
                            {acompanante.tipo === 'hijo' && (
                              <div>
                                <Label className="text-sm">Edad</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="18"
                                  value={acompanante.edad || ''}
                                  onChange={(e) => updateAcompananteEdit(acompanante.id, 'edad', e.target.value ? parseInt(e.target.value) : undefined)}
                                  className="mt-1 text-sm h-9 sm:h-10"
                                />
                              </div>
                            )}
                            <div>
                              <Label className="text-sm">Estado de Asistencia</Label>
                              <Select
                                value={acompanante.asistencia}
                                onValueChange={(value: 'pendiente' | 'confirmado' | 'rechazado') => updateAcompananteEdit(acompanante.id, 'asistencia', value)}
                              >
                                <SelectTrigger className="mt-1 text-sm h-9 sm:h-10">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pendiente">Pendiente</SelectItem>
                                  <SelectItem value="confirmado">Confirmado</SelectItem>
                                  <SelectItem value="rechazado">Rechazado</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-sm">Alergias/Intolerancias</Label>
                              <Input
                                value={acompanante.alergias || ''}
                                onChange={(e) => updateAcompananteEdit(acompanante.id, 'alergias', e.target.value)}
                                placeholder="Ej: Gluten, Lactosa..."
                                className="mt-1 text-sm h-9 sm:h-10"
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`edit-bus-acompanante-${acompanante.id}`}
                                checked={acompanante.confirmacion_bus ?? editingGrupo.confirmacion_bus ?? false}
                                onCheckedChange={(checked) => updateAcompananteEdit(acompanante.id, 'confirmacion_bus', checked === true)}
                              />
                              <Label htmlFor={`edit-bus-acompanante-${acompanante.id}`} className="text-sm cursor-pointer flex items-center gap-1.5">
                                <Bus className="w-4 h-4" />
                                Usa el bus
                              </Label>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Estado del Grupo - Edición */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">Estado del Grupo</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                    <div>
                      <Label htmlFor="edit-asistencia-grupo" className="text-sm">Asistencia del grupo</Label>
                      <Select
                        value={editingGrupo.asistencia}
                        onValueChange={(value: 'pendiente' | 'confirmado' | 'rechazado') => updateEditingGrupo('asistencia', value)}
                      >
                        <SelectTrigger id="edit-asistencia-grupo" className="mt-1 text-sm h-9 sm:h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="confirmado">Confirmado</SelectItem>
                          <SelectItem value="rechazado">Rechazado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Transporte en Bus - Edición */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Bus className="w-4 h-4 sm:w-5 sm:h-5" />
                      Transporte en Bus (Hora por confirmar)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-confirmacion-bus"
                        checked={
                          editingGrupo.invitadoPrincipal.confirmacion_bus === true ||
                          editingGrupo.acompanantes.some(ac => ac.confirmacion_bus === true) ||
                          (editingGrupo.invitadoPrincipal.confirmacion_bus === undefined &&
                            editingGrupo.acompanantes.every(ac => ac.confirmacion_bus === undefined) &&
                            editingGrupo.confirmacion_bus)
                        }
                        onCheckedChange={(checked) => {
                          const val = checked === true;
                          if (!editingGrupo) return;
                          setEditingGrupo({
                            ...editingGrupo,
                            invitadoPrincipal: { ...editingGrupo.invitadoPrincipal, confirmacion_bus: val },
                            acompanantes: editingGrupo.acompanantes.map(ac => ({ ...ac, confirmacion_bus: val })),
                            confirmacion_bus: val,
                            ubicacion_bus: val ? editingGrupo.ubicacion_bus : undefined,
                          });
                        }}
                      />
                      <Label htmlFor="edit-confirmacion-bus" className="text-sm cursor-pointer">
                        Marcar/desmarcar bus para todo el grupo
                      </Label>
                    </div>
                    
                    {(editingGrupo.invitadoPrincipal.confirmacion_bus === true ||
                      editingGrupo.acompanantes.some(ac => ac.confirmacion_bus === true) ||
                      editingGrupo.confirmacion_bus) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-4 pt-2 border-t"
                      >
                        {!configBuses || configBuses.buses.length === 0 ? (
                          <div className="bg-muted/50 rounded-lg p-4 text-center">
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              No hay buses configurados. Configura los buses primero.
                            </p>
                          </div>
                        ) : (
                          <>
                            <div>
                              <Label htmlFor="edit-bus-seleccionado" className="text-sm">Seleccionar Bus</Label>
                              <Select
                                value={(() => {
                                  if (!editingGrupo.ubicacion_bus) return '';
                                  const bus = configBuses.buses.find(b => 
                                    b.id === editingGrupo.ubicacion_bus || 
                                    b.nombre === editingGrupo.ubicacion_bus ||
                                    `Bus #${b.numero}` === editingGrupo.ubicacion_bus
                                  );
                                  return bus?.id || '';
                                })()}
                                onValueChange={(value) => {
                                  const busSeleccionado = configBuses.buses.find(b => b.id === value);
                                  if (busSeleccionado) {
                                    updateEditingGrupo('ubicacion_bus', busSeleccionado.id);
                                  }
                                }}
                              >
                                <SelectTrigger id="edit-bus-seleccionado" className="text-sm h-9 sm:h-10 mt-1">
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
                          </>
                        )}
                      </motion.div>
                    )}
                  </CardContent>
                </Card>

                {/* Asignación de Mesa - Edición */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Table className="w-4 h-4 sm:w-5 sm:h-5" />
                      Asignación de Mesa
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                    {!configMesas || configMesas.mesas.length === 0 ? (
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                          No hay mesas configuradas.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowConfigMesasModal(true);
                          }}
                          className="text-xs h-8"
                        >
                          <Table className="w-3 h-3 mr-1.5" />
                          Configurar Mesas
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Label htmlFor="edit-mesa-seleccionada" className="text-sm">Seleccionar Mesa</Label>
                        <Select
                          value={editingGrupo.mesa || 'none'}
                          onValueChange={(value) => {
                            updateEditingGrupo('mesa', value === 'none' ? undefined : value);
                          }}
                        >
                          <SelectTrigger id="edit-mesa-seleccionada" className="text-sm h-9 sm:h-10 mt-1">
                            <SelectValue placeholder="Sin mesa asignada" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin mesa asignada</SelectItem>
                            {configMesas.mesas.map((mesa) => {
                              // Calcular ocupación de la mesa
                              const gruposEnMesa = grupos.filter(g => g.mesa === mesa.id);
                              const ocupacion = gruposEnMesa.reduce((total, grupo) => {
                                let personas = 0;
                                if (grupo.invitadoPrincipal.asistencia === 'confirmado') personas++;
                                grupo.acompanantes.forEach(ac => {
                                  if (ac.asistencia === 'confirmado') personas++;
                                });
                                return total + personas;
                              }, 0);
                              const disponible = mesa.capacidad - ocupacion;
                              
                              return (
                                <SelectItem key={mesa.id} value={mesa.id}>
                                  {mesa.nombre}
                                  {mesa.ubicacion && ` (${mesa.ubicacion})`}
                                  <span className="text-muted-foreground ml-2">
                                    - {ocupacion}/{mesa.capacidad} personas
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        {editingGrupo.mesa && (() => {
                          const mesaSeleccionada = configMesas.mesas.find(m => m.id === editingGrupo.mesa);
                          if (!mesaSeleccionada) return null;
                          
                          const gruposEnMesa = grupos.filter(g => g.mesa === editingGrupo.mesa && g.id !== editingGrupo.id);
                          const ocupacion = gruposEnMesa.reduce((total, grupo) => {
                            let personas = 0;
                            if (grupo.invitadoPrincipal.asistencia === 'confirmado') personas++;
                            grupo.acompanantes.forEach(ac => {
                              if (ac.asistencia === 'confirmado') personas++;
                            });
                            return total + personas;
                          }, 0);
                          
                          // Calcular ocupación si este grupo se añade
                          const personasEnEsteGrupo = (() => {
                            let total = 0;
                            if (editingGrupo.invitadoPrincipal.asistencia === 'confirmado') total++;
                            editingGrupo.acompanantes.forEach(ac => {
                              if (ac.asistencia === 'confirmado') total++;
                            });
                            return total;
                          })();
                          
                          const ocupacionTotal = ocupacion + personasEnEsteGrupo;
                          const disponible = mesaSeleccionada.capacidad - ocupacionTotal;
                          
                          return (
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Ocupación actual:</span>
                                <span className="font-medium">{ocupacion}/{mesaSeleccionada.capacidad} personas</span>
                              </div>
                              {personasEnEsteGrupo > 0 && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Con este grupo:</span>
                                  <span className={`font-medium ${disponible < 0 ? 'text-red-600' : disponible < 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                                    {ocupacionTotal}/{mesaSeleccionada.capacidad} personas
                                  </span>
                                </div>
                              )}
                              {disponible < 0 && (
                                <p className="text-xs text-red-600 mt-2">
                                  ⚠️ Esta mesa excedería su capacidad con este grupo
                                </p>
                              )}
                              {disponible >= 0 && disponible < 3 && (
                                <p className="text-xs text-yellow-600 mt-2">
                                  ⚠️ Quedarían solo {disponible} plaza(s) disponible(s)
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Notas - Edición */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">Notas Adicionales</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <Textarea
                      value={editingGrupo.notas || ''}
                      onChange={(e) => updateEditingGrupo('notas', e.target.value)}
                      placeholder="Añade notas adicionales sobre este grupo..."
                      className="text-sm min-h-[100px]"
                    />
                  </CardContent>
                </Card>
              </>
            ) : (
              // MODO VISUALIZACIÓN
              <>
                {/* Invitado Principal - Visualización */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                      Invitado Principal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="space-y-2 sm:space-y-3">
                      <div>
                        <span className="font-medium text-sm sm:text-base">Nombre completo:</span>
                        <p className="text-base sm:text-lg mt-1">
                          {selectedGrupo.invitadoPrincipal.nombre} {selectedGrupo.invitadoPrincipal.apellidos}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-sm sm:text-base">Estado de asistencia:</span>
                        <Badge
                          variant={
                            selectedGrupo.invitadoPrincipal.asistencia === "confirmado"
                              ? "default"
                              : selectedGrupo.invitadoPrincipal.asistencia === "rechazado"
                              ? "destructive"
                              : "secondary"
                          }
                          className="ml-2 text-xs"
                        >
                          {selectedGrupo.invitadoPrincipal.asistencia}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm sm:text-base">Bus:</span>
                        <Badge
                          variant={(selectedGrupo.invitadoPrincipal.confirmacion_bus ?? selectedGrupo.confirmacion_bus) ? "default" : "secondary"}
                          className="text-xs"
                        >
                          <Bus className="w-3 h-3 mr-1 inline" />
                          {(selectedGrupo.invitadoPrincipal.confirmacion_bus ?? selectedGrupo.confirmacion_bus) ? "Sí" : "No"}
                        </Badge>
                      </div>
                      {selectedGrupo.invitadoPrincipal.alergias && (
                        <div>
                          <span className="font-medium text-sm sm:text-base">Alergias:</span>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            {selectedGrupo.invitadoPrincipal.alergias}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Acompañantes - Visualización */}
                {selectedGrupo.acompanantes.length > 0 && (
                  <Card>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                        Acompañantes ({selectedGrupo.acompanantes.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <div className="space-y-3 sm:space-y-4">
                        {selectedGrupo.acompanantes.map((acompanante) => (
                          <div key={acompanante.id} className="border rounded-lg p-3 sm:p-4">
                            <div className="flex items-center gap-2 mb-2">
                              {acompanante.tipo === 'pareja' ? (
                                <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-pink-500" />
                              ) : (
                                <Baby className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                              )}
                              <Badge variant={acompanante.tipo === 'pareja' ? 'default' : 'secondary'} className="text-xs">
                                {acompanante.tipo === 'pareja' ? 'Pareja' : 'Hijo'}
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              <p className="font-medium text-sm sm:text-base">
                                {acompanante.nombre} {acompanante.apellidos}
                              </p>
                              {acompanante.edad && (
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  Edad: {acompanante.edad} años
                                </p>
                              )}
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-medium">Asistencia:</span>
                                <Badge
                                  variant={
                                    acompanante.asistencia === "confirmado"
                                      ? "default"
                                      : acompanante.asistencia === "rechazado"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {acompanante.asistencia}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-medium">Bus:</span>
                                <Badge
                                  variant={(acompanante.confirmacion_bus ?? selectedGrupo.confirmacion_bus) ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  <Bus className="w-3 h-3 mr-1 inline" />
                                  {(acompanante.confirmacion_bus ?? selectedGrupo.confirmacion_bus) ? "Sí" : "No"}
                                </Badge>
                              </div>
                              {acompanante.alergias && (
                                <div>
                                  <span className="text-xs sm:text-sm font-medium">Alergias:</span>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {acompanante.alergias}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Información adicional - Visualización */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">Información del Grupo</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between items-center text-sm sm:text-base">
                        <span className="font-medium">Estado de asistencia:</span>
                        <Badge
                          variant={
                            selectedGrupo.asistencia === "confirmado"
                              ? "default"
                              : selectedGrupo.asistencia === "rechazado"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {selectedGrupo.asistencia}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm sm:text-base">
                        <span className="font-medium">Total de personas:</span>
                        <span className="font-bold">{1 + selectedGrupo.acompanantes.length}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm sm:text-base">
                        <span className="font-medium">Token:</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded break-all max-w-[60%] sm:max-w-none">
                          {selectedGrupo.token}
                        </code>
                      </div>
                      <div className="flex justify-between items-center text-sm sm:text-base">
                        <span className="font-medium">Fecha de creación:</span>
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {new Date(selectedGrupo.fechaCreacion).toLocaleDateString()}
                        </span>
                      </div>
                      {selectedGrupo.notas && (
                        <div>
                          <span className="font-medium text-sm sm:text-base">Notas:</span>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{selectedGrupo.notas}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Información de Bus - Visualización */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">Transporte en Bus</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between items-center text-sm sm:text-base">
                        <span className="font-medium">Usará el servicio de bus:</span>
                        <Badge variant={selectedGrupo.confirmacion_bus ? "default" : "secondary"} className="text-xs">
                          {selectedGrupo.confirmacion_bus ? "Sí" : "No"}
                        </Badge>
                      </div>
                      {selectedGrupo.confirmacion_bus && (
                        <>
                          {selectedGrupo.ubicacion_bus && (
                            <div>
                              <span className="font-medium text-sm sm:text-base">Ubicación/Origen:</span>
                              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                {selectedGrupo.ubicacion_bus}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Información de Mesa - Visualización */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Table className="w-4 h-4 sm:w-5 sm:h-5" />
                      Mesa Asignada
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    {selectedGrupo.mesa ? (
                      (() => {
                        const mesaConfig = configMesas?.mesas.find(m => m.id === selectedGrupo.mesa);
                        if (!mesaConfig) {
                          return (
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">
                                Mesa no encontrada (puede haber sido eliminada)
                              </p>
                            </div>
                          );
                        }
                        return (
                          <div className="space-y-2 sm:space-y-3">
                            <div>
                              <span className="font-medium text-sm sm:text-base">Mesa:</span>
                              <p className="text-base sm:text-lg mt-1 font-semibold">
                                {mesaConfig.nombre}
                              </p>
                            </div>
                            {mesaConfig.ubicacion && (
                              <div>
                                <span className="font-medium text-sm sm:text-base">Ubicación:</span>
                                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                                  {mesaConfig.ubicacion}
                                </p>
                              </div>
                            )}
                            <div>
                              <span className="font-medium text-sm sm:text-base">Capacidad:</span>
                              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                                {mesaConfig.capacidad} personas
                              </p>
                            </div>
                            {mesaConfig.capitanId && (() => {
                              // Parsear el formato "grupoId:miembroId"
                              const [grupoId, miembroId] = mesaConfig.capitanId.split(':');
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
                                      <div className="flex items-center gap-2 mb-1">
                                        <Crown className="w-4 h-4 text-yellow-600" />
                                        <span className="font-medium text-sm sm:text-base">Capitán de Mesa:</span>
                                      </div>
                                      <p className="text-sm sm:text-base font-semibold text-yellow-700 dark:text-yellow-300">
                                        {capitanNombre} {capitanApellidos}
                                      </p>
                                    </div>
                                  );
                                }
                              }
                              return null;
                            })()}
                          </div>
                        );
                      })()
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Sin mesa asignada
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </AppModal>
    </PageLayout>
  );
};

export default AdminOculto;
