import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { validateAdminSession } from '../serverlib/auth.js';
import { CARRERAS_KEY, CONFIG_BUSES_KEY, CONFIG_MESAS_KEY } from '../serverlib/storage.js';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

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

type Kind = 'mesas' | 'buses' | 'carreras';

function getKeyForKind(kind: Kind) {
  if (kind === 'mesas') return CONFIG_MESAS_KEY;
  if (kind === 'buses') return CONFIG_BUSES_KEY;
  return CARRERAS_KEY;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!process.env.KV_REST_API_URL && !process.env.UPSTASH_REDIS_REST_URL) {
    console.error('Error: Variables de entorno de Redis no configuradas');
    return res.status(500).json({ error: 'Servidor no disponible' });
  }

  const kind = String(req.query.kind || '').trim() as Kind;
  if (kind !== 'mesas' && kind !== 'buses' && kind !== 'carreras') {
    return res.status(400).json({ error: 'kind inválido. Usa mesas|buses|carreras' });
  }

  const key = getKeyForKind(kind);

  try {
    if (req.method === 'GET') {
      const value = await redis.get(key as any);
      if (kind === 'carreras') return res.status(200).json(value || []);

      // Defense-in-depth: normalize/validate to prevent clients crashing on legacy/corrupt KV shapes.
      if (kind === 'buses') {
        if (value == null) return res.status(200).json(null);
        if (Array.isArray(value)) {
          // Legacy: KV stored as BusConfig[]
          return res.status(200).json({
            id: 'config-buses',
            buses: value,
            fechaActualizacion: new Date().toISOString(),
          });
        }
        if (isPlainObject(value) && Array.isArray(value['buses'])) {
          return res.status(200).json({
            id: 'config-buses',
            buses: value['buses'],
            fechaActualizacion:
              typeof value['fechaActualizacion'] === 'string'
                ? value['fechaActualizacion']
                : new Date().toISOString(),
          });
        }
        return res.status(200).json(null);
      }

      if (kind === 'mesas') {
        if (value == null) return res.status(200).json(null);
        if (Array.isArray(value)) {
          // Legacy: KV stored as MesaConfig[]
          return res.status(200).json({
            id: 'config-mesas',
            mesas: value,
            fechaActualizacion: new Date().toISOString(),
          });
        }
        if (isPlainObject(value) && Array.isArray(value['mesas'])) {
          return res.status(200).json({
            id: 'config-mesas',
            mesas: value['mesas'],
            fechaActualizacion:
              typeof value['fechaActualizacion'] === 'string'
                ? value['fechaActualizacion']
                : new Date().toISOString(),
          });
        }
        return res.status(200).json(null);
      }

      return res.status(200).json(value ?? null);
    }

    if (req.method === 'POST') {
      const isAuthorized = await validateAdminSession(req);
      if (!isAuthorized) {
        return res.status(401).json({ error: 'No autorizado' });
      }
      await redis.set(key as any, req.body);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error: any) {
    console.error('Error en API config router:', error);
    return res.status(500).json({ error: error.message || 'Servidor no disponible' });
  }
}

