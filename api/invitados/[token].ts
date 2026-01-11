import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const DB_KEY = 'invitados:grupos';

// GET /api/invitados/[token] - Obtener grupo por token
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
    if (!process.env.KV_REST_API_URL && !process.env.UPSTASH_REDIS_REST_URL) {
      console.error('Error: Variables de entorno de Redis no configuradas');
      return res.status(500).json({ error: 'Configuración de base de datos no encontrada' });
    }

    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token requerido' });
    }

    console.log(`[API] Buscando token: ${token}`);
    
    const grupos = await redis.get<unknown[]>(DB_KEY) || [];
    console.log(`[API] Total grupos en DB: ${grupos.length}`);
    
    const grupo = grupos.find((g: any) => g.token === token);

    if (!grupo) {
      console.log(`[API] Token no encontrado. Tokens disponibles: ${grupos.map((g: any) => g.token).join(', ')}`);
      return res.status(404).json({ error: 'Token no encontrado' });
    }

    console.log(`[API] Grupo encontrado: ${(grupo as any).invitadoPrincipal?.nombre}`);
    return res.status(200).json(grupo);
  } catch (error: any) {
    console.error('Error en API invitados/[token]:', error);
    console.error('Stack:', error.stack);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}

