import { useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Heart, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const hasValidToken = searchParams.get("token");
  
  const isActive = (path: string) => location.pathname === path;
  
  // En la página RSVP con token válido, solo mostrar "Invitación" y "Fotos"
  const navItems = location.pathname === "/rsvp" && hasValidToken
    ? [
        { path: "/rsvp", label: "Invitación" },
        { path: "/fotos", label: "Fotos" },
      ]
    : [
        { path: "/", label: "Inicio" },
        { path: "/actividades", label: "Actividades" },
        ...(location.pathname === "/rsvp" && hasValidToken 
          ? [{ path: "/rsvp", label: "Confirmar" }] 
          : []),
        { path: "/fotos", label: "Fotos" },
      ];

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-soft"
    >
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <Heart className="w-5 h-5 md:w-6 md:h-6 text-primary transition-transform group-hover:scale-110" />
            <span className="font-playfair text-lg md:text-xl font-semibold">V&A</span>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-smooth ${
                  isActive(item.path)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              <div className="flex flex-col gap-6 mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-6 h-6 text-primary" />
                  <span className="font-playfair text-2xl font-semibold">Virginia & Alejandro</span>
                </div>
                
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`text-lg font-medium transition-smooth py-2 ${
                      isActive(item.path)
                        ? "text-primary font-semibold"
                        : "text-muted-foreground hover:text-primary"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
