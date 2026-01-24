import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { validateAdminSession } from './lib/auth.js';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const CARRERAS_KEY = 'invitados:carreras';

// GET/POST /api/carreras - Obtener o guardar carreras de fotos
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  const allowedOrigins = new Set<string>([
    process.env.VITE_SITE_URL || '',
    process.env.SITE_URL || '',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
    'http://localhost:3210',
    'http://localhost:3001',
  ].filter(Boolean));

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Obtener todas las carreras
    if (req.method === 'GET') {
      const carreras = await redis.get<unknown[]>(CARRERAS_KEY) || [];
      return res.status(200).json(carreras);
    }

    // POST - Guardar carreras (PRIVADO - requiere sesión admin)
    if (req.method === 'POST') {
      const isAuthorized = await validateAdminSession(req);
      if (!isAuthorized) {
        return res.status(401).json({ error: 'No autorizado' });
      }

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

