import { describe, expect, it } from "vitest";
import type { GrupoInvitados } from "@/types/invitados";
import {
  countConfirmadosSafe,
  getAcompananteIdsFromServer,
  mergeGrupoFromPatchResponse,
} from "./rsvp-guards";

const baseGrupo: GrupoInvitados = {
  id: "g-1",
  token: "real-token",
  asistencia: "pendiente",
  fechaCreacion: "2026-01-01T10:00:00.000Z",
  fechaActualizacion: "2026-01-01T10:00:00.000Z",
  confirmacion_bus: false,
  invitadoPrincipal: {
    nombre: "Ana",
    apellidos: "Luna",
    email: "ana@example.com",
    asistencia: "pendiente",
  },
  acompanantes: [
    {
      id: "ac-1",
      nombre: "Luis",
      apellidos: "Sol",
      tipo: "pareja",
      asistencia: "pendiente",
    },
  ],
};

describe("rsvp-guards", () => {
  it("keeps previous state when PATCH response is not an object", () => {
    const merged = mergeGrupoFromPatchResponse(baseGrupo, null);
    expect(merged).toEqual(baseGrupo);
  });

  it("preserves token/email and keeps previous acompanantes when response shape is invalid", () => {
    const merged = mergeGrupoFromPatchResponse(baseGrupo, {
      token: "masked-token",
      invitadoPrincipal: null,
      acompanantes: null,
      asistencia: "confirmado",
    });

    expect(merged.token).toBe(baseGrupo.token);
    expect(merged.invitadoPrincipal.email).toBe(baseGrupo.invitadoPrincipal.email);
    expect(merged.acompanantes).toEqual(baseGrupo.acompanantes);
    expect(merged.asistencia).toBe("confirmado");
  });

  it("keeps previous acompanantes when response array contains invalid items", () => {
    const merged = mergeGrupoFromPatchResponse(baseGrupo, {
      acompanantes: [{ id: "ok-1" }, null],
    });

    expect(merged.acompanantes).toEqual(baseGrupo.acompanantes);
  });

  it("extracts only valid acompanante ids from mixed payloads", () => {
    const ids = getAcompananteIdsFromServer({
      acompanantes: [{ id: "ok-1" }, {}, null, { id: 4 }, { id: "ok-2" }],
    });
    expect(ids).toEqual(["ok-1", "ok-2"]);
  });

  it("counts confirmed members safely even with malformed acompanantes", () => {
    const malformedGrupo = {
      ...baseGrupo,
      invitadoPrincipal: { ...baseGrupo.invitadoPrincipal, asistencia: "confirmado" as const },
      acompanantes: [
        { id: "ok", asistencia: "confirmado" },
        null,
        { id: "x", asistencia: "pendiente" },
      ] as unknown as GrupoInvitados["acompanantes"],
    };

    expect(countConfirmadosSafe(malformedGrupo)).toBe(2);
  });
});
