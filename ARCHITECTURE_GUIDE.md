# 🏛️ Guía de Arquitectura - Forever Forms (Boda Virginia & Alejandro)

> **Prompt Maestro**: Este documento define los patrones y reglas de desarrollo para mantener el código limpio, reutilizable y consistente.

---

## 📋 Contexto del Proyecto

**Proyecto**: Sitio web de invitaciones de boda con sistema RSVP, galería de fotos y gestión de invitados.

**Objetivo principal**: Código **reutilizable, tipado y coherente**. Siempre reutilizar antes de crear.

---

## 🛠️ Stack Tecnológico

- **Framework**: Vite + React 18
- **Lenguaje**: TypeScript (estricto)
- **Estilos**: Tailwind CSS (utility-first)
- **UI Library**: shadcn/ui (Radix UI + Tailwind)
- **Routing**: React Router DOM v6
- **Animaciones**: Framer Motion
- **Formularios**: React Hook Form + Zod
- **Base de datos**: IndexedDB (cliente)
- **Iconos**: lucide-react

---

## 📁 Estructura de Carpetas

```
src/
├── components/
│   ├── ui/              # shadcn/ui primitivos (no tocar)
│   ├── layouts/         # Layouts reutilizables de página
│   ├── common/          # Componentes comunes (PageHeader, EmptyState, etc.)
│   ├── features/        # Componentes específicos por feature
│   │   ├── invitados/   # Todo lo relacionado con invitados
│   │   ├── fotos/       # Todo lo relacionado con fotos
│   │   └── rsvp/        # Todo lo relacionado con RSVP
│   └── [ComponenteGenerico].tsx  # Componentes reutilizables de alto nivel
├── pages/               # Páginas (solo routing y composición)
├── hooks/               # Custom hooks reutilizables
├── lib/                 # Utilidades, helpers, servicios
├── types/               # Tipos e interfaces TypeScript
└── assets/              # Imágenes, fuentes, etc.
```

---

## 🎯 REGLA Nº1: ANTES DE CREAR, BUSCA Y REUTILIZA

### Proceso obligatorio antes de crear algo nuevo:

1. **Inspecciona** el código existente:
   - ¿Ya existe un componente similar?
   - ¿Ya hay un layout parecido?
   - ¿Ya existe esta lógica en un hook?

2. **Decide la estrategia**:
   - **Si existe**: Reutilízalo o extiéndelo con props
   - **Si NO existe pero hay patrones similares**: Extrae un componente base
   - **Si es totalmente nuevo**: Créalo de forma reutilizable desde el inicio

3. **Refactoriza código duplicado**:
   - Si ves 2+ bloques muy parecidos → crea un componente común
   - Si ves 3+ páginas con la misma estructura → crea un layout

---

## 🧱 Componentes Base del Sistema

### 1. Layouts

#### `PageLayout`
Wrapper estándar para TODAS las páginas públicas.

**Uso obligatorio** en: Index, Actividades, RSVP, Fotos.

```tsx
<PageLayout>
  {/* Contenido de tu página */}
</PageLayout>
```

**Features**:
- Incluye `<Navbar />` y `<Footer />` automáticamente
- Maneja `min-h-screen` y estructura base
- Props opcionales: `showNavbar`, `showFooter`, `className`

---

#### `AdminLayout`
Layout para panel de administración.

**Uso obligatorio** en: AdminOculto y futuras páginas admin.

```tsx
<AdminLayout>
  {/* Contenido admin */}
</AdminLayout>
```

---

### 2. Componentes Comunes

#### `PageHeader`
Header reutilizable para páginas con título + descripción + animación.

```tsx
<PageHeader
  title="Cronograma del Día"
  description="Aquí encontrarás todos los detalles de las actividades"
  variant="default" // "default" | "hero" | "simple"
/>
```

**Variantes**:
- `default`: Header normal con fondo degradado
- `hero`: Hero full con imagen de fondo
- `simple`: Solo título y descripción sin fondo especial

---

#### `EmptyState`
Estado vacío reutilizable para listas/galerías sin contenido.

```tsx
<EmptyState
  icon={ImageIcon}
  title="Aún no hay fotos"
  description="¡Sé el primero en compartir!"
  action={<Button>Subir foto</Button>}
/>
```

---

#### `LoadingState`
Estado de carga consistente.

```tsx
<LoadingState message="Cargando invitados..." />
```

---

#### `ErrorState`
Estado de error consistente.

```tsx
<ErrorState
  title="Acceso Restringido"
  description="Esta página solo es accesible mediante invitación"
  action={<Button>Volver al inicio</Button>}
/>
```

---

### 3. Componentes de Framer Motion

**SIEMPRE usar estos componentes** en lugar de `motion.div` directamente:

#### `FadeIn`
```tsx
<FadeIn delay={0.2}>
  <Card>...</Card>
</FadeIn>
```

#### `SlideIn`
```tsx
<SlideIn direction="up" delay={0.1}>
  <div>...</div>
</SlideIn>
```

#### `StaggerChildren`
```tsx
<StaggerChildren stagger={0.1}>
  {items.map(item => (
    <FadeIn key={item.id}>{item}</FadeIn>
  ))}
</StaggerChildren>
```

---

## 📝 Convenciones de Naming

### Componentes
- **PascalCase**: `PageLayout`, `PageHeader`, `InvitadoCard`
- **Archivos**: Mismo nombre que el componente → `PageLayout.tsx`
- **NO usar**: `Component`, `New`, `V2`, `Copy`, `Final` en nombres

### Hooks
- **Prefijo `use`**: `useInvitados`, `useFotos`, `useRSVP`
- **Archivos**: kebab-case → `use-invitados.ts`

### Tipos
- **PascalCase**: `Invitado`, `Foto`, `RSVP`
- **Props**: `[Componente]Props` → `PageLayoutProps`

### Funciones
- **camelCase**: `getInvitadoByToken`, `uploadFoto`, `confirmRSVP`

---

## 🎨 Sistema de Diseño

### Tipografía
- **Headings**: `font-playfair` (elegante, serif)
- **Body**: `font-sans` (por defecto, legible)

### Tamaños de Texto
```tsx
// Títulos principales
"text-5xl md:text-6xl font-playfair font-bold"

// Títulos secundarios
"text-3xl md:text-4xl font-playfair font-bold"

// Subtítulos
"text-xl md:text-2xl"

// Body
"text-base" // 16px por defecto
"text-lg"   // 18px para destacar
```

### Espaciado
```tsx
// Secciones
"py-20 px-4" // Sección estándar
"py-12 px-4" // Sección compacta

// Cards
"p-8" // Padding interno estándar
"p-6" // Padding compacto

// Gaps
"gap-4"  // Gap estándar
"gap-6"  // Gap grande
"gap-8"  // Gap extra grande
```

### Colores Semánticos
```tsx
// Primarios
"text-primary"      // Color principal (dorado/elegante)
"bg-primary"

// Fondo
"bg-background"     // Fondo principal
"bg-card"           // Fondo de cards
"bg-secondary/30"   // Fondo suave con opacidad

// Texto
"text-foreground"         // Texto principal
"text-muted-foreground"   // Texto secundario

// Bordes
"border-border"     // Borde estándar
```

### Sombras (Custom)
```tsx
"shadow-soft"      // Sombra suave
"shadow-medium"    // Sombra media
"shadow-gold"      // Sombra dorada especial

// Clases de transición
"transition-smooth" // Transición suave estándar
```

---

## 🔧 Patrones de Código

### 1. Páginas (Pages)

**Las páginas SOLO deben**:
- Importar y componer componentes
- Manejar routing
- Gestionar estado de página (si es necesario)

**Las páginas NO deben**:
- Tener lógica de negocio compleja
- Tener JSX repetitivo
- Duplicar estructuras

**Ejemplo ideal**:
```tsx
const Actividades = () => {
  const activities = useActivities(); // Hook con lógica

  return (
    <PageLayout>
      <PageHeader
        title="Cronograma del Día"
        description="Todos los detalles de las actividades"
      />
      <ActividadesTimeline activities={activities} />
      <LocationSection />
    </PageLayout>
  );
};
```

---

### 2. Hooks Personalizados

**Extrae lógica repetida en hooks**:

```tsx
// ❌ MAL: Lógica en el componente
const Fotos = () => {
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/fotos.json")
      .then(res => res.json())
      .then(data => {
        setFotos(data);
        setLoading(false);
      });
  }, []);

  // ...
};

// ✅ BIEN: Lógica en un hook
const useFotos = () => {
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFotos()
      .then(setFotos)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { fotos, loading, error, refetch: loadFotos };
};
```

---

### 3. Formularios

**Siempre usar React Hook Form + Zod**:

```tsx
const schema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Email inválido"),
});

const MyForm = () => {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { nombre: "", email: "" },
  });

  const onSubmit = (data) => {
    // Lógica
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* FormFields de shadcn/ui */}
      </form>
    </Form>
  );
};
```

---

### 4. Tipado

**Todo debe estar tipado**:

```tsx
// ❌ MAL
const [invitado, setInvitado] = useState<any>(null);

// ✅ BIEN
const [invitado, setInvitado] = useState<Invitado | null>(null);
```

**Define tipos en `src/types/`**:
```tsx
// src/types/invitados.ts
export interface Invitado {
  id: string;
  nombre: string;
  email: string;
  token: string;
  asistencia: "confirmado" | "rechazado" | "pendiente";
  acompanantes: number;
}
```

---

## 🚀 Flujo de Trabajo

### Cuando el usuario pide algo nuevo:

1. **Analiza** si ya existe algo similar
2. **Decide** si reutilizar, extender o crear nuevo
3. **Implementa** siguiendo los patrones de esta guía
4. **Documenta** cambios importantes
5. **Responde** con:
   - Resumen de lo hecho
   - Lista de archivos tocados
   - Código relevante
   - Notas de uso

---

## 🎯 Filosofía del Proyecto

1. **Pocas piezas claras** > Muchas piezas específicas
2. **Reutilizable por defecto**: Piensa siempre en el próximo uso
3. **Consistencia absoluta**: Mismos espaciados, colores, animaciones
4. **Tipado estricto**: TypeScript al 100%
5. **Componentes pequeños**: Una responsabilidad por componente
6. **Documentación viva**: Este documento debe evolucionar con el proyecto

---

## 📚 Checklist de Calidad

Antes de considerar una tarea terminada:

- [ ] ¿Es reutilizable?
- [ ] ¿Está tipado completamente?
- [ ] ¿Sigue las convenciones de naming?
- [ ] ¿Usa los componentes base cuando corresponde?
- [ ] ¿Tiene animaciones consistentes?
- [ ] ¿Respeta el sistema de diseño?
- [ ] ¿No duplica código existente?
- [ ] ¿Es mantenible y legible?

---

## 🆘 Preguntas Frecuentes

**P: ¿Puedo crear un componente nuevo?**
R: Sí, si no existe uno similar Y será reutilizable en al menos 2 lugares.

**P: ¿Puedo modificar un componente de shadcn/ui?**
R: Sí, los componentes en `components/ui/` son tuyos. Pero hazlo de forma genérica.

**P: ¿Dónde pongo lógica compleja?**
R: En hooks personalizados (`src/hooks/`) o servicios (`src/lib/`).

**P: ¿Cómo sé si algo es "común" o "feature"?**
R: Común = usado en 3+ features. Feature = específico de una funcionalidad.

---

**Última actualización**: 15 de Noviembre, 2025
**Mantenido por**: El equipo de desarrollo

