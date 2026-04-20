export type ColumnaKanban = 'todo' | 'in_progress' | 'done';

export type TipoResponsable = 'novio' | 'novia' | 'tercero';

export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  responsable: string;
  responsableTipo?: TipoResponsable;
  columna: ColumnaKanban;
  orden: number;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export type EstadoPago = 'sin_pagar' | 'senal_pagada' | 'pagado_completo';

export interface CategoriaPresupuesto {
  id: string;
  nombre: string;
  costeEstimado: number;
  estadoPago: EstadoPago;
  cantidadPagada: number;
  fechaUltimoPago: string | null;
  notas: string;
  esCubierto: boolean;
  precioPorCubierto: number | null;
  orden: number;
}

export const COLUMNAS_CONFIG: Record<ColumnaKanban, { label: string; color: string }> = {
  todo: { label: 'Por hacer', color: 'bg-slate-500/20 border-slate-500/40' },
  in_progress: { label: 'En progreso', color: 'bg-blue-500/20 border-blue-500/40' },
  done: { label: 'Hecho', color: 'bg-green-500/20 border-green-500/40' },
};

export const ESTADO_PAGO_CONFIG: Record<EstadoPago, { label: string; color: string }> = {
  sin_pagar: { label: 'Sin pagar', color: 'bg-red-500/20 text-red-300 border-red-500/40' },
  senal_pagada: { label: 'Señal pagada', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
  pagado_completo: { label: 'Pagado', color: 'bg-green-500/20 text-green-300 border-green-500/40' },
};
