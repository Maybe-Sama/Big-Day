import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const CARRERAS_KEY = 'invitados:carreras';

// GET/POST /api/carreras - Obtener o guardar carreras de fotos
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Obtener todas las carreras
    if (req.method === 'GET') {
      const carreras = await redis.get<unknown[]>(CARRERAS_KEY) || [];
      return res.status(200).json(carreras);
    }

    // POST - Guardar carreras
    if (req.method === 'POST') {
      const carreras = req.body;
      await redis.set(CARRERAS_KEY, carreras);
      return res.status(200).json({ success: true, carreras });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error: any) {
    console.error('Error en API carreras:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}

