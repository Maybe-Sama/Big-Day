/**
 * Configuración de un bus individual
 */
export interface BusConfig {
  id: string;
  numero: number; // Número del bus (1, 2, 3...)
  /**
   * Etiqueta visible para los invitados.
   * Ejemplos: "Madrid", "Sevilla Centro", "Puerta Jerez"
   */
  nombre?: string;
}

/**
 * Configuración general del sistema de buses
 */
export interface ConfiguracionBuses {
  id: 'config-buses'; // ID único para la configuración
  buses: BusConfig[]; // Lista de buses configurados
  fechaActualizacion: string;
}

