import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { validateAdminSession } from './lib/auth.js';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const DB_KEY = 'invitados:grupos';

// GET /api/debug - Ver todos los datos en Redis (solo para debugging)
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // En producción, este endpoint NO debe existir (anti-exfil).
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).end();
  }

  // CORS (solo origins permitidos, con credentials porque usamos cookie HttpOnly)
  const origin = req.headers.origin;
  const allowedOrigins = new Set<string>([
    process.env.VITE_SITE_URL || '',
    process.env.SITE_URL || '',
    // Preview/prod en Vercel
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
    // Dev local común
    'http://localhost:3210',
    'http://localhost:3001',
  ].filter(Boolean));

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // En dev: exigir sesión admin (evita exposición accidental en entornos no-prod).
    const isAuthorized = await validateAdminSession(req);
    if (!isAuthorized) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    // Verificar que Redis esté configurado
    const hasUrl = !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL);
    const hasToken = !!(process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN);

    const grupos = await redis.get<unknown[]>(DB_KEY) || [];

    const maskToken = (token?: string) => {
      const t = String(token || '');
      if (t.length <= 8) return 'tok_****';
      return `${t.slice(0, 4)}****${t.slice(-4)}`;
    };

    const maskEmail = (email?: string) => {
      const e = String(email || '');
      const at = e.indexOf('@');
      if (at <= 1) return 'a***@redacted';
      return `${e[0]}***${e.slice(at)}`;
    };

    return res.status(200).json({
      config: {
        hasRedisUrl: hasUrl,
        hasRedisToken: hasToken,
        redisConfigured: hasUrl && hasToken,
      },
      data: {
        totalGrupos: grupos.length,
        grupos: grupos.map((g: any) => ({
          id: g.id,
          nombre: g.invitadoPrincipal?.nombre,
          apellidos: g.invitadoPrincipal?.apellidos,
          token: maskToken(g.token),
          email: maskEmail(g.invitadoPrincipal?.email),
        })),
      },
    });
  } catch (error: any) {
    console.error('Error en API debug:', error);
    return res.status(500).json({ 
      error: error.message || 'Error interno del servidor',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}


