import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { validateAdminSession } from '../../lib/auth.js';
import {
  CARRERAS_KEY,
  CONFIG_BUSES_KEY,
  CONFIG_MESAS_KEY,
  LEGACY_GRUPOS_KEY,
  listGrupos,
} from '../../lib/storage.js';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const STORAGE_MODE = (process.env.STORAGE_MODE || 'legacy').toLowerCase() as 'legacy' | 'entity';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function backupFilename(now: Date) {
  const yyyy = now.getFullYear();
  const mm = pad2(now.getMonth() + 1);
  const dd = pad2(now.getDate());
  const hh = pad2(now.getHours());
  const min = pad2(now.getMinutes());
  // Formato legible sugerido: big-day-backup-2026-01-24-2030.json (YYYY-MM-DD-HHmm)
  return `big-day-backup-${yyyy}-${mm}-${dd}-${hh}${min}.json`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const isAuthorized = await validateAdminSession(req);
    if (!isAuthorized) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(401).json({ error: 'No autorizado' });
    }

    if (!process.env.KV_REST_API_URL && !process.env.UPSTASH_REDIS_REST_URL) {
      console.error('Error: Variables de entorno de Redis no configuradas');
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ error: 'Servidor no disponible' });
    }

    const [mesasRaw, busesRaw, carrerasRaw] = await Promise.all([
      redis.get<unknown>(CONFIG_MESAS_KEY),
      redis.get<unknown>(CONFIG_BUSES_KEY),
      redis.get<unknown[]>(CARRERAS_KEY),
    ]);

    const grupos =
      STORAGE_MODE === 'entity'
        ? await listGrupos()
        : (await redis.get<unknown[]>(LEGACY_GRUPOS_KEY)) || [];
    const mesas = mesasRaw ?? null;
    const buses = busesRaw ?? null;
    const carreras = carrerasRaw || [];

    const exportedAt = new Date();
    const payload = {
      meta: {
        version: 1 as const,
        exportedAt: exportedAt.toISOString(),
        counts: {
          grupos: grupos.length,
        },
        storageMode: STORAGE_MODE,
      },
      data: {
        grupos,
        config: { mesas, buses, carreras },
      },
    };

    const filename = backupFilename(exportedAt);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(JSON.stringify(payload, null, 2));
  } catch (error) {
    console.error('Error en API admin/backup/export:', error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'Servidor no disponible' });
  }
}

