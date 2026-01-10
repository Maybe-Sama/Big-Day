import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl";
  className?: string;
}

/**
 * Modal base reutilizable para toda la aplicación.
 * Optimizado para móviles con diseño responsive y animaciones consistentes.
 * 
 * @example
 * ```tsx
 * <AppModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Mi Modal"
 *   description="Descripción del modal"
 *   footer={
 *     <>
 *       <Button variant="outline" onClick={handleClose}>Cancelar</Button>
 *       <Button onClick={handleSave}>Guardar</Button>
 *     </>
 *   }
 * >
 *   <div>Contenido del modal</div>
 * </AppModal>
 * ```
 */
const AppModal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "lg",
  className,
}: AppModalProps) => {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "bg-background rounded-xl sm:rounded-2xl shadow-2xl w-full",
              maxWidthClasses[maxWidth],
              "max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col",
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 md:p-6 border-b flex-shrink-0">
              <div className="flex-1 min-w-0 pr-2">
                <h2 className="text-lg sm:text-xl md:text-2xl font-playfair font-bold truncate">
                  {title}
                </h2>
                {description && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">
                    {description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="sr-only">Cerrar</span>
              </Button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-5 md:p-6 overflow-y-auto flex-1">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 p-4 sm:p-5 md:p-6 border-t bg-muted/50 flex-shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AppModal;

