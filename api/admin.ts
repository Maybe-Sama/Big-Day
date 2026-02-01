import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import { z } from 'zod';
import { validateAdminSession } from '../serverlib/auth.js';
import {
  CARRERAS_KEY,
  CONFIG_BUSES_KEY,
  CONFIG_MESAS_KEY,
  IDS_KEY,
  LEGACY_GRUPOS_KEY,
  MIGRATION_COMPLETED_AT_KEY,
  MIGRATION_VERSION_KEY,
  GrupoInvitadosEntity,
  grupoKey,
  listGrupos,
  normalizeToken,
  tokenKey,
  writeLegacyGrupos,
} from '../serverlib/storage.js';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const STORAGE_MODE = (process.env.STORAGE_MODE || 'legacy').toLowerCase() as 'legacy' | 'entity';
const ADMIN_KEY = process.env.ADMIN_KEY;
const SESSION_TTL = 24 * 60 * 60; // 24h (seconds)
const SESSION_KEY_PREFIX = 'admin:session:';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function backupFilename(now: Date) {
  const yyyy = now.getFullYear();
  const mm = pad2(now.getMonth() + 1);
  const dd = pad2(now.getDate());
  const hh = pad2(now.getHours());
  const min = pad2(now.getMinutes());
  return `big-day-backup-${yyyy}-${mm}-${dd}-${hh}${min}.json`;
}

function snapshotKey(tsIso: string) {
  return `backup:snapshot:migration:${tsIso.replace(/[:.]/g, '-')}`;
}

function parseBody(req: VercelRequest): unknown {
  const b: any = (req as any).body;
  if (typeof b === 'string') return JSON.parse(b);
  return b;
}

function isHttps(req: VercelRequest) {
  return req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production';
}

// ===== Backup schema (strict) =====
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
    confirmacion_bus: z.boolean().optional(),
  })
  .strict();

const InvitadoPrincipalSchema = z
  .object({
    nombre: z.string(),
    apellidos: z.string(),
    email: z.string(), // puede ser "" en datos existentes
    asistencia: AsistenciaSchema,
    alergias: z.string().optional(),
    confirmacion_bus: z.boolean().optional(),
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
    mesaId: z.string().min(1),
    misiones: z.array(z.number()),
    fotos: z.array(FotoMisionSchema),
    completada: z.boolean(),
    fechaInicio: z.string().optional(),
    fechaCompletada: z.string().optional(),
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

function maskToken(tokNorm: string) {
  const t = String(tokNorm || '');
  if (!t) return 'tok_****';
  if (t.length <= 8) return 'tok_****';
  return `${t.slice(0, 4)}****${t.slice(-4)}`;
}

async function requireAdmin(req: VercelRequest, res: VercelResponse): Promise<boolean> {
  const ok = await validateAdminSession(req);
  if (!ok) {
    res.status(401).json({ error: 'No autorizado' });
    return false;
  }
  return true;
}

async function handleLogin(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  if (!process.env.KV_REST_API_URL && !process.env.UPSTASH_REDIS_REST_URL) {
    console.error('Error: Variables de entorno de Redis no configuradas');
    return res.status(500).json({ error: 'Servidor no disponible' });
  }
  if (!ADMIN_KEY) {
    console.error('Error: ADMIN_KEY no configurada');
    return res.status(500).json({ error: 'Servidor no disponible' });
  }

  const body: any = req.body;
  const key = body?.key;
  if (!key || typeof key !== 'string') return res.status(400).json({ error: 'Clave requerida' });
  if (key !== ADMIN_KEY) return res.status(401).json({ error: 'No autorizado' });

  const sessionToken = crypto.randomBytes(32).toString('hex');
  const sessionKey = `${SESSION_KEY_PREFIX}${sessionToken}`;
  await redis.setex(sessionKey, SESSION_TTL, '1');

  const cookieParts = [
    `admin_session=${sessionToken}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${SESSION_TTL}`,
  ];
  if (isHttps(req)) cookieParts.push('Secure');
  res.setHeader('Set-Cookie', cookieParts.join('; '));
  return res.status(200).json({ ok: true });
}

async function handleLogout(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const cookies = req.headers.cookie || '';
  const sessionMatch = cookies.match(/admin_session=([^;]+)/);
  if (sessionMatch) {
    const sessionToken = sessionMatch[1];
    await redis.del(`${SESSION_KEY_PREFIX}${sessionToken}`);
  }

  const cookieParts = [
    `admin_session=`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (isHttps(req)) cookieParts.push('Secure');
  res.setHeader('Set-Cookie', cookieParts.join('; '));
  return res.status(200).json({ ok: true });
}

async function handleBackupExport(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });
  if (!(await requireAdmin(req, res))) return;

  const [mesasRaw, busesRaw, carrerasRaw] = await Promise.all([
    redis.get<unknown>(CONFIG_MESAS_KEY),
    redis.get<unknown>(CONFIG_BUSES_KEY),
    redis.get<unknown[]>(CARRERAS_KEY),
  ]);

  const grupos =
    STORAGE_MODE === 'entity'
      ? await listGrupos()
      : (await redis.get<unknown[]>(LEGACY_GRUPOS_KEY)) || [];

  const payload = {
    meta: {
      version: 1 as const,
      exportedAt: new Date().toISOString(),
      counts: { grupos: grupos.length },
      storageMode: STORAGE_MODE,
    },
    data: {
      grupos,
      config: {
        mesas: mesasRaw ?? null,
        buses: busesRaw ?? null,
        carreras: carrerasRaw || [],
      },
    },
  };

  const filename = backupFilename(new Date());
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(JSON.stringify(payload, null, 2));
}

async function handleBackupImport(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  if (!(await requireAdmin(req, res))) return;

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
  if (!parsed.success) return res.status(400).json({ error: 'Backup inválido (schema)' });

  const backup = parsed.data;
  const grupos = backup.data.grupos;

  const idCounts = new Map<string, number>();
  const tokenCounts = new Map<string, number>();
  const tokensVacios: string[] = [];
  for (const g of grupos) {
    idCounts.set(g.id, (idCounts.get(g.id) || 0) + 1);
    const tokNorm = normalizeToken(g.token || '');
    if (!tokNorm) tokensVacios.push(g.id);
    else tokenCounts.set(tokNorm, (tokenCounts.get(tokNorm) || 0) + 1);
  }

  const idsDuplicados = Array.from(idCounts.entries()).filter(([, c]) => c > 1).map(([id]) => id);
  const tokensDuplicados = Array.from(tokenCounts.entries()).filter(([, c]) => c > 1).map(([t]) => maskToken(t));

  const summary = {
    totalGrupos: grupos.length,
    idsDuplicados,
    tokensDuplicados,
    tokensVacios,
    warnings: [] as string[],
  };

  if (mode === 'dry-run') return res.status(200).json({ ok: true, mode, summary });

  const snapshotAt = new Date().toISOString();
  const snapshotKey = `backup:snapshot:${snapshotAt.replace(/[:.]/g, '-')}`;

  const [currentLegacyGrupos, currentIds, currentMesas, currentBuses, currentCarreras] = await Promise.all([
    redis.get<unknown[]>(LEGACY_GRUPOS_KEY),
    redis.get<string[]>(IDS_KEY),
    redis.get<unknown>(CONFIG_MESAS_KEY),
    redis.get<unknown>(CONFIG_BUSES_KEY),
    redis.get<unknown[]>(CARRERAS_KEY),
  ]);

  const currentEntityGrupos =
    STORAGE_MODE === 'entity'
      ? await Promise.all(((currentIds || []) as string[]).map(async (id) => redis.get<unknown>(grupoKey(id))))
      : [];

  await redis.set(snapshotKey, {
    meta: { version: 1 as const, snapshotAt, reason: 'import' as const },
    data: {
      legacyGrupos: currentLegacyGrupos || [],
      entity: STORAGE_MODE === 'entity' ? { ids: currentIds || [], grupos: currentEntityGrupos.filter(Boolean) } : null,
      config: {
        mesas: currentMesas ?? null,
        buses: currentBuses ?? null,
        carreras: currentCarreras || [],
      },
    },
  });

  if (STORAGE_MODE === 'entity') {
    const idsNew = new Set<string>();
    for (const g of backup.data.grupos as unknown as GrupoInvitadosEntity[]) {
      if (!g?.id || !g?.token) continue;
      const id = String(g.id);
      const tok = normalizeToken(String(g.token));
      if (!id || !tok) continue;
      await redis.set(grupoKey(id), g);
      await redis.set(tokenKey(tok), id);
      idsNew.add(id);
    }
    await redis.set(IDS_KEY, Array.from(idsNew));
    await redis.set(LEGACY_GRUPOS_KEY, backup.data.grupos);
  } else {
    await redis.set(LEGACY_GRUPOS_KEY, backup.data.grupos);
  }

  await Promise.all([
    redis.set(CONFIG_MESAS_KEY, backup.data.config.mesas),
    redis.set(CONFIG_BUSES_KEY, backup.data.config.buses),
    redis.set(CARRERAS_KEY, backup.data.config.carreras),
  ]);

  return res.status(200).json({
    success: true,
    restored: { totalGrupos: backup.data.grupos.length },
    snapshotKey,
    summary,
    storageMode: STORAGE_MODE,
  });
}

async function handleMigrate(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  if (!(await requireAdmin(req, res))) return;

  const mode = String(req.query.mode || 'dry-run');
  if (mode !== 'dry-run' && mode !== 'apply') {
    return res.status(400).json({ error: 'Mode inválido. Usa dry-run o apply.' });
  }

  const legacy = (await redis.get<unknown[]>(LEGACY_GRUPOS_KEY)) || [];
  const legacyGrupos = legacy as unknown as GrupoInvitadosEntity[];
  const entityIds = (await redis.get<string[]>(IDS_KEY)) || [];

  const idsSeen = new Map<string, number>();
  const tokensSeen = new Map<string, number>();
  const tokensVacios: string[] = [];
  for (const g of legacyGrupos) {
    const id = String(g?.id || '').trim();
    const tok = normalizeToken(String(g?.token || ''));
    if (id) idsSeen.set(id, (idsSeen.get(id) || 0) + 1);
    if (!tok) {
      if (id) tokensVacios.push(id);
      continue;
    }
    tokensSeen.set(tok, (tokensSeen.get(tok) || 0) + 1);
  }

  const idsDuplicados = Array.from(idsSeen.entries()).filter(([, c]) => c > 1).map(([id]) => id);
  const tokensDuplicados = Array.from(tokensSeen.entries()).filter(([, c]) => c > 1).map(([t]) => maskToken(t));

  const report = {
    totalLegacy: legacyGrupos.length,
    totalEntityIds: entityIds.length,
    idsDuplicados,
    tokensDuplicados,
    tokensVacios,
    willWrite: legacyGrupos.filter((g) => g?.id && g?.token).length,
  };

  if (mode === 'dry-run') return res.status(200).json({ ok: true, mode, report });

  const ts = new Date().toISOString();
  const snapKey = snapshotKey(ts);
  const [mesas, buses, carreras] = await Promise.all([
    redis.get<unknown>(CONFIG_MESAS_KEY),
    redis.get<unknown>(CONFIG_BUSES_KEY),
    redis.get<unknown[]>(CARRERAS_KEY),
  ]);

  await redis.set(snapKey, {
    meta: { version: 1 as const, snapshotAt: ts, reason: 'migration' as const },
    data: {
      legacyGrupos,
      config: { mesas: mesas ?? null, buses: buses ?? null, carreras: carreras || [] },
    },
  });

  const ids = new Set<string>(entityIds);
  for (const g of legacyGrupos) {
    if (!g?.id || !g?.token) continue;
    const id = String(g.id);
    const tok = normalizeToken(String(g.token));
    if (!id || !tok) continue;
    await redis.set(grupoKey(id), g);
    await redis.set(tokenKey(tok), id);
    ids.add(id);
  }
  await redis.set(IDS_KEY, Array.from(ids));
  await redis.set(MIGRATION_VERSION_KEY, 1);
  await redis.set(MIGRATION_COMPLETED_AT_KEY, new Date().toISOString());

  return res.status(200).json({ success: true, mode, snapshotKey: snapKey, report });
}

async function handleReorderGrupos(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  if (!(await requireAdmin(req, res))) return;

  const body = parseBody(req);
  if (!body || !Array.isArray((body as any).grupos)) {
    return res.status(400).json({ error: 'Body inválido: se requiere { grupos: GrupoInvitados[] }' });
  }

  const grupos = (body as { grupos: GrupoInvitadosEntity[] }).grupos;
  if (grupos.length === 0) return res.status(200).json({ success: true, totalGrupos: 0 });

  if (STORAGE_MODE === 'entity') {
    const idsNew = grupos.map((g) => String(g?.id || '').trim()).filter(Boolean);
    await redis.set(IDS_KEY, idsNew);
    await writeLegacyGrupos(grupos);
  } else {
    await redis.set(LEGACY_GRUPOS_KEY, grupos);
  }

  return res.status(200).json({ success: true, totalGrupos: grupos.length });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.setHeader('Content-Type', 'application/json');

  try {
    if (!process.env.KV_REST_API_URL && !process.env.UPSTASH_REDIS_REST_URL) {
      // No secrets printed.
      return res.status(500).json({ error: 'Servidor no disponible' });
    }

    const action = String(req.query.action || '').trim();
    if (!action) return res.status(400).json({ error: 'Action requerido' });

    if (action === 'login') return await handleLogin(req, res);
    if (action === 'logout') return await handleLogout(req, res);
    if (action === 'backup-export') return await handleBackupExport(req, res);
    if (action === 'backup-import') return await handleBackupImport(req, res);
    if (action === 'migrate') return await handleMigrate(req, res);
    if (action === 'reorder-grupos') return await handleReorderGrupos(req, res);

    return res.status(400).json({ error: 'Action inválido' });
  } catch (error: any) {
    const msg = String(error?.message || '');
    if (msg.toLowerCase().includes('body') && msg.toLowerCase().includes('large')) {
      return res.status(413).json({ error: 'Payload demasiado grande' });
    }
    console.error('Error en API admin router:', error);
    return res.status(500).json({ error: 'Servidor no disponible' });
  }
}

