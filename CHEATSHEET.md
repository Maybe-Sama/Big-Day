# 📝 Cheatsheet Rápido - Forever Forms

> Referencia rápida de 1 página para copiar y pegar mientras desarrollas.

---

## 🏗️ Plantilla de Página Nueva

```tsx
import { PageLayout } from "@/components/layouts";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";

const MiPagina = () => {
  return (
    <PageLayout>
      <PageHeader
        title="Título"
        description="Descripción"
        variant="default"
      />

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Contenido aquí */}
        </div>
      </section>
    </PageLayout>
  );
};

export default MiPagina;
```

---

## 🎨 PageHeader - 3 Variantes

```tsx
// 1. Default (con fondo degradado)
<PageHeader
  title="Mi Título"
  description="Mi descripción"
  variant="default"
/>

// 2. Hero (full-screen con imagen)
<PageHeader
  title="Hero Title"
  description="Descripción del hero"
  variant="hero"
  backgroundImage="/path/to/image.jpg"
>
  <Button>CTA</Button>
</PageHeader>

// 3. Simple (sin fondo especial)
<PageHeader
  title="Título Simple"
  description="Descripción"
  variant="simple"
/>
```

---

## 🔄 Estados (Loading, Empty, Error)

```tsx
import { LoadingState, EmptyState, ErrorState } from "@/components/common";
import { ImageIcon } from "lucide-react";

// Loading
<LoadingState message="Cargando..." />

// Empty
<EmptyState
  icon={ImageIcon}
  title="No hay datos"
  description="Descripción"
  action={<Button>Acción</Button>}
/>

// Error
<ErrorState
  title="Error"
  description="Descripción del error"
  action={<Button>Reintentar</Button>}
/>
```

---

## 🪟 Modales (AppModal)

```tsx
import { AppModal } from "@/components/common";

<AppModal
  isOpen={isOpen}
  onClose={handleClose}
  title="Título del Modal"
  description="Descripción opcional"
  maxWidth="lg"  // "sm" | "md" | "lg" | "xl" | "2xl" | "4xl"
  footer={
    <>
      <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto text-sm">
        Cancelar
      </Button>
      <Button onClick={handleSave} className="w-full sm:w-auto text-sm">
        Guardar
      </Button>
    </>
  }
>
  {/* Contenido del modal */}
  <div>Tu contenido aquí</div>
</AppModal>
```

**Características**:
- ✅ 100% responsive para móvil
- ✅ Animaciones consistentes
- ✅ Header, content y footer configurables
- ✅ Botones full-width en móvil automáticamente
- ✅ Padding adaptativo

---

## ✨ Animaciones

```tsx
import { FadeIn, SlideIn, StaggerChildren } from "@/components/common";

// FadeIn básico
<FadeIn>
  <Card>Contenido</Card>
</FadeIn>

// FadeIn con delay personalizado
<FadeIn delay={0.3} y={30}>
  <Card>Contenido</Card>
</FadeIn>

// SlideIn
<SlideIn direction="left" delay={0.2}>
  <div>Contenido</div>
</SlideIn>

// Animar lista con stagger
<StaggerChildren stagger={0.1}>
  {items.map(item => (
    <FadeIn key={item.id}>
      <Card>{item.name}</Card>
    </FadeIn>
  ))}
</StaggerChildren>
```

---

## 🎨 Clases Tailwind Comunes (100% Responsive)

```tsx
// TÍTULOS RESPONSIVE
"font-playfair text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4"  // H1
"font-playfair text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4"             // H2
"text-base sm:text-lg md:text-xl lg:text-2xl font-light"                            // Subtitle

// SECCIONES RESPONSIVE
"py-12 sm:py-16 md:py-20 px-4"                            // Sección estándar
"py-12 sm:py-16 md:py-20 px-4 bg-secondary/30"           // Con fondo alternativo
"container mx-auto max-w-4xl px-4"                        // Container centrado

// CARDS RESPONSIVE
"bg-card rounded-xl sm:rounded-2xl shadow-soft p-5 sm:p-6 md:p-8"                   // Card básico
"bg-card rounded-xl sm:rounded-2xl shadow-soft hover:shadow-medium transition-smooth p-5 sm:p-6 md:p-8"  // Con hover

// BOTONES RESPONSIVE (usando Button de shadcn)
className="shadow-gold hover:shadow-medium transition-smooth w-full sm:w-auto"       // Full-width móvil
size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6"              // Tamaños adaptativos

// ICONOS RESPONSIVE
"w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6"                    // Iconos adaptativos

// GRID RESPONSIVE
"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6"  // Grid adaptativo

// ESPACIADO RESPONSIVE
"space-y-3 sm:space-y-4 md:space-y-6"                    // Espaciado vertical
"gap-3 sm:gap-4 md:gap-6"                                // Gap en flex/grid
```

---

## 📦 Imports Comunes

```tsx
// Layouts
import { PageLayout } from "@/components/layouts";

// Componentes comunes (todo en uno)
import { 
  PageHeader, 
  EmptyState, 
  LoadingState, 
  ErrorState,
  FadeIn,
  SlideIn,
  StaggerChildren 
} from "@/components/common";

// UI de shadcn
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Iconos
import { MapPin, Calendar, Heart } from "lucide-react";

// Animaciones (solo si necesitas algo custom)
import { motion } from "framer-motion";

// Utils
import { cn } from "@/lib/utils";
```

---

## 🛣️ Estructura de Rutas (App.tsx)

```tsx
<Route path="/nueva-pagina" element={<NuevaPagina />} />
```

---

## 🎯 Decisiones Rápidas

**¿Dónde pongo mi componente nuevo?**
- Usado en 3+ lugares → `components/common/`
- Específico de feature → `components/features/[feature]/`
- Es un layout → `components/layouts/`

**¿Cuándo creo un componente nuevo?**
- Si ya existe algo similar → **Reutiliza o extiende**
- Si se usará 2+ veces → **Crea componente**
- Si es único → **Déjalo en la página**

---

## 📝 Plantilla de Componente

```tsx
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface MiComponenteProps {
  children: ReactNode;
  variant?: "default" | "primary";
  className?: string;
}

/**
 * Descripción del componente.
 * 
 * @example
 * ```tsx
 * <MiComponente variant="primary">
 *   Contenido
 * </MiComponente>
 * ```
 */
const MiComponente = ({ 
  children, 
  variant = "default", 
  className 
}: MiComponenteProps) => {
  return (
    <div className={cn("base-classes", className)}>
      {children}
    </div>
  );
};

export default MiComponente;
```

---

## ⚡ Atajos de Desarrollo

```bash
# Dev
npm run dev

# Build
npm run build

# Lint
npm run lint
```

---

## 🚫 NO HACER

```tsx
// ❌ Estructura manual de página
<div className="min-h-screen">
  <Navbar />
  <div>Contenido</div>
  <Footer />
</div>

// ❌ Motion inline repetido
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

// ❌ Estados duplicados
<div className="text-center py-20">
  <p>No hay datos</p>
</div>

// ❌ Nombres poco claros
NewComponent2.tsx
TempFile.tsx
```

---

## ✅ HACER

```tsx
// ✅ Usar PageLayout
<PageLayout>
  <div>Contenido</div>
</PageLayout>

// ✅ Usar componentes de animación
<FadeIn>...</FadeIn>

// ✅ Usar componentes de estado
<EmptyState title="No hay datos" />

// ✅ Nombres descriptivos
InvitadoCard.tsx
FotoGallery.tsx
```

---

## 📱 Reglas de Responsive Design

### SIEMPRE:
```tsx
// ✅ Tamaños progresivos
text-base sm:text-lg md:text-xl

// ✅ Padding adaptativo
p-5 sm:p-6 md:p-8

// ✅ Botones full-width en móvil
w-full sm:w-auto

// ✅ Grid responsive
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
```

### NUNCA:
```tsx
// ❌ Tamaños fijos grandes
text-6xl p-12 w-96

// ❌ Un solo breakpoint
md:text-lg (debe ser: text-base sm:text-lg md:text-xl)
```

---

## 📚 Documentación

- **Arquitectura completa**: `ARCHITECTURE_GUIDE.md`
- **Guía de desarrollo**: `README_DESARROLLO.md`
- **Responsive design**: `MOBILE_RESPONSIVE_SUMMARY.md` ⭐
- **Comparación antes/después**: `BEFORE_AFTER_COMPARISON.md`
- **Resumen de refactor**: `REFACTOR_SUMMARY.md`

---

**Imprime esta página y tenla siempre a mano** 📌

