# ⚠️ Limitación de IndexedDB

## Problema Identificado

Tu aplicación usa **IndexedDB** para almacenar los datos de invitados. IndexedDB es una base de datos **local al navegador**, lo que significa que:

- ✅ Los datos creados en tu computadora están disponibles **solo en ese navegador**
- ❌ Los datos **NO se sincronizan** entre dispositivos
- ❌ Si creas un grupo en tu computadora y abres el enlace en tu móvil, el móvil **no tendrá esos datos**

## Por qué aparece "Acceso Restringido"

Cuando abres un enlace con token en un dispositivo diferente:
1. El navegador intenta buscar el token en su IndexedDB local
2. Como el token no existe (fue creado en otro dispositivo), muestra "Acceso Restringido"
3. El mensaje viene del componente `ErrorState` en `RSVP.tsx`

## Soluciones

### Solución Temporal (Para Pruebas)

**Opción 1: Usar el mismo dispositivo**
- Crea los grupos desde tu computadora
- Abre los enlaces **en la misma computadora** (mismo navegador)
- Los datos estarán disponibles

**Opción 2: Exportar/Importar datos**
- Implementar funcionalidad de exportar datos desde el panel de admin
- Importar los datos en el móvil antes de abrir los enlaces
- ⚠️ Esto requiere desarrollo adicional

### Solución Permanente (Recomendada)

**Migrar a una base de datos compartida:**

1. **Backend con base de datos** (PostgreSQL, MongoDB, etc.)
   - Almacenar todos los grupos de invitados en el servidor
   - Los tokens funcionarán desde cualquier dispositivo
   - Requiere hosting del backend (Vercel Serverless, Railway, etc.)

2. **Servicios en la nube** (Firebase, Supabase)
   - Base de datos en tiempo real
   - Sincronización automática
   - Más fácil de implementar

## Configuración Actual

He mejorado la generación de enlaces para usar una variable de entorno `VITE_PUBLIC_URL`:

1. **Añade en Vercel** (Settings → Environment Variables):
   ```
   VITE_PUBLIC_URL=https://tu-dominio.vercel.app
   ```
   (Reemplaza con tu dominio real de Vercel)

2. **Re-despliega** el proyecto

Esto asegura que los enlaces se generen con el dominio correcto de producción.

## Próximos Pasos

Para una solución completa, considera:
1. Implementar un backend API para CRUD de invitados
2. Migrar de IndexedDB a base de datos del servidor
3. Mantener IndexedDB solo como caché local (opcional)

¿Quieres que te ayude a implementar una solución con backend?

