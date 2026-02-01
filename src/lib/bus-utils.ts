import { GrupoInvitados } from '@/types/invitados';
import { BusConfig } from '@/types/bus';

/** Comprueba si un grupo usa un bus concreto (por id, nombre o "Bus #N") */
export function grupoUsaEsteBus(grupo: GrupoInvitados, bus: BusConfig): boolean {
  const ub = grupo.ubicacion_bus?.trim();
  if (!ub) return false;
  const algunoUsaBus =
    grupo.invitadoPrincipal.confirmacion_bus === true ||
    grupo.acompanantes.some(ac => ac.confirmacion_bus === true) ||
    grupo.confirmacion_bus;
  if (!algunoUsaBus) return false;
  return ub === bus.id || ub === bus.nombre || ub === `Bus #${bus.numero}`;
}

/** Cuenta pasajeros confirmados para un bus */
export function contarPasajerosBus(grupos: GrupoInvitados[], bus: BusConfig): number {
  return grupos.reduce((total, grupo) => {
    if (!grupoUsaEsteBus(grupo, bus)) return total;
    let count = 0;
    const usaPrincipal = grupo.invitadoPrincipal.confirmacion_bus ?? grupo.confirmacion_bus;
    if (usaPrincipal) count++;
    grupo.acompanantes.forEach(ac => {
      const usaAc = ac.confirmacion_bus ?? grupo.confirmacion_bus;
      if (usaAc) count++;
    });
    return total + count;
  }, 0);
}
