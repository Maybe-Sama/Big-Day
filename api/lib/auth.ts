import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const SESSION_KEY_PREFIX = 'admin:session:';

/**
 * Valida la sesión admin desde cookie HttpOnly
 * La sesión se crea en /api/admin/login y se almacena en Redis
 */
export async function validateAdminSession(req: { headers?: any }): Promise<boolean> {
  try {
    // Obtener cookie de sesión
    const cookies = req.headers?.cookie || '';
    const sessionMatch = cookies.match(/admin_session=([^;]+)/);
    
    if (!sessionMatch) {
      return false;
    }

    const sessionToken = sessionMatch[1];
    const sessionKey = `${SESSION_KEY_PREFIX}${sessionToken}`;

    // Verificar que la sesión existe en Redis
    const sessionExists = await redis.get(sessionKey);
    
    if (sessionExists) {
      // Opcional: extender TTL de la sesión (refresh)
      await redis.expire(sessionKey, 24 * 60 * 60); // 24 horas
      return true;
    }

    return false;
  } catch (error) {
    console.error('[Auth] Error validando sesión:', error);
    return false;
  }
}

