import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const DB_KEY = 'invitados:grupos';

// GET /api/debug - Ver todos los datos en Redis (solo para debugging)
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Verificar que Redis esté configurado
    const hasUrl = !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL);
    const hasToken = !!(process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN);

    const grupos = await redis.get<unknown[]>(DB_KEY) || [];

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
          token: g.token,
          email: g.invitadoPrincipal?.email,
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


