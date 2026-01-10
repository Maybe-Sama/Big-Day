export interface MesaConfig {
  id: string;
  nombre: string; // Ej: "Mesa 1", "Mesa Principal", "Mesa VIP"
  capacidad: number; // Número máximo de personas
  ubicacion?: string; // Opcional: "Salón principal", "Terraza", etc.
  capitanId?: string; // Formato: "grupoId:principal" o "grupoId:acompananteId" para identificar al miembro específico
  token?: string; // Token único para acceder a la página de la mesa mediante QR
}

export interface ConfiguracionMesas {
  id: 'config-mesas'; // ID fijo para el único objeto de configuración
  mesas: MesaConfig[];
  fechaActualizacion: string;
}

