import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, Image as ImageIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const Fotos = () => {
  const { toast } = useToast();
  const [fotos, setFotos] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadFotos = async () => {
      try {
        const response = await fetch("/data/fotos.json");
        const data = await response.json();
        setFotos(data);
      } catch (error) {
        console.error("Error loading fotos:", error);
      }
    };
    loadFotos();
  }, []);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);

    const formData = new FormData(e.currentTarget);
    const file = formData.get("foto") as File;
    const autor = formData.get("autor") as string;

    if (!file) {
      toast({
        title: "Error",
        description: "Por favor selecciona una foto",
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    // Simular subida
    setTimeout(() => {
      const nuevaFoto = {
        id: fotos.length + 1,
        url: URL.createObjectURL(file),
        autor: autor || "Invitado",
        fecha: new Date().toISOString(),
      };

      setFotos([nuevaFoto, ...fotos]);
      
      toast({
        title: "¡Foto subida!",
        description: "Tu foto se ha añadido a la galería",
      });

      setUploading(false);
      e.currentTarget.reset();
    }, 1500);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="font-playfair text-5xl md:text-6xl font-bold mb-4">
              Galería de Fotos
            </h1>
            <p className="text-muted-foreground text-lg">
              Comparte tus mejores momentos de nuestra boda
            </p>
          </motion.div>

          {/* Upload Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl shadow-soft p-8 mb-12"
          >
            <h2 className="font-playfair text-2xl font-bold mb-6 flex items-center gap-2">
              <Upload className="w-6 h-6 text-primary" />
              Sube tu foto
            </h2>
            
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <Label htmlFor="foto">Selecciona una imagen</Label>
                <Input
                  id="foto"
                  name="foto"
                  type="file"
                  accept="image/*"
                  className="cursor-pointer"
                  disabled={uploading}
                />
              </div>
              
              <div>
                <Label htmlFor="autor">Tu nombre (opcional)</Label>
                <Input
                  id="autor"
                  name="autor"
                  type="text"
                  placeholder="Anónimo"
                  disabled={uploading}
                />
              </div>
              
              <Button
                type="submit"
                className="w-full shadow-gold hover:shadow-medium transition-smooth"
                disabled={uploading}
              >
                {uploading ? "Subiendo..." : "Subir foto"}
              </Button>
            </form>
          </motion.div>

          {/* Gallery Grid */}
          {fotos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {fotos.map((foto, index) => (
                <motion.div
                  key={foto.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative aspect-square rounded-2xl overflow-hidden shadow-soft hover:shadow-medium transition-smooth cursor-pointer"
                >
                  <img
                    src={foto.url}
                    alt={`Foto de ${foto.autor}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-smooth"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-smooth">
                    <div className="absolute bottom-4 left-4 text-white">
                      <p className="font-semibold">{foto.autor}</p>
                      <p className="text-sm opacity-80">
                        {new Date(foto.fecha).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <ImageIcon className="w-20 h-20 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground text-lg">
                Aún no hay fotos. ¡Sé el primero en compartir!
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Fotos;
