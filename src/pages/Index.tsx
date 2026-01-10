import { motion } from "framer-motion";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Countdown from "@/components/Countdown";
import PageLayout from "@/components/layouts/PageLayout";
import PageHeader from "@/components/common/PageHeader";
import heroImage from "@/assets/hero-wedding.jpg";

const Index = () => {
  return (
    <PageLayout>
      {/* Hero Section */}
      <PageHeader
        title="Virginia & Alejandro"
        description="Nos casamos y queremos celebrarlo contigo"
        variant="hero"
        backgroundImage={heroImage}
      >
        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base md:text-lg lg:text-xl">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" />
            <span className="text-center">13 de Junio, 2026 • 16:00h</span>
          </div>
          
          <div className="flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base md:text-lg lg:text-xl px-4">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" />
            <span className="text-center">Hacienda Las Yeguas, Fuentes de Andalucía, Sevilla</span>
          </div>
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="absolute left-1/2 transform -translate-x-1/2 hidden sm:block"
          style={{ bottom: '-2rem' }}
        >
          <div className="animate-bounce">
            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-white rotate-90" />
          </div>
        </motion.div>
      </PageHeader>

      {/* Countdown Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-10 md:mb-12"
          >
            <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
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
      <section className="py-12 sm:py-16 md:py-20 px-4 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-6 sm:gap-8"
          >
            <div className="bg-card rounded-2xl shadow-soft p-6 sm:p-8">
              <h3 className="font-playfair text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                Nuestra Historia
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Después de 5 años juntos, hemos decidido dar el paso más importante 
                de nuestras vidas. Queremos compartir este momento tan especial con 
                las personas que más queremos. Vuestra presencia es el mejor regalo 
                que podemos recibir.
              </p>
            </div>
            
            <div className="bg-card rounded-2xl shadow-soft p-6 sm:p-8">
              <h3 className="font-playfair text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                El Lugar
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-4">
                La celebración tendrá lugar en la hermosa Hacienda Las Yeguas, 
                un espacio único rodeado de naturaleza y elegancia, perfecto 
                para crear recuerdos inolvidables.
              </p>
              <a 
                href="https://maps.google.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-2 text-sm sm:text-base"
              >
                <MapPin className="w-4 h-4" />
                Ver en el mapa
              </a>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-8 sm:mt-10 md:mt-12"
          >
            <Link to="/actividades">
              <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 shadow-gold hover:shadow-medium transition-smooth w-full sm:w-auto">
                Ver programa del día
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Index;
