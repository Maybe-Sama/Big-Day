import { ReactNode } from "react";
import { motion, MotionProps } from "framer-motion";

export interface FadeInProps extends Omit<MotionProps, "initial" | "animate" | "transition"> {
  children: ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
}

/**
 * Componente de animación FadeIn reutilizable.
 * Usa esto en lugar de motion.div con animaciones inline.
 * 
 * @example
 * ```tsx
 * <FadeIn delay={0.2} y={20}>
 *   <Card>Contenido aquí</Card>
 * </FadeIn>
 * ```
 */
const FadeIn = ({ 
  children, 
  delay = 0, 
  duration = 0.5, 
  y = 20,
  ...motionProps 
}: FadeInProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration }}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};

export default FadeIn;

