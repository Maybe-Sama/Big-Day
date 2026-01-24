import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { validateAdminSession } from './lib/auth.js';
import {
  GrupoInvitadosEntity,
  getGrupoById,
  getGrupoByToken as getEntityGrupoByToken,
  listGrupos as listEntityGrupos,
  upsertGrupo as upsertEntityGrupo,
  deleteGrupoById as deleteEntityGrupoById,
  readLegacyGrupos,
  writeLegacyGrupos,
} from './lib/storage.js';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const DB_KEY = 'invitados:grupos';
const CONFIG_BUSES_KEY = 'invitados:config:buses';
const CONFIG_MESAS_KEY = 'invitados:config:mesas';
const CARRERAS_KEY = 'invitados:carreras';

const STORAGE_MODE = (process.env.STORAGE_MODE || 'legacy').toLowerCase() as 'legacy' | 'entity';

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
        const normalizedToken = token.trim().toLowerCase();
        // No loguear tokens completos
        console.log(`[API] GET /invitados?token=**** (público)`);

        if (STORAGE_MODE === 'entity') {
          const grupo = await getEntityGrupoByToken(normalizedToken);
          if (!grupo) {
            return res.status(404).json({ error: 'Token no encontrado' });
          }
          return res.status(200).json(grupo);
        }

        const grupos = await redis.get<unknown[]>(DB_KEY) || [];
        const grupo = grupos.find((g: any) => ((g.token || '').trim().toLowerCase()) === normalizedToken);
        
        if (!grupo) {
          return res.status(404).json({ error: 'Token no encontrado' });
        }
        
        return res.status(200).json(grupo);
      }
      
      // Sin token: devolver todos los grupos (PRIVADO - requiere sesión admin)
      const isAuthorized = await validateAdminSession(req);
      if (!isAuthorized) {
        console.log('[API] GET /invitados sin token: acceso no autorizado');
        return res.status(401).json({ error: 'No autorizado' });
      }

      if (STORAGE_MODE === 'entity') {
        const grupos = await listEntityGrupos();
        return res.status(200).json(grupos);
      }

      const grupos = await redis.get<unknown[]>(DB_KEY) || [];
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

      // No loguear token completo
      console.log(`[API] POST /invitados: Guardando grupo ${grupo.id}`);

      if (STORAGE_MODE === 'entity') {
        await upsertEntityGrupo(grupo as GrupoInvitadosEntity);

        // Compat temporal: mantener legacy como backup (best-effort).
        const legacy = await readLegacyGrupos();
        const idx = legacy.findIndex((g: any) => g?.id === grupo.id);
        const next = [...legacy];
        if (idx >= 0) next[idx] = grupo;
        else next.push(grupo);
        await writeLegacyGrupos(next);

        return res.status(200).json({ success: true, grupo });
      }

      const grupos = await redis.get<unknown[]>(DB_KEY) || [];
      const index = grupos.findIndex((g: any) => g.id === grupo.id);
      if (index >= 0) grupos[index] = grupo;
      else grupos.push(grupo);
      await redis.set(DB_KEY, grupos);
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

      if (STORAGE_MODE === 'entity') {
        const existing = await getGrupoById(String(grupo.id));
        if (!existing) return res.status(404).json({ error: 'Grupo no encontrado' });

        await upsertEntityGrupo(grupo as GrupoInvitadosEntity);
        // best-effort legacy sync
        const legacy = await readLegacyGrupos();
        const idx = legacy.findIndex((g: any) => g?.id === grupo.id);
        const next = [...legacy];
        if (idx >= 0) next[idx] = grupo;
        else next.push(grupo);
        await writeLegacyGrupos(next);

        return res.status(200).json({ success: true, grupo });
      }

      const grupos = await redis.get<unknown[]>(DB_KEY) || [];
      const index = grupos.findIndex((g: any) => g.id === grupo.id);
      if (index < 0) return res.status(404).json({ error: 'Grupo no encontrado' });
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

      if (STORAGE_MODE === 'entity') {
        await deleteEntityGrupoById(id);
        // best-effort legacy sync
        const legacy = await readLegacyGrupos();
        const filtered = legacy.filter((g: any) => g?.id !== id);
        await writeLegacyGrupos(filtered);
        return res.status(200).json({ success: true });
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

