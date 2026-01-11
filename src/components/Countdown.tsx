import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const Countdown = () => {
  const weddingDate = new Date("2025-06-15T19:00:00").getTime();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = weddingDate - now;

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const timeUnits = [
    { value: timeLeft.days, label: "Días" },
    { value: timeLeft.hours, label: "Horas" },
    { value: timeLeft.minutes, label: "Minutos" },
    { value: timeLeft.seconds, label: "Segundos" },
  ];

  return (
    <div className="flex justify-between lg:justify-center items-center w-full px-4 sm:px-8 md:px-12 lg:gap-12 xl:gap-16">
      {timeUnits.map((unit, index) => (
        <motion.div
          key={unit.label}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.1 }}
          className="relative flex flex-col items-center justify-center flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28"
        >
          {/* Corona individual detrás de cada número */}
          <img 
            src="/corona.png"
            alt=""
            className="absolute inset-0 w-full h-full object-contain pointer-events-none scale-110 sm:scale-110"
            style={{
              objectPosition: 'center',
            }}
          />
          
          {/* Número con fondo transparente */}
          <div className="relative z-10 text-2xl sm:text-3xl md:text-4xl font-playfair font-bold text-primary mb-1 sm:mb-2">
            {unit.value.toString().padStart(2, "0")}
          </div>
          
          {/* Etiqueta */}
          <div className="relative z-10 text-xs sm:text-xs md:text-sm text-muted-foreground uppercase tracking-wide text-center leading-tight">
            {unit.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default Countdown;
