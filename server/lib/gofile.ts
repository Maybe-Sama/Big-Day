import FormData from 'form-data';
import fetch from 'node-fetch';
import type { Express } from 'express';

// Cargar variables de entorno (si usas dotenv)
// Si no usas dotenv, asegúrate de cargar las variables de entorno de otra forma
if (typeof process.env.GOFILE_API_TOKEN === 'undefined') {
  console.warn('⚠️  GOFILE_API_TOKEN no está definido. Asegúrate de tener un archivo .env');
}

/**
 * Valida que las variables de entorno necesarias estén configuradas
 * @throws Error si faltan variables de entorno
 */
export function validateEnv(): void {
  const token = process.env.GOFILE_API_TOKEN;
  const folderId = process.env.GOFILE_FOLDER_ID;

  if (!token || token.trim() === '') {
    throw new Error(
      'GOFILE_API_TOKEN no está configurado. Por favor, añádelo a tu archivo .env'
    );
  }

  if (!folderId || folderId.trim() === '') {
    throw new Error(
      'GOFILE_FOLDER_ID no está configurado. Por favor, añádelo a tu archivo .env'
    );
  }
}

/**
 * Interfaz para la respuesta de GoFile al subir un archivo
 */
interface GoFileUploadResponse {
  status: 'ok' | 'error';
  data?: {
    downloadPage: string;
    code: string;
    parentFolder: string;
    fileId: string;
    fileName: string;
    md5: string;
  };
  error?: string;
}

/**
 * Interfaz para la respuesta de GoFile al actualizar un contenido
 */
interface GoFileUpdateResponse {
  status: 'ok' | 'error';
  data?: {
    id: string;
    name: string;
  };
  error?: string;
}

/**
 * Sube un archivo a GoFile
 * 
 * @param file - Archivo a subir (desde multer)
 * @param nombreInvitado - Nombre del invitado para renombrar el archivo
 * @returns Resultado de la subida con información del archivo
 * @throws Error si la subida falla
 */
export async function uploadToGofile(
  file: Express.Multer.File,
  nombreInvitado: string
): Promise<{
  success: true;
  fileName: string;
  goFileId: string;
  downloadPage: string;
  code: string;
}> {
  const token = process.env.GOFILE_API_TOKEN!;
  const folderId = process.env.GOFILE_FOLDER_ID!;

  // Crear FormData para la subida
  const formData = new FormData();
  formData.append('file', file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });
  formData.append('folderId', folderId);

  // Subir el archivo a GoFile
  const uploadResponse = await fetch('https://upload.gofile.io/uploadfile', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      ...formData.getHeaders(),
    },
    body: formData,
  });

  if (!uploadResponse.ok) {
    // Manejar rate limiting
    if (uploadResponse.status === 429) {
      throw new Error('Rate limit excedido. Por favor, espera unos minutos.');
    }

    const errorText = await uploadResponse.text();
    throw new Error(
      `Error al subir archivo: ${uploadResponse.status} - ${errorText}`
    );
  }

  const uploadResult = (await uploadResponse.json()) as GoFileUploadResponse;

  if (uploadResult.status !== 'ok' || !uploadResult.data) {
    throw new Error(
      uploadResult.error || 'Error desconocido al subir el archivo'
    );
  }

  const { fileId, fileName, downloadPage, code } = uploadResult.data;

  // Opcional: Renombrar el archivo con el nombre del invitado
  // Formato: "NOMBRE_INVITADO - nombreOriginal.ext"
  try {
    const newFileName = `${nombreInvitado.trim()} - ${fileName}`;
    
    const updateResponse = await fetch(
      `https://api.gofile.io/contents/${fileId}/update`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attribute: 'name',
          attributeValue: newFileName,
        }),
      }
    );

    if (updateResponse.ok) {
      const updateResult =
        (await updateResponse.json()) as GoFileUpdateResponse;
      if (updateResult.status === 'ok') {
        console.log(`✅ Archivo renombrado: ${newFileName}`);
      }
    } else {
      // Si falla el renombrado, no es crítico, solo logueamos
      console.warn(
        `⚠️ No se pudo renombrar el archivo ${fileName}, pero la subida fue exitosa`
      );
    }
  } catch (renameError) {
    // Si falla el renombrado, no es crítico, solo logueamos
    console.warn(
      `⚠️ Error al renombrar archivo ${fileName}:`,
      renameError
    );
  }

  return {
    success: true,
    fileName: uploadResult.data.fileName,
    goFileId: fileId,
    downloadPage,
    code,
  };
}

