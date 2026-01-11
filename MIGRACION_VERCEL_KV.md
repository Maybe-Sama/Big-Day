# 🚀 Migración a Vercel KV - Resumen

## ✅ Lo que se ha implementado

He creado una solución completa para migrar de IndexedDB (local) a Vercel KV (persistente en la nube):

### 1. API Endpoints (Vercel Serverless Functions)
- ✅ `api/invitados.ts` - CRUD de grupos de invitados
- ✅ `api/invitados/[token].ts` - Obtener grupo por token
- ✅ `api/config/buses.ts` - Configuración de buses
- ✅ `api/config/mesas.ts` - Configuración de mesas
- ✅ `api/carreras.ts` - Carreras de fotos

### 2. Servicio API (`src/lib/api-service.ts`)
- Cliente para comunicarse con los endpoints
- Manejo de errores
- Tipado completo con TypeScript

### 3. DatabaseService actualizado (`src/lib/database.ts`)
- **Híbrido**: Usa API en producción, IndexedDB en desarrollo
- **Fallback automático**: Si la API falla, usa IndexedDB
- **Sin cambios en el código existente**: Todos los componentes siguen funcionando igual

## 📋 Pasos para activar

### 1. Instalar dependencias

```bash
npm install
```

Esto instalará:
- `@vercel/node` - Para Serverless Functions
- `@vercel/kv` - Para la base de datos KV

### 2. Crear base de datos KV en Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. **Storage** → **Create Database**
4. Selecciona **KV** (Redis)
5. Elige nombre: `forever-forms-kv`
6. Selecciona región
7. **Create**

### 3. Verificar variables de entorno

Vercel añade automáticamente estas variables:
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

Verifica en: **Settings** → **Environment Variables**

### 4. Re-desplegar

1. **Deployments** → **Redeploy**
2. Espera a que termine el deployment

## 🎯 Cómo funciona

### En Producción (Vercel)
- ✅ Usa **Vercel KV** (base de datos en la nube)
- ✅ Los datos están disponibles desde cualquier dispositivo
- ✅ Los enlaces funcionan en móvil, tablet, etc.

### En Desarrollo Local
- ✅ Usa **IndexedDB** (base de datos local)
- ✅ No necesitas configurar nada
- ✅ Funciona offline

## 🔄 Migración de datos existentes

Si ya tienes datos en IndexedDB:

1. Abre el panel de admin en tu computadora
2. Los datos se cargarán desde IndexedDB
3. Al guardar cualquier cambio, se guardará en Vercel KV
4. Los nuevos datos estarán disponibles en todos los dispositivos

**Nota**: Los datos antiguos en IndexedDB seguirán ahí, pero los nuevos se guardarán en KV.

## ✅ Verificación

Después de configurar:

1. **Crear un grupo** desde el panel de admin
2. **Copiar el enlace** de invitación
3. **Abrir el enlace en tu móvil**
4. ✅ Debería funcionar correctamente

## 🆘 Solución de Problemas

### Error: "Cannot find module '@vercel/kv'"
- Ejecuta `npm install` de nuevo
- Verifica que las dependencias estén en `package.json`

### Error: "KV is not defined"
- Verifica que la base de datos KV esté creada en Vercel
- Verifica que las variables de entorno estén configuradas
- Re-despliega el proyecto

### Los datos no se guardan
- Revisa los logs en Vercel (Functions → Logs)
- Verifica que la base de datos KV esté conectada al proyecto

### Los enlaces no funcionan en móvil
- Asegúrate de que el proyecto esté re-desplegado después de configurar KV
- Verifica que las API endpoints estén funcionando

## 📊 Ventajas de esta solución

- ✅ **Persistente**: Los datos no se pierden
- ✅ **Accesible**: Funciona desde cualquier dispositivo
- ✅ **Gratis**: Plan gratuito generoso de Vercel KV
- ✅ **Rápido**: Redis es muy rápido
- ✅ **Sin cambios**: El código existente sigue funcionando
- ✅ **Fallback**: Si falla la API, usa IndexedDB automáticamente

## 📝 Notas

- El sistema detecta automáticamente si está en producción o desarrollo
- En producción, usa Vercel KV
- En desarrollo, usa IndexedDB (más rápido para desarrollo local)
- Si la API falla, automáticamente hace fallback a IndexedDB

¡Listo! Tu aplicación ahora tiene una base de datos persistente que funciona desde cualquier dispositivo. 🎉

