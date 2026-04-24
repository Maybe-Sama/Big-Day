import { TipoAcompanante } from './invitados';

export type AsistenciaPlano = 'pendiente' | 'confirmado' | 'rechazado';
export type LadoInvitado = 'novia' | 'novio';

export interface AsignacionSilla {
  mesaId: string;
  sillaIndex: number;
  personaId: string; // "grupoId:principal" or "grupoId:acompananteId"
}

export interface NotaInvitado {
  id: string;
  personaId: string;
  texto: string;
  fechaCreacion: string;
}

export interface PlanoMesas {
  asignaciones: AsignacionSilla[];
  notas: NotaInvitado[];
  novioDesdeGrupoId?: string; // first grupoId that belongs to novio's side (all after = novio)
  zoom: number;
  panX: number;
  panY: number;
  ultimaActualizacion: string;
}

export interface PersonaPlano {
  personaId: string;
  nombre: string;
  apellidos: string;
  tipo: 'principal' | TipoAcompanante;
  grupoId: string;
  grupoNombre: string;
  lado: LadoInvitado;
  parejaId?: string;
  parejaVinculada: boolean;
  asistencia: AsistenciaPlano;
  alergias?: string;
  email?: string;
  confirmacionBus?: boolean;
  ubicacionBus?: string;
}
