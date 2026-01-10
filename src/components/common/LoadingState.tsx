import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

/**
 * Estado de carga consistente para toda la aplicación.
 * Optimizado para móviles con tamaños responsivos.
 * 
 * @example
 * ```tsx
 * <LoadingState message="Cargando invitados..." />
 * ```
 */
const LoadingState = ({ message = "Cargando...", className }: LoadingStateProps) => {
  return (
    <div className={cn("flex items-center justify-center py-12 sm:py-16 md:py-20 px-4", className)}>
      <div className="text-center space-y-3 sm:space-y-4">
        <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary mx-auto animate-spin" />
        <p className="text-muted-foreground text-sm sm:text-base">{message}</p>
      </div>
    </div>
  );
};

export default LoadingState;

