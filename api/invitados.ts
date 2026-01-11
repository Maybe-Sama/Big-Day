import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const DB_KEY = 'invitados:grupos';
const CONFIG_BUSES_KEY = 'invitados:config:buses';
const CONFIG_MESAS_KEY = 'invitados:config:mesas';
const CARRERAS_KEY = 'invitados:carreras';

// GET /api/invitados - Obtener todos los grupos
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Obtener todos los grupos
    if (req.method === 'GET') {
      const grupos = await redis.get<unknown[]>(DB_KEY) || [];
      return res.status(200).json(grupos);
    }

    // POST - Crear o actualizar un grupo
    if (req.method === 'POST') {
      const grupo = req.body;
      
      if (!grupo || !grupo.id) {
        return res.status(400).json({ error: 'Grupo inválido: falta el ID' });
      }

      const grupos = await redis.get<unknown[]>(DB_KEY) || [];
      const index = grupos.findIndex((g: any) => g.id === grupo.id);
      
      if (index >= 0) {
        grupos[index] = grupo;
      } else {
        grupos.push(grupo);
      }

      await redis.set(DB_KEY, grupos);
      return res.status(200).json({ success: true, grupo });
    }

    // PUT - Actualizar un grupo específico
    if (req.method === 'PUT') {
      const grupo = req.body;
      
      if (!grupo || !grupo.id) {
        return res.status(400).json({ error: 'Grupo inválido: falta el ID' });
      }

      const grupos = await redis.get<unknown[]>(DB_KEY) || [];
      const index = grupos.findIndex((g: any) => g.id === grupo.id);
      
      if (index < 0) {
        return res.status(404).json({ error: 'Grupo no encontrado' });
      }

      grupos[index] = grupo;
      await redis.set(DB_KEY, grupos);
      return res.status(200).json({ success: true, grupo });
    }

    // DELETE - Eliminar un grupo
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'ID requerido' });
      }

      const grupos = await redis.get<unknown[]>(DB_KEY) || [];
      const filtered = grupos.filter((g: any) => g.id !== id);
      await kv.set(DB_KEY, filtered);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error: any) {
    console.error('Error en API invitados:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}

