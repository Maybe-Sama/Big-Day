import { motion } from "framer-motion";
import { Clock, MapPin, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const activities = [
  {
    time: "16:30",
    title: "Llegada de Invitados",
    description: "Recepción y bienvenida en los jardines de la hacienda",
    location: "Jardines Principales",
    mapUrl: "https://maps.google.com/?q=Hacienda+Los+Olivos",
  },
  {
    time: "17:00",
    title: "Ceremonia",
    description: "Ceremonia de boda al aire libre bajo el arco de flores",
    location: "Jardín de Ceremonias",
    mapUrl: "https://maps.google.com/?q=Hacienda+Los+Olivos",
  },
  {
    time: "18:00",
    title: "Cóctel",
    description: "Cóctel de bienvenida con canapés y bebidas",
    location: "Terraza Principal",
    mapUrl: "https://maps.google.com/?q=Hacienda+Los+Olivos",
  },
  {
    time: "19:30",
    title: "Cena",
    description: "Cena de gala con menú de tres tiempos",
    location: "Salón Principal",
    mapUrl: "https://maps.google.com/?q=Hacienda+Los+Olivos",
  },
  {
    time: "21:00",
    title: "Primer Baile",
    description: "Primer baile de los novios y apertura de pista",
    location: "Salón Principal",
    mapUrl: "https://maps.google.com/?q=Hacienda+Los+Olivos",
  },
  {
    time: "21:30",
    title: "Fiesta",
    description: "Baile y celebración hasta la madrugada",
    location: "Salón Principal",
    mapUrl: "https://maps.google.com/?q=Hacienda+Los+Olivos",
  },
  {
    time: "00:00",
    title: "Brindis de Medianoche",
    description: "Brindis especial y corte de pastel",
    location: "Salón Principal",
    mapUrl: "https://maps.google.com/?q=Hacienda+Los+Olivos",
  },
];

const Actividades = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 bg-gradient-to-b from-secondary/30 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-playfair text-5xl md:text-6xl font-bold mb-4"
          >
            Cronograma del Día
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg"
          >
            Aquí encontrarás todos los detalles de las actividades del día más especial
          </motion.p>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-border" />

            {/* Timeline Items */}
            <div className="space-y-12">
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
                  <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-4 border-background z-10 shadow-gold" />

                  {/* Content */}
                  <div
                    className={`ml-20 md:ml-0 ${
                      index % 2 === 0 ? "md:pr-[calc(50%+2rem)]" : "md:pl-[calc(50%+2rem)] md:text-right"
                    }`}
                  >
                    <Card className="shadow-soft hover:shadow-medium transition-smooth">
                      <CardHeader>
                        <div className={`flex items-center gap-2 text-primary mb-2 ${index % 2 === 0 ? "" : "md:justify-end"}`}>
                          <Clock className="w-4 h-4" />
                          <span className="font-semibold">{activity.time}</span>
                        </div>
                        <CardTitle className="text-2xl font-playfair">{activity.title}</CardTitle>
                        <CardDescription className="text-base">{activity.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className={`flex items-start ${index % 2 === 0 ? "justify-between" : "md:justify-between md:flex-row-reverse"} gap-4`}>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span>{activity.location}</span>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={activity.mapUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Mapa
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Location Info Section */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="container mx-auto max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="font-playfair text-4xl font-bold mb-4">Ubicación</h2>
            <p className="text-muted-foreground text-lg">Hacienda Los Olivos</p>
            <p className="text-muted-foreground">Carretera de Madrid km 12</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-2xl overflow-hidden shadow-medium h-96"
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.8!2d-100.1!3d19.2!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTnCsDEyJzAwLjAiTiAxMDDCsDA2JzAwLjAiVw!5e0!3m2!1sen!2smx!4v1234567890"
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
            className="mt-8 text-center"
          >
            <Button asChild className="shadow-gold hover:shadow-medium transition-smooth">
              <a
                href="https://maps.google.com/?q=Hacienda+Los+Olivos"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                Abrir en Google Maps
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Actividades;
