import { ReactNode } from "react";
import { motion, MotionProps } from "framer-motion";

export interface StaggerChildrenProps extends Omit<MotionProps, "initial" | "animate" | "variants"> {
  children: ReactNode;
  stagger?: number;
  delayChildren?: number;
}

/**
 * Componente para animar hijos con efecto stagger (escalonado).
 * 
 * @example
 * ```tsx
 * <StaggerChildren stagger={0.1}>
 *   {items.map(item => (
 *     <FadeIn key={item.id}>
 *       <Card>{item.content}</Card>
 *     </FadeIn>
 *   ))}
 * </StaggerChildren>
 * ```
 */
const StaggerChildren = ({ 
  children, 
  stagger = 0.1,
  delayChildren = 0,
  ...motionProps 
}: StaggerChildrenProps) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren,
        staggerChildren: stagger,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};

export default StaggerChildren;

