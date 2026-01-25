import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  X,
  Loader2,
  AlertCircle,
  Camera,
  Heart,
} from "lucide-react"; // Añadimos Heart y Camera para más vida
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import PageLayout from "@/components/layouts/PageLayout";
import PageHeader from "@/components/common/PageHeader";

interface SelectedFile {
  file: File;
  preview: string;
}

// Configuración de animación para la lista de fotos
const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
  },
};

const Fotos = () => {
  const { toast } = useToast();
  const [nombreInvitado, setNombreInvitado] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    total: number;
    uploaded: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Limpieza de URLs de objetos cuando el componente se desmonta o los archivos cambian
  useEffect(() => {
    return () => {
      selectedFiles.forEach((file) => {
        try {
          URL.revokeObjectURL(file.preview);
        } catch (error) {
          // Ignorar errores de limpieza de URLs inválidas
          console.warn("Error al limpiar URL de preview:", error);
        }
      });
    };
  }, [selectedFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validar cantidad máxima
    if (selectedFiles.length + files.length > 50) {
      toast({
        title: "Demasiadas fotos 📸",
        description: "Puedes subir un máximo de 50 fotos. ¡Gracias!",
        variant: "destructive",
      });
      return;
    }

    // Crear previews para las nuevas imágenes
    const newFiles: SelectedFile[] = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => {
      const newFiles = [...prev];
      try {
        URL.revokeObjectURL(newFiles[index].preview);
      } catch (error) {
        console.warn("Error al limpiar URL de preview:", error);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validaciones (lógica de validación movida al inicio para una mejor UX)
    if (!nombreInvitado.trim()) {
      toast({
        title: "¡Alto! Necesitamos tu nombre",
        description: "Por favor, escribe tu nombre para identificar las fotos.",
        variant: "destructive",
      });
      return;
    }

    if (selectedFiles.length === 0) {
      toast({
        title: "¡No hay fotos!",
        description: "Selecciona al menos una foto antes de subir.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    // Simulación de subida para el progreso (MANTENER POR FUNCIONALIDAD)
    setUploadProgress({ total: selectedFiles.length, uploaded: 0 });

    try {
      const formData = new FormData();
      formData.append("nombreInvitado", nombreInvitado.trim());

      selectedFiles.forEach((selectedFile) => {
        formData.append("files", selectedFile.file);
      });

      // Realizar la subida al backend
      const response = await fetch("/api/gofile/upload", {
        method: "POST",
        body: formData,
      });

      // Verificar si la respuesta es JSON válido antes de parsear
      const contentType = response.headers.get("content-type");
      let result;
      
      if (contentType && contentType.includes("application/json")) {
        try {
          const text = await response.text();
          // Si la respuesta está vacía, el servidor no está respondiendo correctamente
          if (!text || text.trim() === '') {
            throw new Error("El servidor backend no está disponible. Por favor, inicia el servidor con 'npm run dev:server' o 'npm run dev:all'");
          }
          result = JSON.parse(text);
        } catch (jsonError) {
          // Si falla el parseo JSON, el servidor probablemente no está corriendo
          throw new Error("El servidor backend no está disponible. Por favor, inicia el servidor con 'npm run dev:server' o 'npm run dev:all'");
        }
      } else {
        // Si no es JSON, el servidor no está respondiendo correctamente
        const textResponse = await response.text();
        throw new Error(`El servidor backend no está disponible o está devolviendo un error. Respuesta: ${textResponse.substring(0, 100)}`);
      }

      if (response.ok || response.status === 207) {
        // 207 = Multi-Status (algunas subidas exitosas, algunas fallaron)
        toast({
          title: result.success ? "¡Éxito! 🎉 Tus recuerdos están a salvo." : "Subida parcial ⚠️",
          description: result.message || "Tus fotos se han subido correctamente.",
          variant: result.success ? "default" : "default",
        });

        // Limpiar formulario
        setNombreInvitado("");
        selectedFiles.forEach((file) => {
          try {
            URL.revokeObjectURL(file.preview);
          } catch (error) {
            console.warn("Error al limpiar URL de preview:", error);
          }
        });
        setSelectedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        // Error del servidor
        toast({
          title: "¡Ups! Error al subir 🚨",
          description: result?.error || "Hubo un error al subir las fotos. Por favor, inténtalo de nuevo.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al subir fotos:", error);
      
      // Mensaje más específico según el tipo de error
      let errorMessage = "No se pudo conectar con el servidor. ";
      
      if (error instanceof TypeError && error.message.includes("fetch")) {
        errorMessage += "El servidor backend no está corriendo. Por favor, inicia el servidor con 'npm run dev:server' o 'npm run dev:all'.";
      } else if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += "Verifica tu conexión e inténtalo de nuevo.";
      }
      
      toast({
        title: "Error de conexión 💔",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  // Estilos y componentes modernos
  const ModernFileInput = () => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative border-2 border-dashed p-6 rounded-xl cursor-pointer transition-all duration-300
        ${uploading ? 'bg-gray-100/50 border-gray-300 pointer-events-none' : 'bg-primary-50/50 border-primary-300 hover:border-primary-500 hover:bg-primary-100/70'}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!uploading && fileInputRef.current) {
          fileInputRef.current.click();
        }
      }}
    >
      <input
        ref={fileInputRef}
        id="fotos"
        name="fotos"
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          handleFileSelect(e);
          // Resetear el valor para permitir seleccionar los mismos archivos de nuevo
          e.target.value = '';
        }}
        onClick={(e) => {
          // Prevenir que el click del input se propague al div
          e.stopPropagation();
        }}
        className="absolute inset-0 opacity-0 cursor-pointer pointer-events-none"
        disabled={uploading}
      />
      <div className="flex flex-col items-center justify-center text-center space-y-2">
        <Camera className={`w-8 h-8 ${uploading ? 'text-gray-400' : 'text-primary-600'}`} />
        <p className={`text-base font-semibold ${uploading ? 'text-gray-500' : 'text-primary-800'}`}>
          Haz clic para elegir o arrastra tus fotos aquí
        </p>
        <p className={`text-sm ${uploading ? 'text-gray-500' : 'text-muted-foreground'}`}>
          Sube tus mejores tomas (máximo 50 fotos)
        </p>
      </div>
    </motion.div>
  );

  return (
    <PageLayout>
      <div className="pt-24 pb-16 px-4 min-h-screen bg-gradient-to-br from-white to-pink-50/50">
        <div className="container mx-auto max-w-3xl">
          <PageHeader
            title="Comparte tus Recuerdos 💖"
            description="Pon tu nombre y sube todas las fotos de la boda o de la odisea previa. ¡Cuántas más mejor!"
            variant="simple"
          />

          {/* Tarjeta de Subida Flotante */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
            className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 md:p-10 mb-8 backdrop-blur-sm bg-opacity-95 border border-gray-100" // Efecto "flotante"
          >
            <form onSubmit={handleUpload} className="space-y-6">
              {/* Nombre del invitado - Diseño mejorado */}
              <motion.div
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Label htmlFor="nombreInvitado" className="text-base font-bold text-gray-700">
                  Tu nombre (Requerido)
                </Label>
                <Input
                  id="nombreInvitado"
                  name="nombreInvitado"
                  type="text"
                  placeholder="Ej: Laura & David"
                  value={nombreInvitado}
                  onChange={(e) => setNombreInvitado(e.target.value)}
                  className="mt-2 h-12 text-base rounded-lg border-2 focus:border-pink-500 transition-colors"
                  disabled={uploading}
                  required
                />
              </motion.div>

              {/* Selector de archivos - Componente Moderno */}
              <motion.div
                initial={{ x: 10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Label className="text-base font-bold text-gray-700 mb-2 block">
                  Elige tus fotos
                </Label>
                <ModernFileInput />
              </motion.div>

              {/* Preview de archivos seleccionados con Framer Motion */}
              <AnimatePresence>
                {selectedFiles.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3 pt-2"
                  >
                    <Label className="text-base font-bold text-gray-700 block">
                      Fotos listas para subir ({selectedFiles.length})
                    </Label>
                    <motion.div
                      variants={listVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-72 overflow-y-auto p-3 bg-gray-50 rounded-xl border border-gray-200"
                    >
                      <AnimatePresence>
                        {selectedFiles.map((selectedFile, index) => (
                          <motion.div
                            key={selectedFile.preview} // Usar el preview como key para Framer
                            variants={itemVariants}
                            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                            className="relative aspect-square rounded-lg overflow-hidden shadow-md border-2 border-white transform hover:scale-[1.02] transition-transform duration-200 group"
                          >
                            <img
                              src={selectedFile.preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {!uploading && (
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                aria-label="Eliminar foto"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Indicador de Progreso Vibrante */}
              <AnimatePresence>
                {uploadProgress && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-2 pt-2"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-pink-600 font-medium flex items-center">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Subiendo tus recuerdos...
                      </span>
                      <span className="font-bold text-pink-700">
                        {uploadProgress.uploaded} / {uploadProgress.total}
                      </span>
                    </div>
                    <div className="w-full bg-pink-100 rounded-full h-3">
                      <div
                        className="bg-pink-500 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${(uploadProgress.uploaded / uploadProgress.total) * 100}%`,
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botón de subida - Gran impacto visual */}
              <Button
                type="submit"
                className="w-full mt-6 bg-pink-500 hover:bg-pink-600 active:bg-pink-700 text-white shadow-lg shadow-pink-300/50 hover:shadow-xl hover:shadow-pink-400/60 transition-all duration-300 text-lg font-extrabold h-14 rounded-xl disabled:bg-gray-400 disabled:shadow-none"
                disabled={uploading || selectedFiles.length === 0 || !nombreInvitado.trim()}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Enviando Magia...
                  </>
                ) : (
                  <>
                    <Heart className="w-5 h-5 mr-3 fill-white" />
                    ¡Subir {selectedFiles.length > 0 ? `${selectedFiles.length} foto${selectedFiles.length > 1 ? 's' : ''} ahora!` : 'fotos'}
                  </>
                )}
              </Button>
            </form>

            {/* Mensaje de privacidad atractivo */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-start gap-3 text-sm text-gray-500 bg-yellow-50/50 p-3 rounded-lg border border-yellow-200">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-yellow-600" />
                <p>
                  Privacidad total: Las fotos se guardan de forma segura y privada para los novios. No se publicarán en ningún sitio sin su consentimiento.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Fotos;