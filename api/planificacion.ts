import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { validateAdminSession } from '../serverlib/auth.js';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const TAREAS_KEY = 'planificacion:tareas';
const PRESUPUESTO_KEY = 'planificacion:presupuesto';
const DONATIVOS_KEY = 'planificacion:donativos';

function setCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  const allowedOrigins = new Set<string>([
    process.env.VITE_SITE_URL || '',
    process.env.SITE_URL || '',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
    'http://localhost:3210',
    'http://localhost:3333',
  ].filter(Boolean));

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // All actions require admin session
  const isValid = await validateAdminSession(req);
  if (!isValid) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const action = req.query.action as string;

  try {
    switch (action) {
      case 'get-tareas': {
        const tareas = await redis.get(TAREAS_KEY);
        return res.status(200).json({ tareas: tareas || [] });
      }

      case 'save-tareas': {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        await redis.set(TAREAS_KEY, JSON.stringify(body.tareas || []));
        return res.status(200).json({ ok: true });
      }

      case 'get-presupuesto': {
        const categorias = await redis.get(PRESUPUESTO_KEY);
        return res.status(200).json({ categorias: categorias || [] });
      }

      case 'save-presupuesto': {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        await redis.set(PRESUPUESTO_KEY, JSON.stringify(body.categorias || []));
        return res.status(200).json({ ok: true });
      }

      case 'get-donativos': {
        const donativos = await redis.get(DONATIVOS_KEY);
        return res.status(200).json({ donativos: donativos || [] });
      }

      case 'save-donativos': {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        await redis.set(DONATIVOS_KEY, JSON.stringify(body.donativos || []));
        return res.status(200).json({ ok: true });
      }

      default:
        return res.status(400).json({ error: `Acción desconocida: ${action}` });
    }
  } catch (error: any) {
    console.error('[Planificacion] Error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
