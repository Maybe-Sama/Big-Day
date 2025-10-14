import { motion } from "framer-motion";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Countdown from "@/components/Countdown";
import heroImage from "@/assets/hero-wedding.jpg";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-background" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-4 text-white"
        >
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="font-playfair text-6xl md:text-8xl font-bold mb-6"
          >
            Ana & Roberto
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="space-y-4 mb-8"
          >
            <div className="flex items-center justify-center gap-3 text-lg md:text-xl">
              <Calendar className="w-6 h-6" />
              <span>15 de Junio, 2025 • 16:00h</span>
            </div>
            
            <div className="flex items-center justify-center gap-3 text-lg md:text-xl">
              <MapPin className="w-6 h-6" />
              <span>Hacienda Los Olivos, Madrid</span>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <p className="text-xl md:text-2xl mb-8 font-light">
              Nos casamos y queremos celebrarlo contigo
            </p>
          </motion.div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <div className="animate-bounce">
            <ArrowRight className="w-6 h-6 text-white rotate-90" />
          </div>
        </motion.div>
      </section>

      {/* Countdown Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-4">
              Faltan...
            </h2>
            <p className="text-muted-foreground text-lg">
              Para el día más especial de nuestras vidas
            </p>
          </motion.div>
          
          <Countdown />
        </div>
      </section>

      {/* Info Section */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-8"
          >
            <div className="bg-card rounded-2xl shadow-soft p-8">
              <h3 className="font-playfair text-3xl font-bold mb-4">
                Nuestra Historia
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Después de 5 años juntos, hemos decidido dar el paso más importante 
                de nuestras vidas. Queremos compartir este momento tan especial con 
                las personas que más queremos. Vuestra presencia es el mejor regalo 
                que podemos recibir.
              </p>
            </div>
            
            <div className="bg-card rounded-2xl shadow-soft p-8">
              <h3 className="font-playfair text-3xl font-bold mb-4">
                El Lugar
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                La celebración tendrá lugar en la hermosa Hacienda Los Olivos, 
                un espacio único rodeado de naturaleza y elegancia, perfecto 
                para crear recuerdos inolvidables.
              </p>
              <a 
                href="https://maps.google.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-2"
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
            className="text-center mt-12"
          >
            <Link to="/actividades">
              <Button size="lg" className="text-lg px-8 py-6 shadow-gold hover:shadow-medium transition-smooth">
                Ver programa del día
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
