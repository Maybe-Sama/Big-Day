import { TipoAcompanante } from './invitados';

export type AsistenciaPlano = 'pendiente' | 'confirmado' | 'rechazado';

export interface AsignacionSilla {
  mesaId: string;
  sillaIndex: number;
  personaId: string; // "grupoId:principal" or "grupoId:acompananteId"
}

export interface PlanoMesas {
  asignaciones: AsignacionSilla[];
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
  parejaId?: string;
  parejaVinculada: boolean;
  asistencia: AsistenciaPlano;
  alergias?: string;
  email?: string;
  confirmacionBus?: boolean;
  ubicacionBus?: string;
}
