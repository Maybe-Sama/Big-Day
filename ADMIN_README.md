# Panel de Administración - Sistema de Grupos de Invitados

## 🎯 Funcionalidades Implementadas

### ✅ Sistema de Grupos de Invitados
- **Invitado Principal**: Persona responsable del grupo con nombre completo y email
- **Acompañantes**: Parejas e hijos asociados al invitado principal
- **Gestión por Grupos**: Los invitados se organizan en grupos familiares/parejas

### ✅ Base de Datos IndexedDB
- **Persistencia Local**: Los datos se guardan en el navegador del usuario
- **Migración Automática**: Los datos del JSON antiguo se migran automáticamente
- **Operaciones CRUD**: Crear, leer, actualizar y eliminar grupos

### ✅ Modal de Añadir Invitados
- **Formulario Intuitivo**: Interfaz moderna para crear grupos
- **Invitado Principal**: Campos para nombre, apellidos y email
- **Acompañantes Dinámicos**: Añadir parejas e hijos con información específica
- **Validación**: Campos obligatorios y validación de formularios

### ✅ Panel de Administración Mejorado
- **Estadísticas Avanzadas**: Contadores de grupos, personas, parejas, hijos
- **Búsqueda**: Filtrado por nombre, apellidos o email
- **Vista Detallada**: Modal para ver información completa del grupo
- **Gestión de Tokens**: Generar y copiar links de invitación

## 🏗️ Estructura de Datos

### Grupo de Invitados
```typescript
interface GrupoInvitados {
  id: string;
  invitadoPrincipal: {
    nombre: string;
    apellidos: string;
    email: string;
  };
  acompanantes: Acompanante[];
  token: string;
  asistencia: 'pendiente' | 'confirmado' | 'rechazado';
  fechaCreacion: string;
  fechaActualizacion: string;
  notas?: string;
}
```

### Acompañante
```typescript
interface Acompanante {
  id: string;
  nombre: string;
  apellidos: string;
  tipo: 'pareja' | 'hijo';
  edad?: number; // Solo para hijos
}
```

## 🚀 Cómo Usar

### 0. Configuración Inicial (Primera vez)

**IMPORTANTE**: Por seguridad, la clave de administración ahora se configura mediante variables de entorno.

1. Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edita el archivo `.env` y configura tu clave secreta:
   ```
   VITE_ADMIN_KEY=tu_clave_secreta_aqui
   ```

3. Reinicia el servidor de desarrollo si está corriendo:
   ```bash
   npm run dev
   ```

**Nota de Seguridad**: El archivo `.env` está en `.gitignore` y no se subirá al repositorio. Nunca compartas tu clave de administración.

### 1. Acceder al Panel
- Ir a `/admin/oculto?key=TU_CLAVE_SECRETA` (donde `TU_CLAVE_SECRETA` es el valor configurado en `.env`)
- El panel se carga automáticamente si la clave es correcta

### 2. Añadir un Grupo
- Hacer clic en "Añadir Grupo"
- Completar información del invitado principal
- Añadir acompañantes (parejas/hijos) si es necesario
- Guardar el grupo

### 3. Gestionar Grupos
- **Ver detalles**: Clic en el ícono de ojo
- **Generar token**: Clic en el ícono de editar
- **Copiar invitación**: Clic en el ícono de copiar
- **Eliminar**: Clic en el ícono de papelera

### 4. Buscar Grupos
- Usar el campo de búsqueda en la parte superior
- Busca por nombre, apellidos o email

## 📊 Estadísticas Disponibles

- **Grupos**: Total de grupos de invitados
- **Personas**: Total de personas (invitados + acompañantes)
- **Confirmados**: Grupos que confirmaron asistencia
- **Pendientes**: Grupos sin confirmar
- **Rechazados**: Grupos que rechazaron la invitación
- **Parejas**: Total de parejas registradas
- **Asistentes**: Total de personas que asistirán

## 🔧 Migración de Datos

El sistema migra automáticamente los datos del archivo JSON de ejemplo (opcional):
- Convierte invitados individuales en grupos
- Crea acompañantes basados en los campos `pareja` y `hijos`
- Preserva tokens y estados de asistencia
- Añade notas de migración para referencia
- **Nota**: El archivo JSON mock ha sido eliminado. El sistema usa IndexedDB como base de datos principal.

## 🎨 Características de UI/UX

- **Diseño Moderno**: Interfaz limpia y profesional
- **Animaciones**: Transiciones suaves con Framer Motion
- **Responsive**: Adaptable a diferentes tamaños de pantalla
- **Accesibilidad**: Iconos descriptivos y tooltips
- **Feedback Visual**: Toasts para confirmaciones y errores

## 🔒 Seguridad

- **Acceso Protegido**: Solo con clave de administración
- **Tokens Únicos**: Cada grupo tiene un token único
- **Validación**: Campos obligatorios y validación de tipos
- **Persistencia Local**: Los datos se mantienen en el navegador

## 📱 Compatibilidad

- **Navegadores Modernos**: Chrome, Firefox, Safari, Edge
- **IndexedDB**: Base de datos local del navegador
- **Responsive Design**: Funciona en móviles y tablets
- **PWA Ready**: Preparado para funcionar como app

---

**Nota**: Este sistema reemplaza completamente la funcionalidad anterior de invitados individuales, proporcionando una gestión más organizada y familiar de los invitados a la boda.
