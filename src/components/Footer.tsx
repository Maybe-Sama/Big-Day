import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-8">
      <div className="container mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Heart className="w-5 h-5 text-primary fill-primary" />
          <span className="font-playfair text-lg">Ana & Roberto</span>
          <Heart className="w-5 h-5 text-primary fill-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          15 de Junio, 2025 • Con todo nuestro amor
        </p>
      </div>
    </footer>
  );
};

export default Footer;
