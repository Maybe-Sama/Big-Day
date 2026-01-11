import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const CONFIG_MESAS_KEY = 'invitados:config:mesas';

// GET/POST /api/config/mesas - Obtener o guardar configuración de mesas
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Obtener configuración
    if (req.method === 'GET') {
      const config = await redis.get(CONFIG_MESAS_KEY);
      return res.status(200).json(config || null);
    }

    // POST - Guardar configuración
    if (req.method === 'POST') {
      const config = req.body;
      await redis.set(CONFIG_MESAS_KEY, config);
      return res.status(200).json({ success: true, config });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error: any) {
    console.error('Error en API config/mesas:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}

