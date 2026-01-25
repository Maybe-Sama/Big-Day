import { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  description?: string;
  variant?: "default" | "hero" | "simple";
  backgroundImage?: string;
  /**
   * Imagen alternativa SOLO para desktop (>= 1024px).
   * Si no se proporciona, se reutiliza `backgroundImage`.
   */
  backgroundImageDesktop?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * Header reutilizable para páginas con título, descripción y animación.
 * Optimizado para móviles con tamaños de fuente responsivos.
 * 
 * Variantes:
 * - `default`: Header con fondo degradado (para páginas internas)
 * - `hero`: Hero full-screen con imagen de fondo
 * - `simple`: Header simple sin fondo especial
 * 
 * @example
 * ```tsx
 * <PageHeader
 *   title="Cronograma del Día"
 *   description="Todos los detalles de las actividades"
 *   variant="default"
 * />
 * ```
 */
const PageHeader = ({
  title,
  description,
  variant = "default",
  backgroundImage,
  backgroundImageDesktop,
  children,
  className,
}: PageHeaderProps) => {
  const variants = {
    default: "pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-14 md:pb-16 px-4 bg-gradient-to-b from-secondary/30 to-background",
    hero: "relative min-h-[100svh] flex items-center justify-center overflow-hidden",
    simple: "pt-20 sm:pt-22 md:pt-24 pb-8 sm:pb-10 md:pb-12 px-4",
  };

  if (variant === "hero") {
    const heroStyle =
      backgroundImage
        ? ({
            ["--hero-image-mobile" as any]: `url(${backgroundImage})`,
            ["--hero-image-desktop" as any]: `url(${backgroundImageDesktop ?? backgroundImage})`,
          } as CSSProperties)
        : undefined;

    return (
      <section className={cn(variants.hero, className)}>
        {backgroundImage && (
          <div
            className="absolute inset-0 bg-cover bg-center hero-bg-position hero-bg-image"
            style={heroStyle}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent via-70% to-background" />
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-4 sm:px-6 text-white max-w-5xl mx-auto mt-32 sm:mt-80 md:mt-80"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="font-playfair text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-4 sm:mb-6 leading-tight"
          >
            {title}
          </motion.h1>

          {description && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-base sm:text-lg md:text-xl lg:text-2xl font-light px-4"
            >
              {description}
            </motion.p>
          )}

          {children && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              {children}
            </motion.div>
          )}
        </motion.div>
      </section>
    );
  }

  return (
    <section className={cn(variants[variant], className)}>
      <div className="container mx-auto max-w-4xl text-center px-4">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-playfair text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 leading-tight text-primary"
        >
          {title}
        </motion.h1>

        {description && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-base sm:text-lg md:text-xl leading-relaxed"
          >
            {description}
          </motion.p>
        )}

        {children && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 sm:mt-6"
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default PageHeader;

