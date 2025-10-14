import { motion } from "framer-motion";
import { Clock, MapPin, Music, Utensils, Camera, PartyPopper } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Actividades = () => {
  const cronograma = [
    {
      hora: "16:00",
      titulo: "Ceremonia",
      descripcion: "Ceremonia civil en el jardín de la hacienda",
      icono: PartyPopper,
      mapa: "https://maps.google.com",
    },
    {
      hora: "17:30",
      titulo: "Cóctel de bienvenida",
      descripcion: "Aperitivos y bebidas en la terraza",
      icono: Utensils,
    },
    {
      hora: "19:00",
      titulo: "Cena de gala",
      descripcion: "Menú degustación en el salón principal",
      icono: Utensils,
    },
    {
      hora: "21:30",
      titulo: "Baile y música",
      descripcion: "Apertura de baile de los novios y fiesta",
      icono: Music,
    },
    {
      hora: "23:00",
      titulo: "Photocall",
      descripcion: "Zona de fotos con atrezzo divertido",
      icono: Camera,
    },
    {
      hora: "01:00",
      titulo: "Barra libre",
      descripcion: "Continúa la celebración",
      icono: PartyPopper,
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="font-playfair text-5xl md:text-6xl font-bold mb-4">
              Programa del Día
            </h1>
            <p className="text-muted-foreground text-lg">
              Todo lo que necesitas saber sobre nuestra celebración
            </p>
          </motion.div>

          <div className="space-y-6">
            {cronograma.map((evento, index) => {
              const IconComponent = evento.icono;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-2xl shadow-soft p-6 hover:shadow-medium transition-smooth"
                >
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold">
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-primary" />
                        <span className="font-semibold text-primary text-lg">
                          {evento.hora}
                        </span>
                      </div>
                      
                      <h3 className="font-playfair text-2xl font-bold mb-2">
                        {evento.titulo}
                      </h3>
                      
                      <p className="text-muted-foreground mb-3">
                        {evento.descripcion}
                      </p>
                      
                      {evento.mapa && (
                        <a
                          href={evento.mapa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                        >
                          <MapPin className="w-4 h-4" />
                          Ver ubicación
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 bg-accent/50 rounded-2xl p-8 text-center"
          >
            <h3 className="font-playfair text-2xl font-bold mb-4">
              Información Importante
            </h3>
            <div className="space-y-3 text-muted-foreground">
              <p>
                📍 <strong>Ubicación:</strong> Hacienda Los Olivos, Carretera de Madrid km 12
              </p>
              <p>
                🅿️ <strong>Parking:</strong> Disponible en la hacienda
              </p>
              <p>
                👗 <strong>Dress code:</strong> Formal / Etiqueta
              </p>
              <p>
                ℹ️ <strong>Información:</strong> Para cualquier duda, contáctanos
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Actividades;
