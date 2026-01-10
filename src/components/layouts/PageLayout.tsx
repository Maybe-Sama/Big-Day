import { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";

export interface PageLayoutProps {
  children: ReactNode;
  showNavbar?: boolean;
  showFooter?: boolean;
  className?: string;
}

/**
 * Layout estándar para TODAS las páginas públicas del sitio.
 * 
 * Features:
 * - Incluye Navbar y Footer automáticamente
 * - Estructura min-h-screen
 * - Props opcionales para ocultar navbar/footer si es necesario
 * 
 * @example
 * ```tsx
 * <PageLayout>
 *   <PageHeader title="Mi Página" description="Descripción" />
 *   <section>Contenido aquí</section>
 * </PageLayout>
 * ```
 */
const PageLayout = ({
  children,
  showNavbar = true,
  showFooter = true,
  className,
}: PageLayoutProps) => {
  return (
    <div className={cn("min-h-screen", className)}>
      {showNavbar && <Navbar />}
      <main>{children}</main>
      {showFooter && <Footer />}
    </div>
  );
};

export default PageLayout;

