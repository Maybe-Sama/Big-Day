import { Redis } from '@upstash/redis';

// KV keys (legacy + entity)
export const LEGACY_GRUPOS_KEY = 'invitados:grupos';
export const GRUPO_KEY_PREFIX = 'invitados:grupo:'; // invitados:grupo:{id}
export const TOKEN_KEY_PREFIX = 'invitados:token:'; // invitados:token:{tokenNorm} -> id
export const IDS_KEY = 'invitados:ids'; // array de ids

export const CONFIG_BUSES_KEY = 'invitados:config:buses';
export const CONFIG_MESAS_KEY = 'invitados:config:mesas';
export const CARRERAS_KEY = 'invitados:carreras';

export const MIGRATION_VERSION_KEY = 'invitados:migration:version';
export const MIGRATION_COMPLETED_AT_KEY = 'invitados:migration:completedAt';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export type Asistencia = 'pendiente' | 'confirmado' | 'rechazado';

export interface GrupoInvitadosEntity {
  id: string;
  token: string;
  asistencia: Asistencia;
  fechaCreacion: string;
  fechaActualizacion: string;
  invitadoPrincipal: {
    nombre: string;
    apellidos: string;
    email: string;
    asistencia: Asistencia;
    alergias?: string;
    confirmacion_bus?: boolean;
  };
  acompanantes: Array<{
    id: string;
    nombre: string;
    apellidos: string;
    tipo: 'pareja' | 'hijo';
    edad?: number;
    asistencia: Asistencia;
    alergias?: string;
    confirmacion_bus?: boolean;
  }>;
  notas?: string;
  confirmacion_bus: boolean;
  ubicacion_bus?: string;
  mesa?: string;
}

export function normalizeToken(token: string): string {
  return token.trim().toLowerCase();
}

export function grupoKey(id: string): string {
  return `${GRUPO_KEY_PREFIX}${id}`;
}

export function tokenKey(tokenNorm: string): string {
  return `${TOKEN_KEY_PREFIX}${tokenNorm}`;
}

export async function readLegacyGrupos(): Promise<unknown[]> {
  const grupos = await redis.get<unknown[]>(LEGACY_GRUPOS_KEY);
  return grupos || [];
}

export async function writeLegacyGrupos(grupos: unknown[]): Promise<void> {
  await redis.set(LEGACY_GRUPOS_KEY, grupos);
}

export async function getIds(): Promise<string[]> {
  const ids = await redis.get<string[]>(IDS_KEY);
  return ids || [];
}

export async function setIds(ids: string[]): Promise<void> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  await redis.set(IDS_KEY, unique);
}

export async function ensureIdInIndex(id: string): Promise<void> {
  const ids = await getIds();
  if (ids.includes(id)) return;
  ids.push(id);
  await setIds(ids);
}

export async function ensureTokenIndex(tokenNorm: string, id: string): Promise<void> {
  await redis.set(tokenKey(tokenNorm), id);
}

export async function ensureIndexesForGrupo(grupo: Pick<GrupoInvitadosEntity, 'id' | 'token'>): Promise<void> {
  const id = String(grupo.id || '').trim();
  const tok = normalizeToken(String(grupo.token || ''));
  if (!id || !tok) return;
  await Promise.all([ensureIdInIndex(id), ensureTokenIndex(tok, id)]);
}

export async function getGrupoById(id: string): Promise<GrupoInvitadosEntity | null> {
  const v = await redis.get<GrupoInvitadosEntity>(grupoKey(id));
  return v || null;
}

export async function getGrupoIdByToken(tokenNorm: string): Promise<string | null> {
  const id = await redis.get<string>(tokenKey(tokenNorm));
  return id || null;
}

export async function getGrupoByToken(token: string): Promise<GrupoInvitadosEntity | null> {
  const tok = normalizeToken(token);
  if (!tok) return null;
  const id = await getGrupoIdByToken(tok);
  if (id) {
    const g = await getGrupoById(id);
    if (g) return g;
  }
  return null;
}

export async function listGrupos(): Promise<GrupoInvitadosEntity[]> {
  const ids = await getIds();
  if (ids.length === 0) return [];
  const grupos = await Promise.all(ids.map((id) => getGrupoById(id)));
  return grupos.filter((g): g is GrupoInvitadosEntity => Boolean(g));
}

export async function upsertGrupo(grupo: GrupoInvitadosEntity): Promise<void> {
  await redis.set(grupoKey(grupo.id), grupo);
  await ensureIndexesForGrupo(grupo);
}

export async function deleteGrupoById(id: string): Promise<void> {
  const current = await getGrupoById(id);
  if (current?.token) {
    const tok = normalizeToken(current.token);
    await redis.del(tokenKey(tok));
  }
  await redis.del(grupoKey(id));
  const ids = await getIds();
  if (ids.includes(id)) {
    await setIds(ids.filter((x) => x !== id));
  }
}

