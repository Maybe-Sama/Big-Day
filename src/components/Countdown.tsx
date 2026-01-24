import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const Countdown = () => {
  // Fecha de la boda: 13 de junio de 2026 a las 19:00 (hora España peninsular, CEST)
  // Nota: incluimos offset para evitar que el navegador lo interprete en la zona horaria del visitante.
  const WEDDING_DATE = "2026-06-13T19:00:00+01:00";
  
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      // Calcular la fecha de la boda en cada actualización para evitar problemas de zona horaria
      const weddingDate = new Date(WEDDING_DATE).getTime();
      const distance = weddingDate - now;

      // Si la fecha ya pasó, mostrar ceros
      if (distance <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
        return;
      }

      // Calcular de forma más precisa y robusta
      // Convertir distancia a segundos totales
      const totalSeconds = Math.floor(distance / 1000);
      
      // Calcular días, horas, minutos y segundos
      const days = Math.floor(totalSeconds / (60 * 60 * 24));
      const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
      const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
      });
    };

    // Calcular inmediatamente al montar
    calculateTimeLeft();

    // Actualizar cada segundo
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, []);

  const timeUnits = [
    { value: timeLeft.days, label: "Días" },
    { value: timeLeft.hours, label: "Horas" },
    { value: timeLeft.minutes, label: "Minutos" },
    { value: timeLeft.seconds, label: "Segundos" },
  ];

  return (
    <div className="flex justify-between lg:justify-center items-start w-full px-4 sm:px-8 md:px-12 lg:gap-12 xl:gap-16">
      {timeUnits.map((unit, index) => (
        <motion.div
          key={unit.label}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.1 }}
          className="flex flex-col items-center justify-start flex-shrink-0"
        >
          {/* Contenedor de la corona con el número */}
          <div className="relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 mb-2 sm:mb-3">
            {/* Corona individual detrás de cada número */}
            <img 
              src="/corona.png"
              alt=""
              className="absolute inset-0 w-full h-full object-contain pointer-events-none scale-110 sm:scale-110"
              style={{
                objectPosition: 'center',
              }}
            />
            
            {/* Número centrado (punto intermedio) */}
            <div 
              className="relative z-10 text-2xl sm:text-3xl md:text-4xl font-playfair font-bold" 
              style={{ 
                color: 'rgb(98, 133, 169)',
                transform: 'translateY(-8px)'
              }}
            >
              {Math.max(0, unit.value).toString().padStart(2, "0")}
            </div>
          </div>
          
          {/* Etiqueta fuera de la imagen, debajo */}
          <div className="text-xs sm:text-xs md:text-sm text-muted-foreground uppercase tracking-wide text-center leading-tight">
            {unit.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default Countdown;
