import type { Acompanante, GrupoInvitados } from "@/types/invitados";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function mergeGrupoFromPatchResponse(
  prev: GrupoInvitados,
  serverGrupo: unknown,
): GrupoInvitados {
  if (!isRecord(serverGrupo)) {
    return prev;
  }

  const serverPrincipal = isRecord(serverGrupo.invitadoPrincipal)
    ? (serverGrupo.invitadoPrincipal as Partial<GrupoInvitados["invitadoPrincipal"]>)
    : undefined;

  let serverAcompanantes = prev.acompanantes;
  if (Array.isArray(serverGrupo.acompanantes)) {
    const safeAcompanantes = serverGrupo.acompanantes.filter(
      (ac): ac is Acompanante => isRecord(ac),
    );
    if (safeAcompanantes.length === serverGrupo.acompanantes.length) {
      serverAcompanantes = safeAcompanantes;
    }
  }

  return {
    ...prev,
    ...(serverGrupo as Partial<GrupoInvitados>),
    token: prev.token,
    invitadoPrincipal: {
      ...prev.invitadoPrincipal,
      ...(serverPrincipal ?? {}),
      // Nunca pisar el email real con el email enmascarado del endpoint RSVP.
      email: prev.invitadoPrincipal.email,
    },
    acompanantes: serverAcompanantes,
  };
}

export function getAcompananteIdsFromServer(serverGrupo: unknown): string[] {
  if (!isRecord(serverGrupo) || !Array.isArray(serverGrupo.acompanantes)) {
    return [];
  }

  const ids: string[] = [];
  for (const ac of serverGrupo.acompanantes) {
    if (isRecord(ac) && typeof ac.id === "string" && ac.id.trim()) {
      ids.push(ac.id);
    }
  }
  return ids;
}

export function countConfirmadosSafe(grupo: GrupoInvitados): number {
  const acompanantes = Array.isArray(grupo.acompanantes) ? grupo.acompanantes : [];
  return [grupo.invitadoPrincipal, ...acompanantes].filter(
    (persona) => isRecord(persona) && persona.asistencia === "confirmado",
  ).length;
}
