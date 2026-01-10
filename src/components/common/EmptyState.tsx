import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Estado vacío reutilizable para listas/galerías sin contenido.
 * Optimizado para móviles con tamaños responsivos.
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   icon={ImageIcon}
 *   title="Aún no hay fotos"
 *   description="¡Sé el primero en compartir!"
 *   action={<Button>Subir foto</Button>}
 * />
 * ```
 */
const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) => {
  return (
    <div className={cn("text-center py-12 sm:py-16 md:py-20 px-4", className)}>
      {Icon && (
        <Icon className="w-16 h-16 sm:w-20 sm:h-20 text-muted-foreground mx-auto mb-4 opacity-50" />
      )}
      <h3 className="text-lg sm:text-xl font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-base sm:text-lg mb-6 max-w-md mx-auto">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

export default EmptyState;

