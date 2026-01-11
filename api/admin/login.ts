import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const ADMIN_KEY = process.env.ADMIN_KEY;
const SESSION_TTL = 24 * 60 * 60; // 24 horas en segundos
const SESSION_KEY_PREFIX = 'admin:session:';

// POST /api/admin/login - Autenticar admin y crear sesión
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
    // Verificar que Redis esté configurado
    if (!process.env.KV_REST_API_URL && !process.env.UPSTASH_REDIS_REDIS_URL) {
      console.error('Error: Variables de entorno de Redis no configuradas');
      return res.status(500).json({ error: 'Servidor no disponible' });
    }

    // Verificar que ADMIN_KEY esté configurada
    if (!ADMIN_KEY) {
      console.error('Error: ADMIN_KEY no configurada');
      return res.status(500).json({ error: 'Servidor no disponible' });
    }

    const { key } = req.body;

    if (!key || typeof key !== 'string') {
      return res.status(400).json({ error: 'Clave requerida' });
    }

    // Validar clave contra ADMIN_KEY
    if (key !== ADMIN_KEY) {
      console.log('[Admin Login] Intento de login fallido');
      return res.status(401).json({ error: 'No autorizado' });
    }

    // Generar token de sesión aleatorio
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionKey = `${SESSION_KEY_PREFIX}${sessionToken}`;

    // Guardar sesión en Redis con TTL
    await redis.setex(sessionKey, SESSION_TTL, '1');

    // Establecer cookie HttpOnly
    // Detectar HTTPS: en Vercel usar x-forwarded-proto, en local usar NODE_ENV
    const isHttps = req.headers['x-forwarded-proto'] === 'https' || 
                    process.env.NODE_ENV === 'production' ||
                    req.headers['x-forwarded-proto'] === 'https';
    
    const cookieOptions = [
      `admin_session=${sessionToken}`,
      'HttpOnly',
      `Path=/`,
      `SameSite=Lax`,
      `Max-Age=${SESSION_TTL}`,
    ];

    if (isHttps) {
      cookieOptions.push('Secure');
    }

    console.log('[Admin Login] Cookie configurada:', {
      secure: isHttps,
      hasToken: !!sessionToken,
      tokenLength: sessionToken.length,
    });

    res.setHeader('Set-Cookie', cookieOptions.join('; '));

    console.log('[Admin Login] Sesión creada exitosamente');
    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error('Error en API admin/login:', error);
    return res.status(500).json({ error: 'Servidor no disponible' });
  }
}

