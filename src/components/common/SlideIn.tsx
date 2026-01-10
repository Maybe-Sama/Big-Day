import { ReactNode } from "react";
import { motion, MotionProps } from "framer-motion";

export interface SlideInProps extends Omit<MotionProps, "initial" | "animate" | "transition"> {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  duration?: number;
  distance?: number;
}

/**
 * Componente de animación SlideIn reutilizable.
 * 
 * @example
 * ```tsx
 * <SlideIn direction="left" delay={0.1}>
 *   <div>Contenido aquí</div>
 * </SlideIn>
 * ```
 */
const SlideIn = ({ 
  children, 
  direction = "up",
  delay = 0, 
  duration = 0.5,
  distance = 30,
  ...motionProps 
}: SlideInProps) => {
  const directions = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  };

  const initial = {
    opacity: 0,
    ...directions[direction],
  };

  const animate = {
    opacity: 1,
    x: 0,
    y: 0,
  };

  return (
    <motion.div
      initial={initial}
      animate={animate}
      transition={{ delay, duration }}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};

export default SlideIn;

