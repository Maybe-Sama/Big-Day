/**
 * Configuración de paradas de bus
 */
export interface ParadaBus {
  id: string;
  nombre: string;
  ubicacion?: string; // Ubicación opcional de la parada
}

/**
 * Configuración de un bus individual
 */
export interface BusConfig {
  id: string;
  numero: number; // Número del bus (1, 2, 3...)
  nombre?: string; // Nombre opcional del bus (ej: "Bus Madrid", "Bus Barcelona")
  paradas: ParadaBus[]; // Lista de paradas que hará este bus
}

/**
 * Configuración general del sistema de buses
 */
export interface ConfiguracionBuses {
  id: 'config-buses'; // ID único para la configuración
  buses: BusConfig[]; // Lista de buses configurados
  fechaActualizacion: string;
}

