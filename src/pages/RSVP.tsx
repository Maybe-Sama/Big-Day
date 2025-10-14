import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getInvitadoByToken } from "@/lib/tokens";

const RSVP = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [invitado, setInvitado] = useState<any>(null);
  const [acompanantes, setAcompanantes] = useState(0);
  const [asistencia, setAsistencia] = useState<"confirmado" | "rechazado" | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const validateAndLoadInvitado = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      const invitadoData = await getInvitadoByToken(token);
      setInvitado(invitadoData);
      setLoading(false);
    };

    validateAndLoadInvitado();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!asistencia) {
      toast({
        title: "Error",
        description: "Por favor, indica si asistirás o no",
        variant: "destructive",
      });
      return;
    }

    // Simular actualización del JSON
    console.log("Actualizando invitado:", {
      ...invitado,
      asistencia,
      acompanantes: asistencia === "confirmado" ? acompanantes : 0,
    });

    setSubmitted(true);
    
    toast({
      title: "¡Confirmación recibida!",
      description: asistencia === "confirmado" 
        ? "Gracias por confirmar tu asistencia. ¡Te esperamos!"
        : "Lamentamos que no puedas asistir. ¡Te echaremos de menos!",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 pb-16 px-4 flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!token || !invitado) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 pb-16 px-4">
          <div className="container mx-auto max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl shadow-soft p-8 text-center"
            >
              <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h1 className="font-playfair text-3xl font-bold mb-4">
                Acceso Restringido
              </h1>
              <p className="text-muted-foreground mb-6">
                Esta página solo es accesible mediante una invitación personalizada.
                Si recibiste una invitación, por favor usa el enlace que te enviamos.
              </p>
              <p className="text-sm text-muted-foreground">
                Si crees que esto es un error, contacta con Ana & Roberto.
              </p>
            </motion.div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 pb-16 px-4">
          <div className="container mx-auto max-w-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-2xl shadow-soft p-8 text-center"
            >
              {asistencia === "confirmado" ? (
                <>
                  <CheckCircle className="w-20 h-20 text-primary mx-auto mb-6" />
                  <h1 className="font-playfair text-4xl font-bold mb-4">
                    ¡Confirmado!
                  </h1>
                  <p className="text-lg text-muted-foreground mb-4">
                    Nos alegra mucho que puedas acompañarnos, {invitado.nombre}.
                  </p>
                  {acompanantes > 0 && (
                    <p className="text-muted-foreground">
                      Hemos registrado {acompanantes} acompañante{acompanantes > 1 ? 's' : ''}.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <XCircle className="w-20 h-20 text-muted-foreground mx-auto mb-6" />
                  <h1 className="font-playfair text-4xl font-bold mb-4">
                    Entendemos
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Lamentamos que no puedas asistir. ¡Te echaremos de menos!
                  </p>
                </>
              )}
            </motion.div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="font-playfair text-5xl font-bold mb-4">
              Confirma tu Asistencia
            </h1>
            <p className="text-muted-foreground text-lg">
              Hola {invitado.nombre}, nos encantaría saber si podrás acompañarnos
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
            className="bg-card rounded-2xl shadow-soft p-8 space-y-6"
          >
            <div>
              <Label className="text-lg mb-4 block">
                ¿Asistirás a nuestra boda?
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={asistencia === "confirmado" ? "default" : "outline"}
                  onClick={() => setAsistencia("confirmado")}
                  className="h-20 text-lg"
                >
                  <CheckCircle className="mr-2" />
                  Sí, asistiré
                </Button>
                <Button
                  type="button"
                  variant={asistencia === "rechazado" ? "default" : "outline"}
                  onClick={() => setAsistencia("rechazado")}
                  className="h-20 text-lg"
                >
                  <XCircle className="mr-2" />
                  No podré asistir
                </Button>
              </div>
            </div>

            {asistencia === "confirmado" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="acompanantes" className="text-lg">
                    Número de acompañantes
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Sin incluirte a ti
                  </p>
                  <Input
                    id="acompanantes"
                    type="number"
                    min="0"
                    max="5"
                    value={acompanantes}
                    onChange={(e) => setAcompanantes(parseInt(e.target.value) || 0)}
                    className="text-lg h-12"
                  />
                </div>
              </motion.div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full text-lg h-14 shadow-gold hover:shadow-medium transition-smooth"
              disabled={!asistencia}
            >
              Enviar confirmación
            </Button>
          </motion.form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RSVP;
