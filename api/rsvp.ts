import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { z } from 'zod';
import {
  GrupoInvitadosEntity,
  getGrupoIdByToken,
  getGrupoById,
  getGrupoByToken as getEntityGrupoByToken,
  upsertGrupo as upsertEntityGrupo,
  normalizeToken as normalizeTokenShared,
} from '../serverlib/storage.js';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const DB_KEY = 'invitados:grupos';
const STORAGE_MODE = (process.env.STORAGE_MODE || 'legacy').toLowerCase() as 'legacy' | 'entity';

const AsistenciaSchema = z.enum(['pendiente', 'confirmado', 'rechazado']);

const RsvpPatchSchema = z
  .object({
    asistencia: AsistenciaSchema.optional(),
    confirmacion_bus: z.boolean().optional(),
    ubicacion_bus: z.string().trim().min(1).max(200).optional(),
    invitadoPrincipal: z
      .object({
        asistencia: AsistenciaSchema.optional(),
        alergias: z.string().trim().min(1).max(500).optional(),
      })
      .strict()
      .optional(),
    acompanantes: z
      .array(
        z
          .object({
            id: z.string().min(1).max(100),
            asistencia: AsistenciaSchema.optional(),
            alergias: z.string().trim().min(1).max(500).optional(),
          })
          .strict(),
      )
      .optional(),
  })
  .strict();

function normalizeToken(token: string): string {
  return normalizeTokenShared(token);
}

function maskToken(token?: unknown): string {
  const t = String(token || '');
  if (!t) return '';
  if (t.length <= 8) return 'tok_****';
  return `${t.slice(0, 4)}****${t.slice(-4)}`;
}

function maskEmail(email?: unknown): string {
  const e = String(email || '');
  if (!e) return '';
  const at = e.indexOf('@');
  if (at <= 1) return 'a***@redacted';
  return `${e[0]}***${e.slice(at)}`;
}

function sanitizeGrupoForResponse(grupo: any) {
  // Maintain shape but never return full token/email.
  return {
    ...grupo,
    token: maskToken(grupo?.token),
    invitadoPrincipal: {
      ...grupo?.invitadoPrincipal,
      email: maskEmail(grupo?.invitadoPrincipal?.email),
    },
  };
}

function cloneGrupoForUpdate(grupo: any) {
  return {
    ...grupo,
    invitadoPrincipal: { ...(grupo?.invitadoPrincipal || {}) },
    acompanantes: Array.isArray(grupo?.acompanantes)
      ? grupo.acompanantes.map((ac: any) => ({ ...ac }))
      : grupo?.acompanantes,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  const allowedOrigins = new Set<string>(
    [
      process.env.VITE_SITE_URL || '',
      process.env.SITE_URL || '',
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
      'http://localhost:3210',
      'http://localhost:3001',
    ].filter(Boolean),
  );

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    if (!process.env.KV_REST_API_URL && !process.env.UPSTASH_REDIS_REST_URL) {
      console.error('Error: Variables de entorno de Redis no configuradas');
      return res.status(500).json({ error: 'Servidor no disponible' });
    }

    const token = req.query.token;
    if (!token || typeof token !== 'string' || !token.trim()) {
      return res.status(400).json({ error: 'Token requerido' });
    }
    const normalizedToken = normalizeToken(token);

    const parsed = RsvpPatchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Payload inválido' });
    }
    const patch = parsed.data;

    if (STORAGE_MODE === 'entity') {
      // Entity store path: update single group key by token->id mapping.
      const tok = normalizedToken;
      let id = await getGrupoIdByToken(tok);

      // Fallback: if mapping missing (not migrated yet), try to read legacy once and “lift” to entity.
      if (!id) {
        const legacy = (await redis.get<unknown[]>(DB_KEY)) || [];
        const legacyGrupo = legacy.find((g: any) => normalizeToken(String(g?.token || '')) === tok) as unknown as GrupoInvitadosEntity | undefined;
        if (!legacyGrupo?.id) {
          return res.status(404).json({ error: 'Token no encontrado' });
        }
        await upsertEntityGrupo(legacyGrupo);
        id = legacyGrupo.id;
      }

      // optimistic retry (2 attempts) on fechaActualizacion
      for (let attempt = 0; attempt < 2; attempt++) {
        const current = await getGrupoById(id);
        if (!current) return res.status(404).json({ error: 'Token no encontrado' });
        const baseFecha = String(current.fechaActualizacion || '');

        const updated: any = cloneGrupoForUpdate(current);
        const desiredAsistencia = patch.invitadoPrincipal?.asistencia ?? patch.asistencia;
        if (typeof desiredAsistencia !== 'undefined') {
          updated.asistencia = desiredAsistencia;
          updated.invitadoPrincipal.asistencia = desiredAsistencia;
        }
        if (typeof patch.confirmacion_bus !== 'undefined') updated.confirmacion_bus = patch.confirmacion_bus;
        if (typeof patch.ubicacion_bus !== 'undefined') updated.ubicacion_bus = patch.ubicacion_bus || undefined;
        if (patch.invitadoPrincipal && typeof patch.invitadoPrincipal.alergias !== 'undefined') {
          updated.invitadoPrincipal.alergias = patch.invitadoPrincipal.alergias || undefined;
        }
        if (patch.acompanantes) {
          if (!Array.isArray(updated.acompanantes)) return res.status(400).json({ error: 'Acompañantes inválidos' });
          const existingIds = new Set<string>(updated.acompanantes.map((ac: any) => String(ac?.id || '')));
          for (const acPatch of patch.acompanantes) {
            if (!existingIds.has(acPatch.id)) return res.status(400).json({ error: 'Acompañante no permitido' });
          }
          updated.acompanantes = updated.acompanantes.map((ac: any) => {
            const p = patch.acompanantes?.find((x) => x.id === String(ac?.id || ''));
            if (!p) return ac;
            const next = { ...ac };
            if (typeof p.asistencia !== 'undefined') next.asistencia = p.asistencia;
            if (typeof p.alergias !== 'undefined') next.alergias = p.alergias || undefined;
            return next;
          });
        }
        updated.fechaActualizacion = new Date().toISOString();

        const reread = await getGrupoById(id);
        const nowFecha = String(reread?.fechaActualizacion || '');
        if (nowFecha !== baseFecha) {
          if (attempt === 0) continue;
          return res.status(409).json({ error: 'Conflicto: el grupo fue actualizado recientemente. Reintenta.' });
        }

        await upsertEntityGrupo(updated as GrupoInvitadosEntity);
        return res.status(200).json(sanitizeGrupoForResponse(updated));
      }

      return res.status(409).json({ error: 'Conflicto: el grupo fue actualizado recientemente. Reintenta.' });
    }

    const findIndexByToken = (arr: unknown[]) =>
      arr.findIndex((g: any) => normalizeToken(String(g?.token || '')) === normalizedToken);

    // Protección ligera contra colisiones:
    // intentamos 2 veces aplicar el patch si detectamos que cambió fechaActualizacion.
    for (let attempt = 0; attempt < 2; attempt++) {
      const grupos = (await redis.get<unknown[]>(DB_KEY)) || [];
      const idx = findIndexByToken(grupos);
      if (idx < 0) {
        return res.status(404).json({ error: 'Token no encontrado' });
      }

      const base: any = grupos[idx];
      const baseFecha = String(base?.fechaActualizacion || '');
      const updated: any = cloneGrupoForUpdate(base);

      if (!updated.invitadoPrincipal || typeof updated.invitadoPrincipal !== 'object') {
        return res.status(500).json({ error: 'Servidor no disponible' });
      }

      // Prohibido: id, token, invitadoPrincipal.email, mesa, fechaCreacion
      // (no hay forma de modificarlos porque el schema es strict y solo permite whitelist)

      // 1) Unificar asistencia (un solo estado efectivo):
      // - Si llega invitadoPrincipal.asistencia, manda.
      // - Si no, usar asistencia (grupo).
      const desiredAsistencia =
        patch.invitadoPrincipal?.asistencia ?? patch.asistencia;
      if (typeof desiredAsistencia !== 'undefined') {
        updated.asistencia = desiredAsistencia;
        updated.invitadoPrincipal.asistencia = desiredAsistencia;
      }

      // Campos de grupo permitidos
      if (typeof patch.confirmacion_bus !== 'undefined') {
        updated.confirmacion_bus = patch.confirmacion_bus;
      }
      if (typeof patch.ubicacion_bus !== 'undefined') {
        updated.ubicacion_bus = patch.ubicacion_bus || undefined;
      }

      // Invitado principal (solo alergias aquí; asistencia ya unificada arriba)
      if (patch.invitadoPrincipal && typeof patch.invitadoPrincipal.alergias !== 'undefined') {
        updated.invitadoPrincipal.alergias = patch.invitadoPrincipal.alergias || undefined;
      }

      // Acompañantes: solo actualizar existentes (no permitir crear)
      if (patch.acompanantes) {
        if (!Array.isArray(updated.acompanantes)) {
          return res.status(400).json({ error: 'Acompañantes inválidos' });
        }
        const existingIds = new Set<string>(
          updated.acompanantes.map((ac: any) => String(ac?.id || '')),
        );
        for (const acPatch of patch.acompanantes) {
          if (!existingIds.has(acPatch.id)) {
            return res.status(400).json({ error: 'Acompañante no permitido' });
          }
        }
        updated.acompanantes = updated.acompanantes.map((ac: any) => {
          const id = String(ac?.id || '');
          const p = patch.acompanantes?.find((x) => x.id === id);
          if (!p) return ac;
          const next = { ...ac };
          if (typeof p.asistencia !== 'undefined') next.asistencia = p.asistencia;
          if (typeof p.alergias !== 'undefined') next.alergias = p.alergias || undefined;
          return next;
        });
      }

      updated.fechaActualizacion = new Date().toISOString();

      // Releer y comparar fechaActualizacion para detectar write concurrente
      const gruposNow = (await redis.get<unknown[]>(DB_KEY)) || [];
      const idxNow = findIndexByToken(gruposNow);
      if (idxNow < 0) {
        return res.status(404).json({ error: 'Token no encontrado' });
      }
      const nowFecha = String((gruposNow[idxNow] as any)?.fechaActualizacion || '');

      if (nowFecha !== baseFecha) {
        if (attempt === 0) {
          continue; // retry una vez sobre el estado más reciente
        }
        return res.status(409).json({ error: 'Conflicto: el grupo fue actualizado recientemente. Reintenta.' });
      }

      gruposNow[idxNow] = updated;
      await redis.set(DB_KEY, gruposNow);
      return res.status(200).json(sanitizeGrupoForResponse(updated));
    }

    return res.status(409).json({ error: 'Conflicto: el grupo fue actualizado recientemente. Reintenta.' });
  } catch (error) {
    console.error('Error en API rsvp:', error);
    return res.status(500).json({ error: 'Servidor no disponible' });
  }
}

