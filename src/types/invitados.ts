/** Tipos de familiar que puede ser un acompañante */
export type TipoAcompanante =
  | 'pareja'
  | 'hijo'
  | 'madre'
  | 'padre'
  | 'hermano'
  | 'hermana'
  | 'abuelo'
  | 'abuela'
  | 'tio'
  | 'tia'
  | 'primo'
  | 'prima'
  | 'otro';

/** Opciones para el dropdown de tipo de acompañante (orden para la UI) */
export const TIPOS_ACOMPANANTE: { value: TipoAcompanante; label: string }[] = [
  { value: 'pareja', label: 'Pareja' },
  { value: 'hijo', label: 'Hijo/a' },
  { value: 'madre', label: 'Madre' },
  { value: 'padre', label: 'Padre' },
  { value: 'hermano', label: 'Hermano' },
  { value: 'hermana', label: 'Hermana' },
  { value: 'abuelo', label: 'Abuelo' },
  { value: 'abuela', label: 'Abuela' },
  { value: 'tio', label: 'Tío' },
  { value: 'tia', label: 'Tía' },
  { value: 'primo', label: 'Primo' },
  { value: 'prima', label: 'Prima' },
  { value: 'otro', label: 'Otro familiar' },
];

export function getTipoAcompananteLabel(tipo: string): string {
  return TIPOS_ACOMPANANTE.find((t) => t.value === tipo)?.label ?? tipo;
}

export interface Acompanante {
  id: string;
  nombre: string;
  apellidos: string;
  tipo: TipoAcompanante;
  edad?: number; // Solo para hijos
  asistencia: 'pendiente' | 'confirmado' | 'rechazado';
  alergias?: string; // Alergias del acompañante
  confirmacion_bus?: boolean; // Si este acompañante usa el bus
}

export interface GrupoInvitados {
  id: string;
  invitadoPrincipal: {
    nombre: string;
    apellidos: string;
    email: string;
    asistencia: 'pendiente' | 'confirmado' | 'rechazado';
    alergias?: string; // Alergias del invitado principal
    confirmacion_bus?: boolean; // Si el invitado principal usa el bus
  };
  acompanantes: Acompanante[];
  token: string;
  asistencia: 'pendiente' | 'confirmado' | 'rechazado';
  fechaCreacion: string;
  fechaActualizacion: string;
  notas?: string;
  // Campos de bus
  confirmacion_bus: boolean; // Si el grupo va a coger el bus
  ubicacion_bus?: string; // Desde qué ubicación/parada del bus
  // Campo de mesa
  mesa?: string; // ID de la mesa asignada
}

export interface InvitadoStats {
  totalGrupos: number;
  totalPersonas: number;
  confirmados: number;
  pendientes: number;
  rechazados: number;
  totalAsistentes: number;
  parejas: number;
  hijos: number;
}
