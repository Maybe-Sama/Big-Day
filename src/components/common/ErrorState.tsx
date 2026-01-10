import { ReactNode } from "react";
import { AlertCircle, LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Estado de error consistente para toda la aplicación.
 * Optimizado para móviles con espaciado y tipografía responsivos.
 * 
 * @example
 * ```tsx
 * <ErrorState
 *   title="Acceso Restringido"
 *   description="Esta página solo es accesible mediante invitación"
 *   action={<Button onClick={goHome}>Volver al inicio</Button>}
 * />
 * ```
 */
const ErrorState = ({
  icon: Icon = AlertCircle,
  title,
  description,
  action,
  className,
}: ErrorStateProps) => {
  return (
    <div className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-4">
      <div className="container mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("bg-card rounded-2xl shadow-soft p-6 sm:p-8 text-center", className)}
        >
          <Icon className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mx-auto mb-3 sm:mb-4" />
          <h1 className="font-playfair text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">{title}</h1>
          {description && (
            <p className="text-muted-foreground text-sm sm:text-base mb-4 sm:mb-6">{description}</p>
          )}
          {action && <div className="mt-4 sm:mt-6">{action}</div>}
        </motion.div>
      </div>
    </div>
  );
};

export default ErrorState;

