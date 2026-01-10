# 🚀 Guía de Desarrollo - Forever Forms

> **Para desarrolladores**: Este documento complementa el `ARCHITECTURE_GUIDE.md` con información práctica de uso diario.

---

## 📦 Instalación y Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev

# Build de producción
npm run build

# Preview de producción
npm run preview

# Linting
npm run lint
```

---

## 🎯 Componentes Reutilizables (Quick Reference)

### 1. PageLayout

**Uso obligatorio** en todas las páginas:

```tsx
import { PageLayout } from "@/components/layouts";

const MiPagina = () => (
  <PageLayout>
    {/* Tu contenido */}
  </PageLayout>
);
```

**Props opcionales**:
- `showNavbar?: boolean` (default: `true`)
- `showFooter?: boolean` (default: `true`)
- `className?: string`

---

### 2. PageHeader

Header reutilizable con 3 variantes:

```tsx
import { PageHeader } from "@/components/common";

// Variante 1: Default (con fondo degradado)
<PageHeader
  title="Mi Título"
  description="Mi descripción"
  variant="default"
/>

// Variante 2: Hero (full-screen con imagen)
<PageHeader
  title="Virginia & Alejandro"
  description="Nos casamos"
  variant="hero"
  backgroundImage="/path/to/image.jpg"
>
  <Button>Call to Action</Button>
</PageHeader>

// Variante 3: Simple (sin fondo especial)
<PageHeader
  title="Título Simple"
  description="Descripción"
  variant="simple"
/>
```

---

### 3. Estados (Loading, Empty, Error)

```tsx
import { LoadingState, EmptyState, ErrorState } from "@/components/common";

// Loading
<LoadingState message="Cargando datos..." />

// Empty
<EmptyState
  icon={ImageIcon}
  title="No hay datos"
  description="Aún no se han agregado elementos"
  action={<Button>Agregar nuevo</Button>}
/>

// Error
<ErrorState
  title="Error"
  description="No se pudo cargar la información"
  action={<Button>Reintentar</Button>}
/>
```

---

### 4. Componentes de Animación

En lugar de usar `motion.div` directamente:

```tsx
import { FadeIn, SlideIn, StaggerChildren } from "@/components/common";

// FadeIn
<FadeIn delay={0.2} y={20}>
  <Card>Contenido</Card>
</FadeIn>

// SlideIn
<SlideIn direction="left" delay={0.1} distance={30}>
  <div>Contenido</div>
</SlideIn>

// StaggerChildren (animar lista)
<StaggerChildren stagger={0.1}>
  {items.map(item => (
    <FadeIn key={item.id}>
      <Card>{item.name}</Card>
    </FadeIn>
  ))}
</StaggerChildren>
```

---

## 🎨 Clases de Tailwind Comunes

### Títulos
```tsx
// H1 Principal
className="font-playfair text-5xl md:text-6xl font-bold mb-4"

// H2 Sección
className="font-playfair text-3xl md:text-4xl font-bold mb-4"

// Subtítulo
className="text-xl md:text-2xl font-light"
```

### Secciones
```tsx
// Sección estándar
className="py-20 px-4"

// Sección con fondo alternativo
className="py-20 px-4 bg-secondary/30"

// Container centrado
className="container mx-auto max-w-4xl"
```

### Cards
```tsx
// Card estándar
className="bg-card rounded-2xl shadow-soft p-8"

// Card con hover
className="bg-card rounded-2xl shadow-soft hover:shadow-medium transition-smooth p-8"
```

### Botones (usando componente Button de shadcn)
```tsx
// Botón primario con sombra especial
<Button className="shadow-gold hover:shadow-medium transition-smooth">
  Click me
</Button>

// Botón grande
<Button size="lg" className="text-lg px-8 py-6">
  Call to Action
</Button>
```

---

## 📂 Dónde Poner las Cosas

### ¿Nuevo componente?

**Pregúntate primero**:
1. ¿Ya existe algo similar? → **Reutilízalo o extiéndelo**
2. ¿Se usará en 2+ lugares? → **`components/common/`**
3. ¿Es específico de una feature? → **`components/features/[feature]/`**
4. ¿Es un layout? → **`components/layouts/`**

### ¿Nuevo hook?

- Si es reutilizable → **`hooks/`**
- Si es específico de una feature → **`components/features/[feature]/hooks/`**

### ¿Nueva función de utilidad?

- Helpers generales → **`lib/utils.ts`**
- Lógica de API → **`lib/[servicio].ts`** (ej: `lib/fotos.ts`)
- Tipos → **`types/[dominio].ts`** (ej: `types/invitados.ts`)

---

## 🔍 Patrón de Desarrollo Recomendado

### Al crear una nueva página:

```tsx
import { PageLayout, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";

const NuevaPagina = () => {
  return (
    <PageLayout>
      <PageHeader
        title="Título de la Página"
        description="Descripción breve"
        variant="default"
      />

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Tu contenido aquí */}
        </div>
      </section>
    </PageLayout>
  );
};

export default NuevaPagina;
```

### Al crear un componente reutilizable:

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

## 🚨 Errores Comunes a Evitar

### ❌ NO HACER
```tsx
// Duplicar estructura de página
const MiPagina = () => (
  <div className="min-h-screen">
    <Navbar />
    <div>Contenido</div>
    <Footer />
  </div>
);

// Usar motion.div directamente sin componente
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
  ...
</motion.div>

// Crear componentes con nombres poco claros
const NewCard2.tsx
const TempComponent.tsx
const XxxCopy.tsx
```

### ✅ HACER
```tsx
// Usar PageLayout siempre
const MiPagina = () => (
  <PageLayout>
    <div>Contenido</div>
  </PageLayout>
);

// Usar componentes de animación
<FadeIn>
  ...
</FadeIn>

// Nombres claros y descriptivos
const InvitadoCard.tsx
const FotoGallery.tsx
const RSVPForm.tsx
```

---

## 🧪 Testing (cuando se implemente)

```tsx
// Estructura recomendada para tests
describe("MiComponente", () => {
  it("renderiza correctamente", () => {
    // Test
  });

  it("maneja props correctamente", () => {
    // Test
  });

  it("maneja interacciones de usuario", () => {
    // Test
  });
});
```

---

## 📚 Recursos Útiles

- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Framer Motion**: https://www.framer.com/motion
- **React Router**: https://reactrouter.com
- **TypeScript**: https://www.typescriptlang.org/docs

---

## 🤝 Convenciones de Git

```bash
# Commits descriptivos
git commit -m "feat: agregar componente PageHeader"
git commit -m "fix: corregir animación en FadeIn"
git commit -m "refactor: unificar estructura de páginas"
git commit -m "docs: actualizar README_DESARROLLO"

# Prefijos recomendados:
# feat: nueva funcionalidad
# fix: corrección de bug
# refactor: refactorización de código
# docs: cambios en documentación
# style: cambios de formato/estilo
# test: agregar/modificar tests
# chore: tareas de mantenimiento
```

---

## ❓ ¿Dudas?

1. **Consulta primero**: `ARCHITECTURE_GUIDE.md`
2. **Busca ejemplos**: Revisa páginas existentes (Index, RSVP, Actividades, Fotos)
3. **Sigue los patrones**: Usa los componentes base siempre que sea posible

---

**Última actualización**: 15 de Noviembre, 2025

