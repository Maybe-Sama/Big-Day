# 📸 Configuración de Subida de Fotos con GoFile

Esta guía te ayudará a configurar el sistema de subida de fotos usando la API de GoFile.

## 🔧 Configuración Inicial

### 1. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# GoFile API Configuration
GOFILE_API_TOKEN=tu_token_de_gofile_aqui
GOFILE_FOLDER_ID=tu_id_de_carpeta_aqui

# Puerto del servidor backend (opcional, por defecto 3001)
PORT=3001
```

### 2. Obtener el Token de API de GoFile

1. Ve a [https://gofile.io](https://gofile.io) y crea una cuenta o inicia sesión
2. Ve a tu perfil (Profile) y busca la sección "API Token"
3. Genera o copia tu token de API
4. Pega el token en `.env` como valor de `GOFILE_API_TOKEN`

### 3. Obtener el ID de la Carpeta

1. Crea una carpeta en GoFile donde quieras guardar las fotos de la boda
2. Abre la carpeta y copia el ID de la URL
   - Ejemplo: Si la URL es `https://gofile.io/d/ABC123`, el ID es `ABC123`
   - El ID es la parte después de `/d/`
3. Pega el ID en `.env` como valor de `GOFILE_FOLDER_ID`

## 🚀 Ejecutar el Proyecto

### Desarrollo

Para ejecutar tanto el frontend como el backend en desarrollo:

```bash
npm run dev:all
```

Esto iniciará:
- **Frontend (Vite)**: `http://localhost:3000`
- **Backend (Express)**: `http://localhost:3001`

### Solo Frontend

```bash
npm run dev
```

### Solo Backend

```bash
npm run dev:server
```

## 📦 Instalación de Dependencias

Si es la primera vez que ejecutas el proyecto o has añadido nuevas dependencias:

```bash
npm install
```

## 🔒 Seguridad

**IMPORTANTE**: 
- El archivo `.env` está en `.gitignore` y no se subirá al repositorio
- **NUNCA** compartas tu token de API de GoFile
- **NUNCA** expongas el token en el código del frontend
- Todas las llamadas a GoFile se hacen desde el backend (servidor Express)

## 🧪 Probar la Subida

1. Asegúrate de que el servidor backend esté corriendo
2. Ve a la página `/fotos` en tu aplicación
3. Escribe tu nombre
4. Selecciona una o varias fotos (máximo 50)
5. Haz clic en "Subir fotos"
6. Verifica que las fotos aparezcan en tu carpeta de GoFile

## 🐛 Solución de Problemas

### Error: "GOFILE_API_TOKEN no está configurado"

- Verifica que el archivo `.env` existe en la raíz del proyecto
- Verifica que `GOFILE_API_TOKEN` está definido en `.env`
- Reinicia el servidor backend después de cambiar `.env`

### Error: "GOFILE_FOLDER_ID no está configurado"

- Verifica que `GOFILE_FOLDER_ID` está definido en `.env`
- Asegúrate de que el ID de la carpeta es correcto (debe ser el ID después de `/d/` en la URL)

### Error: "Rate limit excedido"

- GoFile tiene límites de rate limiting
- Espera unos minutos antes de intentar subir más fotos
- El sistema mostrará un mensaje amigable al usuario

### El servidor backend no inicia

- Verifica que el puerto 3001 no está en uso
- Cambia el puerto en `.env` si es necesario: `PORT=3002`
- Actualiza el proxy en `vite.config.ts` si cambias el puerto

## 📝 Notas Técnicas

- Las fotos se renombran automáticamente con el formato: `NOMBRE_INVITADO - nombreOriginal.ext`
- El tamaño máximo por archivo es 100MB (configurable en `server/index.ts`)
- El máximo de fotos por subida es 50 (configurable en el frontend y backend)
- Todas las subidas se validan en el backend antes de enviarse a GoFile

