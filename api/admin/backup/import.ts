import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { z } from 'zod';
import { validateAdminSession } from '../../lib/auth.js';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const DB_KEY = 'invitados:grupos';
const CONFIG_BUSES_KEY = 'invitados:config:buses';
const CONFIG_MESAS_KEY = 'invitados:config:mesas';
const CARRERAS_KEY = 'invitados:carreras';

function setCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  const allowedOrigins = new Set<string>([
    process.env.VITE_SITE_URL || '',
    process.env.SITE_URL || '',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
    'http://localhost:3210',
    'http://localhost:3333',
  ].filter(Boolean));

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const AsistenciaSchema = z.enum(['pendiente', 'confirmado', 'rechazado']);

const AcompananteSchema = z
  .object({
    id: z.string().min(1).max(100),
    nombre: z.string(),
    apellidos: z.string(),
    tipo: z.enum(['pareja', 'hijo']),
    edad: z.number().optional(),
    asistencia: AsistenciaSchema,
    alergias: z.string().optional(),
  })
  .strict();

const InvitadoPrincipalSchema = z
  .object({
    nombre: z.string(),
    apellidos: z.string(),
    email: z.string(), // puede ser "" en datos existentes
    asistencia: AsistenciaSchema,
    alergias: z.string().optional(),
  })
  .strict();

const GrupoInvitadosSchema = z
  .object({
    id: z.string().min(1).max(200),
    invitadoPrincipal: InvitadoPrincipalSchema,
    acompanantes: z.array(AcompananteSchema),
    token: z.string().min(1).max(200),
    asistencia: AsistenciaSchema,
    fechaCreacion: z.string().min(1),
    fechaActualizacion: z.string().min(1),
    notas: z.string().optional(),
    confirmacion_bus: z.boolean(),
    ubicacion_bus: z.string().optional(),
    mesa: z.string().optional(),
  })
  .strict();

const BusConfigSchema = z
  .object({
    id: z.string().min(1),
    numero: z.number(),
    nombre: z.string().optional(),
  })
  .strict();

const ConfigBusesSchema = z
  .object({
    id: z.literal('config-buses'),
    buses: z.array(BusConfigSchema),
    fechaActualizacion: z.string().min(1),
  })
  .strict();

const MesaConfigSchema = z
  .object({
    id: z.string().min(1),
    nombre: z.string(),
    capacidad: z.number(),
    ubicacion: z.string().optional(),
    capitanId: z.string().optional(),
    token: z.string().optional(),
  })
  .strict();

const ConfigMesasSchema = z
  .object({
    id: z.literal('config-mesas'),
    mesas: z.array(MesaConfigSchema),
    fechaActualizacion: z.string().min(1),
  })
  .strict();

const FotoMisionSchema = z
  .object({
    id: z.string().min(1),
    misionId: z.number(),
    url: z.string().min(1),
    nombreInvitado: z.string(),
    fechaSubida: z.string().min(1),
    validada: z.boolean(),
  })
  .strict();

const CarreraFotosSchema = z
  .object({
    // campos “core”
    mesaId: z.string().min(1),
    misiones: z.array(z.number()),
    fotos: z.array(FotoMisionSchema),
    completada: z.boolean(),
    fechaInicio: z.string().optional(),
    fechaCompletada: z.string().optional(),
    // campos observados en cliente (compatibilidad)
    id: z.string().optional(),
    token: z.string().optional(),
  })
  .strict();

const BackupSchemaV1 = z
  .object({
    meta: z
      .object({
        version: z.literal(1),
        exportedAt: z.string().min(1),
        counts: z
          .object({
            grupos: z.number().optional(),
          })
          .partial()
          .optional(),
      })
      .strict(),
    data: z
      .object({
        grupos: z.array(GrupoInvitadosSchema),
        config: z
          .object({
            mesas: ConfigMesasSchema.nullable(),
            buses: ConfigBusesSchema.nullable(),
            carreras: z.array(CarreraFotosSchema),
          })
          .strict(),
      })
      .strict(),
  })
  .strict();

function normalizeToken(t: string) {
  return t.trim().toLowerCase();
}

function maskToken(token: string) {
  const t = String(token || '');
  if (!t) return 'tok_****';
  if (t.length <= 8) return 'tok_****';
  return `${t.slice(0, 4)}****${t.slice(-4)}`;
}

function parseBody(req: VercelRequest): unknown {
  // Vercel suele parsear JSON en req.body, pero manejamos string por compatibilidad.
  const b: any = (req as any).body;
  if (typeof b === 'string') {
    return JSON.parse(b);
  }
  return b;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const isAuthorized = await validateAdminSession(req);
    if (!isAuthorized) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    if (!process.env.KV_REST_API_URL && !process.env.UPSTASH_REDIS_REST_URL) {
      console.error('Error: Variables de entorno de Redis no configuradas');
      return res.status(500).json({ error: 'Servidor no disponible' });
    }

    const mode = String(req.query.mode || 'dry-run');
    if (mode !== 'dry-run' && mode !== 'apply') {
      return res.status(400).json({ error: 'Mode inválido. Usa dry-run o apply.' });
    }

    let body: unknown;
    try {
      body = parseBody(req);
    } catch {
      return res.status(400).json({ error: 'JSON inválido' });
    }

    const parsed = BackupSchemaV1.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Backup inválido (schema)' });
    }

    const backup = parsed.data;
    const grupos = backup.data.grupos;

    // Analítica (dry-run) — no expone tokens completos
    const idCounts = new Map<string, number>();
    const tokenCounts = new Map<string, number>();
    const tokensVacios: string[] = [];

    for (const g of grupos) {
      idCounts.set(g.id, (idCounts.get(g.id) || 0) + 1);
      const tokNorm = normalizeToken(g.token || '');
      if (!tokNorm) {
        tokensVacios.push(g.id);
      } else {
        tokenCounts.set(tokNorm, (tokenCounts.get(tokNorm) || 0) + 1);
      }
    }

    const idsDuplicados = Array.from(idCounts.entries())
      .filter(([, c]) => c > 1)
      .map(([id]) => id);

    const tokensDuplicados = Array.from(tokenCounts.entries())
      .filter(([, c]) => c > 1)
      .map(([tok]) => maskToken(tok));

    const summary = {
      totalGrupos: grupos.length,
      idsDuplicados,
      tokensDuplicados,
      tokensVacios, // lista de ids con token vacío
      warnings: [] as string[],
    };

    if (mode === 'dry-run') {
      return res.status(200).json({ ok: true, mode, summary });
    }

    // apply: snapshot + write
    const snapshotAt = new Date().toISOString();
    const snapshotKey = `backup:snapshot:${snapshotAt.replace(/[:.]/g, '-')}`;

    const [currentGrupos, currentMesas, currentBuses, currentCarreras] = await Promise.all([
      redis.get<unknown[]>(DB_KEY),
      redis.get<unknown>(CONFIG_MESAS_KEY),
      redis.get<unknown>(CONFIG_BUSES_KEY),
      redis.get<unknown[]>(CARRERAS_KEY),
    ]);

    const snapshot = {
      meta: { version: 1 as const, snapshotAt, reason: 'import' as const },
      data: {
        grupos: currentGrupos || [],
        config: {
          mesas: currentMesas ?? null,
          buses: currentBuses ?? null,
          carreras: currentCarreras || [],
        },
      },
    };

    await redis.set(snapshotKey, snapshot);

    await Promise.all([
      redis.set(DB_KEY, backup.data.grupos),
      redis.set(CONFIG_MESAS_KEY, backup.data.config.mesas),
      redis.set(CONFIG_BUSES_KEY, backup.data.config.buses),
      redis.set(CARRERAS_KEY, backup.data.config.carreras),
    ]);

    return res.status(200).json({
      success: true,
      restored: {
        totalGrupos: backup.data.grupos.length,
      },
      snapshotKey,
      summary,
    });
  } catch (error: any) {
    const msg = String(error?.message || '');
    if (msg.toLowerCase().includes('body') && msg.toLowerCase().includes('large')) {
      return res.status(413).json({ error: 'Payload demasiado grande' });
    }
    console.error('Error en API admin/backup/import:', error);
    return res.status(500).json({ error: 'Servidor no disponible' });
  }
}

