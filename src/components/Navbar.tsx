import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";

const Navbar = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const hasValidToken = searchParams.get("token");
  
  const isActive = (path: string) => location.pathname === path;
  
  // Solo mostrar "Confirmar" en el navbar si estamos en la página RSVP con token válido
  const navItems = [
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
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <Heart className="w-6 h-6 text-primary transition-transform group-hover:scale-110" />
            <span className="font-playfair text-xl font-semibold">A&R</span>
          </Link>
          
          <div className="flex gap-6">
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
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
