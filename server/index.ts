import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { uploadToGofile, validateEnv } from './lib/gofile.js';

// Cargar variables de entorno desde .env
dotenv.config();

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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend ejecutándose en http://localhost:${PORT}`);
  console.log(`📁 Endpoint de subida: http://localhost:${PORT}/api/gofile/upload`);
});

