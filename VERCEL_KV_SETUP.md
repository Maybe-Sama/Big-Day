# 🚀 Configuración de Vercel KV para Base de Datos Persistente

## ¿Qué es Vercel KV?

Vercel KV es una base de datos Redis (key-value) que Vercel ofrece para almacenar datos persistentes. Es perfecta para tu caso porque:

- ✅ **Persistente**: Los datos se guardan en la nube, no se pierden
- ✅ **Accesible desde cualquier dispositivo**: Los datos están en el servidor, no en el navegador
- ✅ **Gratis hasta cierto límite**: Plan gratuito generoso para proyectos pequeños
- ✅ **Integrado con Vercel**: Funciona perfectamente con Serverless Functions

## 📋 Pasos de Configuración

### 1. Instalar Vercel KV en tu proyecto

Ya he añadido las dependencias necesarias en `package.json`. Ejecuta:

```bash
npm install
```

### 2. Crear una base de datos KV en Vercel

1. Ve a tu [Dashboard de Vercel](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Storage** → **Create Database**
4. Selecciona **KV** (Redis)
5. Elige un nombre para tu base de datos (ej: `forever-forms-kv`)
6. Selecciona la región más cercana
7. Haz clic en **Create**

### 3. Conectar la base de datos a tu proyecto

1. En la página de la base de datos KV, ve a **Settings**
2. En la sección **Environment Variables**, verás las variables que Vercel crea automáticamente:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

3. Estas variables se añaden automáticamente a tu proyecto. **No necesitas hacer nada más**.

### 4. Verificar que las variables estén configuradas

1. Ve a tu proyecto en Vercel
2. **Settings** → **Environment Variables**
3. Deberías ver las variables de KV listadas

### 5. Re-desplegar

Después de crear la base de datos KV, re-despliega tu proyecto:

1. Ve a **Deployments**
2. Haz clic en los tres puntos (⋯) del último deployment
3. Selecciona **Redeploy**

## ✅ Verificación

Una vez configurado, los datos se guardarán en Vercel KV y estarán disponibles desde cualquier dispositivo.

### Cómo funciona ahora:

1. **Panel de Admin** (`/admin/oculto?key=amor2025`):
   - Cuando creas un grupo, se guarda en Vercel KV
   - Los datos están en el servidor, no en tu navegador

2. **Enlaces de invitación** (`/rsvp?token=abc123`):
   - Funcionan desde cualquier dispositivo
   - El token se busca en Vercel KV
   - Los datos están disponibles globalmente

## 🔄 Migración de Datos Existentes

Si ya tienes datos en IndexedDB local, puedes migrarlos:

1. Abre el panel de admin en tu computadora
2. Los datos se cargarán desde IndexedDB
3. Al guardar cualquier cambio, se guardará en Vercel KV
4. Los nuevos datos estarán disponibles en todos los dispositivos

## 📊 Límites del Plan Gratuito

- **100,000 lecturas/día**
- **1,000 escrituras/día**
- **256 MB de almacenamiento**

Para una boda con ~200 invitados, esto es más que suficiente.

## 🆘 Solución de Problemas

### Error: "KV is not defined"

- Verifica que las variables de entorno de KV estén configuradas en Vercel
- Re-despliega el proyecto después de crear la base de datos KV

### Los datos no se guardan

- Verifica que la base de datos KV esté conectada a tu proyecto
- Revisa los logs en Vercel para ver errores

### Los enlaces no funcionan

- Asegúrate de que el proyecto esté re-desplegado después de configurar KV
- Verifica que las API endpoints estén funcionando (puedes probarlas directamente)

## 📝 Notas Importantes

- **Backup**: Vercel KV mantiene backups automáticos, pero puedes exportar datos manualmente desde el panel de admin
- **Costo**: El plan gratuito es suficiente para la mayoría de proyectos. Si necesitas más, los planes de pago son muy económicos
- **Rendimiento**: Vercel KV es muy rápido, ideal para aplicaciones web

