import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  Upload,
  X,
  Loader2,
  Camera,
  Trophy,
  Crown,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import PageLayout from "@/components/layouts/PageLayout";
import PageHeader from "@/components/common/PageHeader";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import { dbService } from "@/lib/database";
import { GrupoInvitados } from "@/types/invitados";
import { ConfiguracionMesas, MesaConfig } from "@/types/mesas";
import { CarreraFotos, FotoMision, TODAS_LAS_MISIONES, seleccionarMisionesAleatorias } from "@/types/carrera-fotos";

interface SelectedFile {
  file: File;
  preview: string;
  misionId: number;
}

const Mesa = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [grupo, setGrupo] = useState<GrupoInvitados | null>(null);
  const [mesa, setMesa] = useState<MesaConfig | null>(null);
  const [capitan, setCapitan] = useState<{ nombre: string; apellidos: string; email?: string } | null>(null);
  const [carrera, setCarrera] = useState<CarreraFotos | null>(null);
  const [configMesas, setConfigMesas] = useState<ConfiguracionMesas | null>(null);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingMisionId, setUploadingMisionId] = useState<number | null>(null);
  const [deletingFotoId, setDeletingFotoId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        
        // Cargar configuración de mesas primero
        const mesasConfig = await dbService.getConfiguracionMesas();
        setConfigMesas(mesasConfig);

        let mesaEncontrada: MesaConfig | null = null;
        let mesaId: string | null = null;

        // Intentar encontrar la mesa por token directo
        if (mesasConfig) {
          mesaEncontrada = mesasConfig.mesas.find(m => m.token === token) || null;
          if (mesaEncontrada) {
            mesaId = mesaEncontrada.id;
          }
        }

        // Si no se encontró por token de mesa, intentar por token de grupo
        if (!mesaEncontrada) {
          const grupoData = await dbService.getGrupoByToken(token);
          if (grupoData && grupoData.mesa) {
            setGrupo(grupoData);
            mesaId = grupoData.mesa;
            
            if (mesasConfig) {
              mesaEncontrada = mesasConfig.mesas.find(m => m.id === grupoData.mesa) || null;
            }
          }
        }

        if (!mesaEncontrada || !mesaId) {
          setLoading(false);
          return;
        }

        setMesa(mesaEncontrada);

        // Cargar capitán si existe
        if (mesaEncontrada.capitanId) {
          // Parsear el formato "grupoId:miembroId"
          const [grupoId, miembroId] = mesaEncontrada.capitanId.split(':');
          const capitanGrupo = await dbService.getGrupoById(grupoId);
          if (capitanGrupo) {
            if (miembroId === 'principal') {
              setCapitan({
                nombre: capitanGrupo.invitadoPrincipal.nombre,
                apellidos: capitanGrupo.invitadoPrincipal.apellidos,
                email: capitanGrupo.invitadoPrincipal.email,
              });
            } else {
              const acompanante = capitanGrupo.acompanantes.find(ac => ac.id === miembroId);
              if (acompanante) {
                setCapitan({
                  nombre: acompanante.nombre,
                  apellidos: acompanante.apellidos,
                });
              }
            }
          }
        }

        // Cargar o crear carrera de fotos
        let carreraData = await dbService.getCarreraByMesaId(mesaId);
        
        if (!carreraData) {
          // Crear nueva carrera con 7 misiones aleatorias
          carreraData = {
            mesaId: mesaId,
            misiones: seleccionarMisionesAleatorias(),
            fotos: [],
            fechaInicio: new Date().toISOString(),
            completada: false,
          };
          await dbService.saveCarrera(carreraData);
        }
        
        setCarrera(carreraData);
        setLoading(false);
      } catch (error) {
        console.error("Error loading mesa data:", error);
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, misionId: number) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Verificar si ya hay una foto para esta misión
    if (carrera?.fotos.some(f => f.misionId === misionId && f.validada)) {
      toast({
        title: "Misión completada",
        description: "Ya has subido una foto para esta misión.",
        variant: "default",
      });
      return;
    }

    setSelectedFile({
      file,
      preview: URL.createObjectURL(file),
      misionId,
    });
  };

  const handleUpload = async (misionId: number) => {
    if (!selectedFile || selectedFile.misionId !== misionId || !mesa || !carrera) return;

    setUploading(true);
    setUploadingMisionId(misionId);

    try {
      // Obtener nombre del invitado (del grupo si existe, o genérico)
      const nombreInvitado = grupo 
        ? `${grupo.invitadoPrincipal.nombre} ${grupo.invitadoPrincipal.apellidos}`
        : 'Invitado de la mesa';

      const formData = new FormData();
      formData.append("nombreInvitado", nombreInvitado);
      formData.append("misionId", misionId.toString());
      formData.append("mesaId", mesa.id);
      formData.append("file", selectedFile.file);

      const response = await fetch("/api/gofile/upload-mision", {
        method: "POST",
        body: formData,
      });

      const contentType = response.headers.get("content-type");
      let result;
      
      if (contentType && contentType.includes("application/json")) {
        try {
          const text = await response.text();
          if (!text || text.trim() === '') {
            throw new Error("El servidor backend no está disponible. Por favor, inicia el servidor con 'npm run dev:server' o 'npm run dev:all'");
          }
          result = JSON.parse(text);
        } catch (jsonError) {
          throw new Error("El servidor backend no está disponible. Por favor, inicia el servidor con 'npm run dev:server' o 'npm run dev:all'");
        }
      } else {
        const textResponse = await response.text();
        throw new Error(`El servidor backend no está disponible. Respuesta: ${textResponse.substring(0, 100)}`);
      }

      if (response.ok || response.status === 207) {
        // Agregar la foto a la carrera
        const nombreInvitado = grupo 
          ? `${grupo.invitadoPrincipal.nombre} ${grupo.invitadoPrincipal.apellidos}`
          : 'Invitado de la mesa';

        const nuevaFoto: FotoMision = {
          id: result.fotoId || Date.now().toString(),
          misionId,
          url: result.url || result.fileUrl || '',
          nombreInvitado,
          fechaSubida: new Date().toISOString(),
          validada: false, // Los novios deben validarla
        };

        const carreraActualizada: CarreraFotos = {
          ...carrera,
          fotos: [...carrera.fotos, nuevaFoto],
        };

        await dbService.saveCarrera(carreraActualizada);
        setCarrera(carreraActualizada);

        // Limpiar selección
        if (selectedFile.preview) {
          URL.revokeObjectURL(selectedFile.preview);
        }
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        toast({
          title: "¡Foto subida! 📸",
          description: "Tu foto ha sido enviada. Los novios la revisarán pronto.",
          variant: "default",
        });
      } else {
        toast({
          title: "Error al subir",
          description: result?.error || "Hubo un error al subir la foto.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al subir foto:", error);
      let errorMessage = "No se pudo conectar con el servidor. ";
      
      if (error instanceof TypeError && error.message.includes("fetch")) {
        errorMessage += "El servidor backend no está corriendo. Por favor, inicia el servidor con 'npm run dev:server' o 'npm run dev:all'.";
      } else if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += "Verifica tu conexión e inténtalo de nuevo.";
      }
      
      toast({
        title: "Error de conexión",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadingMisionId(null);
    }
  };

  const getMisionInfo = (misionId: number) => {
    return TODAS_LAS_MISIONES.find(m => m.id === misionId);
  };

  const getFotoMision = (misionId: number) => {
    return carrera?.fotos.find(f => f.misionId === misionId);
  };

  const handleDeleteFoto = async (fotoId: string, misionId: number) => {
    if (!carrera) return;

    // Confirmar eliminación
    const confirmar = window.confirm(
      "¿Estás seguro de que quieres eliminar esta foto? Podrás subir una nueva."
    );
    if (!confirmar) return;

    try {
      setDeletingFotoId(fotoId);
      
      // Eliminar la foto de la carrera
      const carreraActualizada: CarreraFotos = {
        ...carrera,
        fotos: carrera.fotos.filter(f => f.id !== fotoId),
      };

      await dbService.saveCarrera(carreraActualizada);
      setCarrera(carreraActualizada);

      toast({
        title: "Foto eliminada",
        description: "La foto ha sido eliminada. Puedes subir una nueva.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error eliminando foto:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la foto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setDeletingFotoId(null);
    }
  };

  const misionesCompletadas = carrera?.fotos.filter(f => f.validada).length || 0;
  const progreso = carrera ? (misionesCompletadas / 7) * 100 : 0;

  if (loading) {
    return (
      <PageLayout>
        <LoadingState message="Cargando tu mesa..." />
      </PageLayout>
    );
  }

  if (!token || !mesa || !carrera) {
    return (
      <PageLayout>
        <ErrorState
          title="Acceso Restringido"
          description="Esta página solo es accesible mediante un enlace personalizado de tu mesa. Si recibiste un QR, por favor escanéalo de nuevo."
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-2 sm:px-4 md:px-6 min-h-screen bg-gradient-to-br from-white to-pink-50/50">
        <div className="container mx-auto max-w-6xl">
          {/* Header personalizado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              ¡Bienvenido a {mesa.nombre}! 🎉
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Estamos encantados de tenerte aquí. Te hemos elegido como capitán de mesa, 
              por ser el más capaz, teniendo en cuenta los que te rodean no era muy dificil... <br />
              ¿Tu papel es fundamental! Ya que serás el encargado de dirigir tu mesa hacía la victoria, serás completar todas las misiones antes que las demás mesas para convertiros en la gadora.
            </p>
            {mesa.ubicacion && (
              <Badge variant="outline" className="mt-4 text-base px-4 py-2">
                📍 {mesa.ubicacion}
              </Badge>
            )}
          </motion.div>

          {/* Sección del Capitán de Mesa */}
          {capitan && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Crown className="w-6 h-6 text-yellow-600" />
                    Capitán de Mesa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-gray-800">
                    {capitan.nombre} {capitan.apellidos}
                  </p>
                  {capitan.email && (
                    <p className="text-sm text-gray-600 mt-1">
                      {capitan.email}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Carrera de Fotos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="bg-white shadow-xl">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-4">
                  <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600 flex-shrink-0" />
                    <span className="break-words">Carrera de Fotos</span>
                  </CardTitle>
                  {carrera.completada && (
                    <Badge className="bg-green-500 text-white text-xs sm:text-base px-2 sm:px-4 py-1 sm:py-2 flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">¡Completada!</span>
                      <span className="sm:hidden">✓</span>
                    </Badge>
                  )}
                </div>
                <div className="mt-3 sm:mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">
                      Progreso: {misionesCompletadas} / 7 misiones
                    </span>
                    <span className="font-bold text-pink-600">{Math.round(progreso)}%</span>
                  </div>
                  <Progress value={progreso} className="h-2 sm:h-3" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">
                {carrera.misiones.map((misionId, index) => {
                  const mision = getMisionInfo(misionId);
                  const foto = getFotoMision(misionId);
                  const tieneFoto = !!foto;
                  const fotoValidada = foto?.validada || false;
                  const isUploading = uploadingMisionId === misionId;

                  if (!mision) return null;

                  return (
                    <motion.div
                      key={misionId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className={`p-3 sm:p-4 md:p-5 rounded-xl border-2 ${
                        fotoValidada
                          ? "bg-green-50 border-green-300"
                          : tieneFoto
                          ? "bg-yellow-50 border-yellow-300"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 sm:gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                            <Badge variant="outline" className="font-bold text-xs sm:text-sm">
                              Misión {index + 1}
                            </Badge>
                            {fotoValidada && (
                              <Badge className="bg-green-500 text-white text-xs sm:text-sm">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Validada
                              </Badge>
                            )}
                            {tieneFoto && !fotoValidada && (
                              <Badge variant="outline" className="border-yellow-500 text-yellow-700 text-xs sm:text-sm">
                                Pendiente
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-1 break-words">
                            {mision.titulo}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 break-words">{mision.descripcion}</p>
                        </div>
                      </div>

                      {foto && (
                        <div className="mb-3 p-2 sm:p-3 bg-white rounded-lg border border-gray-200 relative">
                          {!fotoValidada && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFoto(foto.id, misionId)}
                              disabled={deletingFotoId === foto.id}
                              className="absolute top-2 right-2 text-red-600 hover:text-red-700 hover:bg-red-50 h-7 sm:h-8 w-7 sm:w-8 p-0 flex-shrink-0 z-10"
                              title="Eliminar foto"
                            >
                              {deletingFotoId === foto.id ? (
                                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              )}
                            </Button>
                          )}
                          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 mb-2 pr-8">
                            <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="whitespace-nowrap">
                              {new Date(foto.fechaSubida).toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          {foto.url && (
                            <div className="flex items-center gap-2 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
                              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                              <span className="text-sm sm:text-base font-medium text-green-900">
                                Foto subida
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {!fotoValidada && (
                        <div className="space-y-2 sm:space-y-3">
                          {!selectedFile || selectedFile.misionId !== misionId ? (
                            <div className="w-full">
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileSelect(e, misionId)}
                                className="hidden"
                                id={`mision-${misionId}`}
                                disabled={isUploading || uploading}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  const input = document.getElementById(`mision-${misionId}`) as HTMLInputElement;
                                  input?.click();
                                }}
                                disabled={isUploading || uploading || (tieneFoto && fotoValidada)}
                                className="w-full text-xs sm:text-sm h-8 sm:h-9"
                              >
                                <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                                <span className="truncate">
                                  {tieneFoto && fotoValidada ? "Misión completada" : tieneFoto ? "Cambiar foto" : "Elegir foto"}
                                </span>
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2 sm:space-y-3 w-full">
                              <div className="relative w-full">
                                <img
                                  src={selectedFile.preview}
                                  alt="Preview"
                                  className="w-full max-w-full rounded-lg border-2 border-pink-300"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    URL.revokeObjectURL(selectedFile.preview);
                                    setSelectedFile(null);
                                  }}
                                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors z-10"
                                  disabled={isUploading}
                                  title="Eliminar previsualización"
                                >
                                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2 w-full">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    URL.revokeObjectURL(selectedFile.preview);
                                    setSelectedFile(null);
                                    if (fileInputRef.current) {
                                      fileInputRef.current.value = "";
                                    }
                                  }}
                                  disabled={isUploading || uploading}
                                  className="flex-1 w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
                                >
                                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                                  <span className="truncate">Cancelar</span>
                                </Button>
                                <Button
                                  type="button"
                                  onClick={() => handleUpload(misionId)}
                                  disabled={isUploading || uploading}
                                  className="flex-1 w-full sm:w-auto bg-pink-500 hover:bg-pink-600 text-xs sm:text-sm h-8 sm:h-9"
                                >
                                  {isUploading ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin flex-shrink-0" />
                                      <span className="truncate">Subiendo...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                                      <span className="truncate">Subir foto</span>
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>

          {/* Información adicional */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-yellow-50/50 border border-yellow-200 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-yellow-600" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-1">📸 Sobre la Carrera de Fotos:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Debes completar las 7 misiones antes que las demás mesas.</li>
                  <li>Los novios validarán cada foto antes de marcarla como completada.</li>
                  <li>¡La primera mesa en completar todas las misiones gana!</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

    </PageLayout>
  );
};

export default Mesa;

