import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const SESSION_KEY_PREFIX = 'admin:session:';

// POST /api/admin/logout - Cerrar sesión admin
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Obtener cookie de sesión
    const cookies = req.headers.cookie || '';
    const sessionMatch = cookies.match(/admin_session=([^;]+)/);
    
    if (sessionMatch) {
      const sessionToken = sessionMatch[1];
      const sessionKey = `${SESSION_KEY_PREFIX}${sessionToken}`;
      
      // Eliminar sesión de Redis
      await redis.del(sessionKey);
      console.log('[Admin Logout] Sesión eliminada');
    }

    // Limpiar cookie (Max-Age=0)
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = [
      `admin_session=`,
      'HttpOnly',
      `Path=/`,
      `SameSite=Lax`,
      'Max-Age=0',
    ];

    if (isProduction) {
      cookieOptions.push('Secure');
    }

    res.setHeader('Set-Cookie', cookieOptions.join('; '));

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error('Error en API admin/logout:', error);
    return res.status(500).json({ error: 'Servidor no disponible' });
  }
}

