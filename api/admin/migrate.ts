import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { validateAdminSession } from '../lib/auth.js';
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
  normalizeToken,
  tokenKey,
} from '../lib/storage.js';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

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

function maskToken(tokenNorm: string): string {
  const t = String(tokenNorm || '');
  if (!t) return 'tok_****';
  if (t.length <= 8) return 'tok_****';
  return `${t.slice(0, 4)}****${t.slice(-4)}`;
}

function snapshotKey(tsIso: string) {
  return `backup:snapshot:migration:${tsIso.replace(/[:.]/g, '-')}`;
}

async function readLegacyGrupos(): Promise<GrupoInvitadosEntity[]> {
  const legacy = await redis.get<unknown[]>(LEGACY_GRUPOS_KEY);
  const arr = legacy || [];
  // Trust existing shape; validation is handled by backups/import elsewhere.
  return arr as unknown as GrupoInvitadosEntity[];
}

async function getEntityIdsCount(): Promise<number> {
  const ids = await redis.get<string[]>(IDS_KEY);
  return (ids || []).length;
}

async function migrateLegacyToEntityStore(grupos: GrupoInvitadosEntity[]) {
  const ids = new Set<string>(await redis.get<string[]>(IDS_KEY) || []);

  for (const g of grupos) {
    if (!g?.id || !g?.token) continue;
    const id = String(g.id);
    const tok = normalizeToken(String(g.token));
    if (!id || !tok) continue;

    // Write entity group + token->id
    await redis.set(grupoKey(id), g);
    await redis.set(tokenKey(tok), id);
    ids.add(id);
  }

  await redis.set(IDS_KEY, Array.from(ids));
  await redis.set(MIGRATION_VERSION_KEY, 1);
  await redis.set(MIGRATION_COMPLETED_AT_KEY, new Date().toISOString());
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

    const legacyGrupos = await readLegacyGrupos();
    const entityIdsCount = await getEntityIdsCount();

    // Report duplicates / anomalies
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
      totalEntityIds: entityIdsCount,
      idsDuplicados,
      tokensDuplicados,
      tokensVacios,
      willWrite: legacyGrupos.filter((g) => g?.id && g?.token).length,
    };

    if (mode === 'dry-run') {
      return res.status(200).json({ ok: true, mode, report });
    }

    // apply: snapshot legacy + config, then migrate (idempotent), keep legacy untouched
    const ts = new Date().toISOString();
    const snapKey = snapshotKey(ts);

    const [mesas, buses, carreras] = await Promise.all([
      redis.get<unknown>(CONFIG_MESAS_KEY),
      redis.get<unknown>(CONFIG_BUSES_KEY),
      redis.get<unknown[]>(CARRERAS_KEY),
    ]);

    const snapshot = {
      meta: { version: 1 as const, snapshotAt: ts, reason: 'migration' as const },
      data: {
        legacyGrupos,
        config: {
          mesas: mesas ?? null,
          buses: buses ?? null,
          carreras: carreras || [],
        },
      },
    };

    await redis.set(snapKey, snapshot);
    await migrateLegacyToEntityStore(legacyGrupos);

    return res.status(200).json({
      success: true,
      mode,
      snapshotKey: snapKey,
      report,
    });
  } catch (error) {
    console.error('Error en API admin/migrate:', error);
    return res.status(500).json({ error: 'Servidor no disponible' });
  }
}

