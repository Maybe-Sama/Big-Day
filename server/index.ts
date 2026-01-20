import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { Redis } from '@upstash/redis';
import { uploadToGofile, validateEnv } from './lib/gofile.js';

// Cargar variables de entorno desde .env
dotenv.config();

// Configurar Redis para desarrollo local
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const ADMIN_KEY = process.env.ADMIN_KEY;
const SESSION_TTL = 24 * 60 * 60; // 24 horas en segundos
const SESSION_KEY_PREFIX = 'admin:session:';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Validar variables de entorno al arrancar
try {
  validateEnv();
  console.log('✅ Variables de entorno validadas correctamente');
} catch (error) {
  console.error('❌ Error validando variables de entorno:', error);
  process.exit(1);
}

// Configurar multer para manejar archivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB por archivo
  },
});

/**
 * Endpoint POST /api/gofile/upload-mision
 * 
 * Recibe:
 * - nombreInvitado (string, requerido)
 * - misionId (number, requerido)
 * - mesaId (string, requerido)
 * - file (File, requerido, 1 archivo)
 * 
 * Devuelve:
 * - success: boolean
 * - fotoId: string
 * - url: string
 * - message: string
 */
app.post('/api/gofile/upload-mision', upload.single('file'), async (req, res) => {
  try {
    const nombreInvitado = req.body.nombreInvitado as string;
    const misionId = req.body.misionId as string;
    const mesaId = req.body.mesaId as string;
    const file = req.file;

    // Validaciones
    if (!nombreInvitado || nombreInvitado.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'El nombre del invitado es obligatorio',
      });
    }

    if (!misionId) {
      return res.status(400).json({
        success: false,
        error: 'El ID de la misión es obligatorio',
      });
    }

    if (!mesaId) {
      return res.status(400).json({
        success: false,
        error: 'El ID de la mesa es obligatorio',
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'Debes seleccionar una foto',
      });
    }

    // Validar que el archivo sea una imagen
    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        error: 'El archivo debe ser una imagen',
      });
    }

    // Subir el archivo a GoFile con nombre personalizado
    const nombreArchivo = `Mesa-${mesaId}-Mision-${misionId}-${nombreInvitado.trim()}-${file.originalname}`;
    const resultado = await uploadToGofile(file, nombreArchivo);

    return res.status(200).json({
      success: true,
      fotoId: resultado.goFileId,
      url: resultado.downloadPage,
      fileUrl: resultado.downloadPage, // Alias para compatibilidad
      message: `Foto de la misión ${misionId} subida correctamente`,
    });
  } catch (error: any) {
    console.error('Error en /api/gofile/upload-mision:', error);

    // Manejar errores específicos de GoFile
    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Hay demasiadas subidas ahora mismo. Por favor, inténtalo de nuevo en unos minutos.',
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor. Por favor, inténtalo de nuevo más tarde.',
    });
  }
});

/**
 * Endpoint POST /api/gofile/upload
 * 
 * Recibe:
 * - nombreInvitado (string, requerido)
 * - files[] (File[], requerido, mínimo 1, máximo 50)
 * 
 * Devuelve:
 * - success: boolean
 * - message: string
 * - results: array con resultados de cada subida
 * - errors: array con errores si los hay
 */
app.post('/api/gofile/upload', upload.array('files', 50), async (req, res) => {
  try {
    const nombreInvitado = req.body.nombreInvitado as string;
    const files = req.files as Express.Multer.File[];

    // Validaciones
    if (!nombreInvitado || nombreInvitado.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'El nombre del invitado es obligatorio',
      });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Debes seleccionar al menos una foto',
      });
    }

    if (files.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Puedes subir un máximo de 50 fotos',
      });
    }

    // Validar que todos los archivos sean imágenes
    const invalidFiles = files.filter(
      (file) => !file.mimetype.startsWith('image/')
    );
    if (invalidFiles.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Todos los archivos deben ser imágenes',
      });
    }

    // Subir cada archivo a GoFile
    const uploadPromises = files.map((file) =>
      uploadToGofile(file, nombreInvitado).catch((error) => ({
        success: false,
        fileName: file.originalname,
        error: error.message,
      }))
    );

    const results = await Promise.all(uploadPromises);

    // Separar éxitos y errores
    const successes = results.filter((r) => r.success !== false);
    const errors = results.filter((r) => r.success === false);

    // Si todas las subidas fallaron
    if (successes.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Error al subir las fotos. Por favor, inténtalo de nuevo.',
        errors,
      });
    }

    // Si algunas subidas fallaron
    if (errors.length > 0) {
      return res.status(207).json({
        success: true,
        message: `Se subieron ${successes.length} foto(s) correctamente, pero ${errors.length} foto(s) fallaron.`,
        results: successes,
        errors,
      });
    }

    // Todas las subidas fueron exitosas
    return res.status(200).json({
      success: true,
      message: `¡Gracias, ${nombreInvitado}! Tus ${successes.length} foto(s) se han subido correctamente.`,
      results: successes,
    });
  } catch (error: any) {
    console.error('Error en /api/gofile/upload:', error);

    // Manejar errores específicos de GoFile
    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Hay demasiadas subidas ahora mismo. Por favor, inténtalo de nuevo en unos minutos.',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor. Por favor, inténtalo de nuevo más tarde.',
    });
  }
});

/**
 * Endpoint POST /api/admin/login - Autenticar admin y crear sesión
 */
app.post('/api/admin/login', async (req, res) => {
  // CORS headers
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Verificar que Redis esté configurado (solo si hay variables de entorno)
    const hasRedisConfig = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    if (!hasRedisConfig) {
      console.warn('[Admin Login] Advertencia: Variables de entorno de Redis no configuradas. Usando modo desarrollo sin persistencia.');
    }

    // Verificar que ADMIN_KEY esté configurada
    if (!ADMIN_KEY) {
      console.error('Error: ADMIN_KEY no configurada');
      return res.status(500).json({ error: 'Servidor no disponible' });
    }

    const { key } = req.body;

    if (!key || typeof key !== 'string') {
      return res.status(400).json({ error: 'Clave requerida' });
    }

    // Validar clave contra ADMIN_KEY
    if (key !== ADMIN_KEY) {
      console.log('[Admin Login] Intento de login fallido');
      return res.status(401).json({ error: 'No autorizado' });
    }

    // Generar token de sesión aleatorio
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionKey = `${SESSION_KEY_PREFIX}${sessionToken}`;

    // Guardar sesión en Redis con TTL (solo si Redis está configurado)
    if (hasRedisConfig) {
      try {
        await redis.setex(sessionKey, SESSION_TTL, '1');
      } catch (redisError) {
        console.error('[Admin Login] Error guardando sesión en Redis:', redisError);
        // Continuar sin Redis en desarrollo
      }
    }

    // Establecer cookie HttpOnly
    // En desarrollo local, no usar Secure (solo en HTTPS)
    const isHttps = req.headers['x-forwarded-proto'] === 'https' || 
                    process.env.NODE_ENV === 'production';
    
    const cookieOptions = [
      `admin_session=${sessionToken}`,
      'HttpOnly',
      `Path=/`,
      `SameSite=Lax`,
      `Max-Age=${SESSION_TTL}`,
    ];

    if (isHttps) {
      cookieOptions.push('Secure');
    }

    console.log('[Admin Login] Cookie configurada:', {
      secure: isHttps,
      hasToken: !!sessionToken,
      tokenLength: sessionToken.length,
    });

    res.setHeader('Set-Cookie', cookieOptions.join('; '));

    console.log('[Admin Login] Sesión creada exitosamente');
    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error('Error en API admin/login:', error);
    return res.status(500).json({ error: 'Servidor no disponible' });
  }
});

/**
 * Endpoint POST /api/admin/logout - Cerrar sesión admin
 */
app.post('/api/admin/logout', async (req, res) => {
  // CORS headers
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Obtener cookie de sesión
    const cookies = req.headers.cookie || '';
    const sessionMatch = cookies.match(/admin_session=([^;]+)/);
    
    if (sessionMatch) {
      const sessionToken = sessionMatch[1];
      const sessionKey = `${SESSION_KEY_PREFIX}${sessionToken}`;
      
      // Eliminar sesión de Redis (solo si Redis está configurado)
      const hasRedisConfig = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
      if (hasRedisConfig) {
        try {
          await redis.del(sessionKey);
          console.log('[Admin Logout] Sesión eliminada de Redis');
        } catch (redisError) {
          console.error('[Admin Logout] Error eliminando sesión de Redis:', redisError);
          // Continuar sin Redis en desarrollo
        }
      }
    }

    // Limpiar cookie (Max-Age=0)
    const isHttps = req.headers['x-forwarded-proto'] === 'https' || 
                    process.env.NODE_ENV === 'production';
    
    const cookieOptions = [
      `admin_session=`,
      'HttpOnly',
      `Path=/`,
      `SameSite=Lax`,
      'Max-Age=0',
    ];

    if (isHttps) {
      cookieOptions.push('Secure');
    }

    res.setHeader('Set-Cookie', cookieOptions.join('; '));

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error('Error en API admin/logout:', error);
    return res.status(500).json({ error: 'Servidor no disponible' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend ejecutándose en http://localhost:${PORT}`);
  console.log(`📁 Endpoint de subida: http://localhost:${PORT}/api/gofile/upload`);
  console.log(`🔐 Endpoint de admin: http://localhost:${PORT}/api/admin/login`);
});

