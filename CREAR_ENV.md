# 🚀 Guía Rápida: Crear archivo .env

## Paso 1: Crear el archivo .env

Crea un archivo llamado `.env` en la **raíz del proyecto** (mismo nivel que `package.json`).

## Paso 2: Añadir el contenido

Copia y pega esto en el archivo `.env`:

```env
# GoFile API Configuration
GOFILE_API_TOKEN=tu_token_de_gofile_aqui
GOFILE_FOLDER_ID=tu_id_de_carpeta_aqui

# Puerto del servidor backend (opcional, por defecto 3001)
PORT=3001
```

## Paso 3: Obtener tu Token de API de GoFile

1. Ve a https://gofile.io
2. Inicia sesión o crea una cuenta
3. Ve a tu **perfil** (Profile)
4. Busca la sección **"API Token"** o **"API"**
5. Si no tienes token, haz clic en **"Generate"** o **"Crear token"**
6. **Copia el token** (es una cadena larga de caracteres)
7. Reemplaza `tu_token_de_gofile_aqui` en el archivo `.env` con tu token real

**Ejemplo:**
```env
GOFILE_API_TOKEN=abc123xyz789def456ghi012jkl345mno678pqr901stu234vwx567
```

## Paso 4: Obtener el ID de la Carpeta

1. En GoFile, **crea una carpeta** donde quieras guardar las fotos de la boda
   - Puedes llamarla "Fotos Boda" o similar
2. **Abre la carpeta** (haz clic en ella)
3. Mira la **URL en tu navegador**
   - Debería verse algo como: `https://gofile.io/d/ABC123XYZ`
4. **Copia el ID** que está después de `/d/`
   - En el ejemplo anterior, el ID sería: `ABC123XYZ`
5. Reemplaza `tu_id_de_carpeta_aqui` en el archivo `.env` con el ID real

**Ejemplo:**
```env
GOFILE_FOLDER_ID=ABC123XYZ
```

## Paso 5: Guardar y reiniciar

1. **Guarda el archivo `.env`**
2. Si el servidor backend está corriendo, **detenlo** (Ctrl+C)
3. **Vuelve a iniciarlo:**
   ```bash
   npm run dev:server
   ```
   O si usas el comando para ambos:
   ```bash
   npm run dev:all
   ```

## ✅ Verificación

Si todo está bien, deberías ver:
```
✅ Variables de entorno validadas correctamente
🚀 Servidor backend ejecutándose en http://localhost:3001
```

## ❌ Si aún ves el error

1. Verifica que el archivo se llama exactamente `.env` (con el punto al inicio)
2. Verifica que está en la **raíz del proyecto** (mismo nivel que `package.json`)
3. Verifica que no hay espacios extra alrededor del `=`
4. Verifica que el token y el ID están correctos (sin comillas)
5. Reinicia el servidor después de hacer cambios

## 📝 Ejemplo completo de .env

```env
# GoFile API Configuration
GOFILE_API_TOKEN=abc123xyz789def456ghi012jkl345mno678pqr901stu234vwx567
GOFILE_FOLDER_ID=ABC123XYZ

# Puerto del servidor backend (opcional, por defecto 3001)
PORT=3001
```

**⚠️ IMPORTANTE:** 
- El archivo `.env` NO debe subirse a Git (ya está en `.gitignore`)
- **NUNCA** compartas tu token de API
- **NUNCA** expongas el token en el código

