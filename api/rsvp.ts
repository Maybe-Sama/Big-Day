import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { z } from 'zod';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const DB_KEY = 'invitados:grupos';

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
  return token.trim().toLowerCase();
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

    const grupos = (await redis.get<unknown[]>(DB_KEY)) || [];
    const idx = grupos.findIndex((g: any) => normalizeToken(String(g?.token || '')) === normalizedToken);
    if (idx < 0) {
      return res.status(404).json({ error: 'Token no encontrado' });
    }

    const current: any = grupos[idx];

    // Prohibido: id, token, invitadoPrincipal.email, mesa, fechaCreacion
    // (no hay forma de modificarlos porque el schema es strict y solo permite whitelist)

    // Aplicar patch a campos de grupo permitidos
    if (typeof patch.asistencia !== 'undefined') {
      current.asistencia = patch.asistencia;
    }
    if (typeof patch.confirmacion_bus !== 'undefined') {
      current.confirmacion_bus = patch.confirmacion_bus;
    }
    if (typeof patch.ubicacion_bus !== 'undefined') {
      current.ubicacion_bus = patch.ubicacion_bus || undefined;
    }

    // Invitado principal
    if (patch.invitadoPrincipal) {
      if (!current.invitadoPrincipal || typeof current.invitadoPrincipal !== 'object') {
        return res.status(500).json({ error: 'Servidor no disponible' });
      }
      if (typeof patch.invitadoPrincipal.asistencia !== 'undefined') {
        current.invitadoPrincipal.asistencia = patch.invitadoPrincipal.asistencia;
      }
      if (typeof patch.invitadoPrincipal.alergias !== 'undefined') {
        current.invitadoPrincipal.alergias = patch.invitadoPrincipal.alergias || undefined;
      }
    }

    // Acompañantes: solo actualizar existentes (no permitir crear)
    if (patch.acompanantes) {
      if (!Array.isArray(current.acompanantes)) {
        return res.status(400).json({ error: 'Acompañantes inválidos' });
      }
      const existingIds = new Set<string>(current.acompanantes.map((ac: any) => String(ac?.id || '')));
      for (const acPatch of patch.acompanantes) {
        if (!existingIds.has(acPatch.id)) {
          return res.status(400).json({ error: 'Acompañante no permitido' });
        }
      }
      current.acompanantes = current.acompanantes.map((ac: any) => {
        const id = String(ac?.id || '');
        const p = patch.acompanantes?.find((x) => x.id === id);
        if (!p) return ac;
        const next = { ...ac };
        if (typeof p.asistencia !== 'undefined') next.asistencia = p.asistencia;
        if (typeof p.alergias !== 'undefined') next.alergias = p.alergias || undefined;
        return next;
      });
    }

    current.fechaActualizacion = new Date().toISOString();
    grupos[idx] = current;
    await redis.set(DB_KEY, grupos);

    return res.status(200).json(sanitizeGrupoForResponse(current));
  } catch (error) {
    console.error('Error en API rsvp:', error);
    return res.status(500).json({ error: 'Servidor no disponible' });
  }
}

