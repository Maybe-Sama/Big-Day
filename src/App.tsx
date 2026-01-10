import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Actividades from "./pages/Actividades";
import RSVP from "./pages/RSVP";
import Fotos from "./pages/Fotos";
import Mesa from "./pages/Mesa";
import AdminOculto from "./pages/AdminOculto";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/actividades" element={<Actividades />} />
          <Route path="/rsvp" element={<RSVP />} />
          <Route path="/fotos" element={<Fotos />} />
          <Route path="/mesa" element={<Mesa />} />
          <Route path="/admin/oculto" element={<AdminOculto />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
