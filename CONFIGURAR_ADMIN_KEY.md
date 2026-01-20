# Configurar Clave de Administración

**Importante:** Con el nuevo sistema de autenticación por cookies, la clave se configura **solo en el backend** (nunca en el frontend).

---

## 🔧 Configuración

### Desarrollo Local

1. **Crear archivo `.env` en la raíz del proyecto:**
   ```bash
   # En la raíz del proyecto (forever-forms-site/)
   touch .env
   ```

2. **Añadir la variable `ADMIN_KEY`:**
   ```env
   ADMIN_KEY=tu_clave_secreta_aqui
   ```

   **Ejemplo:**
   ```env
   ADMIN_KEY=mi_clave_super_secreta_2024
   ```

3. **Reiniciar el servidor de desarrollo:**
   ```bash
   npm run dev:all
   # o
   npm run dev
   ```

### Producción (Vercel)

1. **Ir a tu proyecto en Vercel Dashboard:**
   - https://vercel.com/dashboard

2. **Settings → Environment Variables**

3. **Añadir variable:**
   - **Name:** `ADMIN_KEY`
   - **Value:** Tu clave secreta (la misma que usaste en desarrollo)
   - **Environment:** Production, Preview, Development (marcar todas)

4. **Redeploy:**
   - Vercel redeploya automáticamente cuando cambias variables de entorno
   - O puedes hacerlo manualmente desde el dashboard

---

## 🔑 Usar el Panel de Administración

### Antes (sistema antiguo):
```
/admin/oculto?key=tu_clave
```

### Ahora (sistema nuevo):
1. **Ir a:** `/admin/oculto`
2. **Aparece pantalla de login**
3. **Introducir la clave** que configuraste en `ADMIN_KEY`
4. **Clic "Iniciar Sesión"**
5. **La sesión dura 24 horas** (no necesitas volver a loguearte)

---

## ⚠️ Importante

- **La clave NO se expone en el código del cliente** (es más seguro)
- **La clave se valida solo en el servidor** (`api/admin/login.ts`)
- **Si olvidas la clave**, puedes cambiarla en Vercel y hacer redeploy
- **La misma clave funciona en desarrollo y producción** (si usas la misma)

---

## 🧪 Verificar que Funciona

1. **Configurar `ADMIN_KEY` en `.env`** (desarrollo) o Vercel (producción)
2. **Ir a `/admin/oculto`**
3. **Introducir la clave en el formulario de login**
4. **Si es correcta:** Se crea la sesión y puedes usar el panel
5. **Si es incorrecta:** Aparece error "No autorizado"

---

## 📝 Ejemplo de `.env`

```env
# Clave de administración (solo backend)
ADMIN_KEY=mi_clave_secreta_123

# Redis/Vercel KV (si usas)
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...

# GoFile (si usas)
GOFILE_API_KEY=...
GOFILE_FOLDER_ID=...
```

---

**Nota:** El archivo `.env` está en `.gitignore` y no se sube al repositorio. Nunca compartas tu clave de administración.


