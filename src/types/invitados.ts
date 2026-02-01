export interface Acompanante {
  id: string;
  nombre: string;
  apellidos: string;
  tipo: 'pareja' | 'hijo';
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
