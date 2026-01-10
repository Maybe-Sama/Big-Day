import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-6 sm:py-8">
      <div className="container mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2">
          <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-primary fill-primary" />
          <span className="font-playfair text-base sm:text-lg">Virginia & Alejandro</span>
          <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-primary fill-primary" />
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          13 de Junio, 2026 • Love on the Brain
        </p>
      </div>
    </footer>
  );
};

export default Footer;
