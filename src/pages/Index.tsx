import { motion } from "framer-motion";
import { Calendar, MapPin, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Countdown from "@/components/Countdown";
import PageLayout from "@/components/layouts/PageLayout";
import PageHeader from "@/components/common/PageHeader";
import heroImage from "@/assets/hero-wedding.jpg";
import { activities } from "@/data/activities";

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
            <span className="text-center">13 de Junio, 2026 • 19:00h</span>
          </div>
          
          <div className="flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base md:text-lg lg:text-xl px-4">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" />
            <span className="text-center">Hacienda Las Yeguas<br />Fuentes de Andalucía, Sevilla</span>
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
      <section className="py-12 sm:py-16 md:py-20 px-4 bg-secondary/30">
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
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-8 sm:py-10 md:py-12 px-4">
        <div className="container mx-auto max-w-4xl">
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

      {/* Location Info Section */}
      <section className="py-10 sm:py-12 md:py-16 px-4 bg-secondary/30">
        <div className="container mx-auto max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-6 sm:mb-8"
          >
            <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-primary">Ubicación</h2>
            <p className="text-muted-foreground text-base sm:text-lg">Hacienda Las Yeguas</p>
            <p className="text-muted-foreground text-sm sm:text-base">Fuentes de Andalucía, Sevilla</p>
          </motion.div>

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
      </section>
    </PageLayout>
  );
};

export default Index;
