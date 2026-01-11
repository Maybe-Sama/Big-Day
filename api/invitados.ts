import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { validateAdminSession } from './lib/auth';

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
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Verificar que Redis esté configurado
    if (!process.env.KV_REST_API_URL && !process.env.UPSTASH_REDIS_REST_URL) {
      console.error('Error: Variables de entorno de Redis no configuradas');
      return res.status(500).json({ error: 'Servidor no disponible' });
    }

    // GET - Obtener todos los grupos o buscar por token
    if (req.method === 'GET') {
      const { token } = req.query;
      
      // Si hay token en query, buscar grupo específico (PÚBLICO - no requiere admin key)
      if (token && typeof token === 'string') {
        // Normalizar token: trim y lowercase
        const normalizedToken = token.trim().toLowerCase();
        console.log(`[API] GET /invitados?token=${normalizedToken} (público)`);
        
        const grupos = await redis.get<unknown[]>(DB_KEY) || [];
        // Buscar por token normalizado
        const grupo = grupos.find((g: any) => {
          const grupoToken = (g.token || '').trim().toLowerCase();
          return grupoToken === normalizedToken;
        });
        
        if (!grupo) {
          console.log(`[API] Token no encontrado: ${normalizedToken}`);
          return res.status(404).json({ error: 'Token no encontrado' });
        }
        
        console.log(`[API] Grupo encontrado: ${(grupo as any).invitadoPrincipal?.nombre}`);
        return res.status(200).json(grupo);
      }
      
      // Sin token: devolver todos los grupos (PRIVADO - requiere sesión admin)
      const isAuthorized = await validateAdminSession(req);
      if (!isAuthorized) {
        console.log('[API] GET /invitados sin token: acceso no autorizado');
        return res.status(401).json({ error: 'No autorizado' });
      }
      
      const grupos = await redis.get<unknown[]>(DB_KEY) || [];
      console.log(`[API] GET /invitados: ${grupos.length} grupos encontrados (admin)`);
      return res.status(200).json(grupos);
    }

    // POST - Crear o actualizar un grupo (PRIVADO - requiere sesión admin)
    if (req.method === 'POST') {
      const isAuthorized = await validateAdminSession(req);
      if (!isAuthorized) {
        console.log('[API] POST /invitados: acceso no autorizado');
        return res.status(401).json({ error: 'No autorizado' });
      }

      const grupo = req.body;
      
      if (!grupo || !grupo.id) {
        return res.status(400).json({ error: 'Grupo inválido: falta el ID' });
      }

      console.log(`[API] POST /invitados: Guardando grupo ${grupo.id} con token ${grupo.token}`);
      
      const grupos = await redis.get<unknown[]>(DB_KEY) || [];
      const index = grupos.findIndex((g: any) => g.id === grupo.id);
      
      if (index >= 0) {
        grupos[index] = grupo;
        console.log(`[API] Grupo actualizado: ${grupo.id}`);
      } else {
        grupos.push(grupo);
        console.log(`[API] Grupo nuevo añadido: ${grupo.id}`);
      }

      await redis.set(DB_KEY, grupos);
      console.log(`[API] Total grupos guardados: ${grupos.length}`);
      return res.status(200).json({ success: true, grupo });
    }

    // PUT - Actualizar un grupo específico (PRIVADO - requiere sesión admin)
    if (req.method === 'PUT') {
      const isAuthorized = await validateAdminSession(req);
      if (!isAuthorized) {
        console.log('[API] PUT /invitados: acceso no autorizado');
        return res.status(401).json({ error: 'No autorizado' });
      }

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

    // DELETE - Eliminar un grupo (PRIVADO - requiere sesión admin)
    if (req.method === 'DELETE') {
      const isAuthorized = await validateAdminSession(req);
      if (!isAuthorized) {
        console.log('[API] DELETE /invitados: acceso no autorizado');
        return res.status(401).json({ error: 'No autorizado' });
      }

      const { id } = req.query;
      
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'ID requerido' });
      }

      const grupos = await redis.get<unknown[]>(DB_KEY) || [];
      const filtered = grupos.filter((g: any) => g.id !== id);
      await redis.set(DB_KEY, filtered);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error: any) {
    console.error('Error en API invitados:', error);
    return res.status(500).json({ error: 'Servidor no disponible' });
  }
}

