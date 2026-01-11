import { GrupoInvitados, InvitadoStats } from '@/types/invitados';
import { ConfiguracionBuses } from '@/types/bus';
import { ConfiguracionMesas } from '@/types/mesas';
import { CarreraFotos } from '@/types/carrera-fotos';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  private async fetchApi<T>(endpoint: string, options?: RequestInit, requireAuth: boolean = false): Promise<T> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        credentials: requireAuth ? 'include' : 'same-origin', // Incluir cookies en llamadas privadas
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        // Intentar parsear error como JSON
        let errorMessage = 'Error desconocido';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
        } catch {
          // Si no es JSON, usar el status
          if (response.status === 404) {
            errorMessage = 'Token no encontrado';
          } else if (response.status === 401) {
            errorMessage = 'No autorizado';
          } else if (response.status >= 500) {
            errorMessage = 'Servidor no disponible. Reintenta más tarde.';
          } else {
            errorMessage = `Error ${response.status}`;
          }
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error: any) {
      // Si es error de red (fetch falla)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('No se pudo conectar con el servidor. Inténtalo más tarde.');
      }
      // Re-lanzar otros errores
      throw error;
    }
  }

  // ========== GRUPOS DE INVITADOS ==========

  async getAllGrupos(): Promise<GrupoInvitados[]> {
    // Requiere admin key (llamada privada)
    return this.fetchApi<GrupoInvitados[]>('/invitados', undefined, true);
  }

  async getGrupoById(id: string): Promise<GrupoInvitados | null> {
    const grupos = await this.getAllGrupos();
    return grupos.find(g => g.id === id) || null;
  }

  async getGrupoByToken(token: string): Promise<GrupoInvitados | null> {
    try {
      // NO requiere admin key (llamada pública)
      return await this.fetchApi<GrupoInvitados>(`/invitados?token=${encodeURIComponent(token)}`, undefined, false);
    } catch (error: any) {
      if (error.message.includes('404') || error.message.includes('no encontrado')) {
        return null;
      }
      throw error;
    }
  }

  async saveGrupo(grupo: GrupoInvitados): Promise<void> {
    // Requiere admin key (llamada privada)
    await this.fetchApi('/invitados', {
      method: 'POST',
      body: JSON.stringify(grupo),
    }, true);
  }

  async deleteGrupo(id: string): Promise<void> {
    // Requiere admin key (llamada privada)
    await this.fetchApi(`/invitados?id=${id}`, {
      method: 'DELETE',
    }, true);
  }

  async getStats(): Promise<InvitadoStats> {
    const grupos = await this.getAllGrupos();
    
    let totalPersonas = 0;
    let confirmados = 0;
    let pendientes = 0;
    let rechazados = 0;
    let totalAsistentes = 0;
    let parejas = 0;
    let hijos = 0;

    grupos.forEach(grupo => {
      const acompanantesValidos = grupo.acompanantes.filter(ac => ac.nombre && ac.apellidos);
      totalPersonas += 1 + acompanantesValidos.length; // Invitado principal + acompañantes

      if (grupo.asistencia === 'confirmado') {
        confirmados++;
        totalAsistentes += 1 + acompanantesValidos.filter(ac => ac.asistencia === 'confirmado').length;
      } else if (grupo.asistencia === 'rechazado') {
        rechazados++;
      } else {
        pendientes++;
      }

      acompanantesValidos.forEach(ac => {
        if (ac.tipo === 'pareja') parejas++;
        if (ac.tipo === 'hijo') hijos++;
      });
    });

    return {
      totalGrupos: grupos.length,
      totalPersonas,
      confirmados,
      pendientes,
      rechazados,
      totalAsistentes,
      parejas,
      hijos,
    };
  }

  // ========== CONFIGURACIÓN DE BUSES ==========

  async getConfiguracionBuses(): Promise<ConfiguracionBuses | null> {
    try {
      return await this.fetchApi<ConfiguracionBuses>('/config/buses');
    } catch (error: any) {
      if (error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async saveConfiguracionBuses(config: ConfiguracionBuses): Promise<void> {
    // Requiere admin key (llamada privada)
    await this.fetchApi('/config/buses', {
      method: 'POST',
      body: JSON.stringify(config),
    }, true);
  }

  // ========== CONFIGURACIÓN DE MESAS ==========

  async getConfiguracionMesas(): Promise<ConfiguracionMesas | null> {
    try {
      return await this.fetchApi<ConfiguracionMesas>('/config/mesas');
    } catch (error: any) {
      if (error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async saveConfiguracionMesas(config: ConfiguracionMesas): Promise<void> {
    // Requiere admin key (llamada privada)
    await this.fetchApi('/config/mesas', {
      method: 'POST',
      body: JSON.stringify(config),
    }, true);
  }

  // ========== CARRERAS DE FOTOS ==========

  async getAllCarreras(): Promise<CarreraFotos[]> {
    try {
      return await this.fetchApi<CarreraFotos[]>('/carreras') || [];
    } catch (error: any) {
      if (error.message.includes('404')) {
        return [];
      }
      throw error;
    }
  }

  async getCarreraByMesaId(mesaId: string): Promise<CarreraFotos | null> {
    const carreras = await this.getAllCarreras();
    return carreras.find(c => c.mesaId === mesaId) || null;
  }

  async getCarreraByToken(token: string): Promise<CarreraFotos | null> {
    const carreras = await this.getAllCarreras();
    return carreras.find(c => c.token === token) || null;
  }

  async saveCarrera(carrera: CarreraFotos): Promise<void> {
    const carreras = await this.getAllCarreras();
    const index = carreras.findIndex(c => c.id === carrera.id);
    
    if (index >= 0) {
      carreras[index] = carrera;
    } else {
      carreras.push(carrera);
    }

    // Requiere admin key (llamada privada)
    await this.fetchApi('/carreras', {
      method: 'POST',
      body: JSON.stringify(carreras),
    }, true);
  }

  // ========== EXPORT/IMPORT ==========

  async exportData(): Promise<GrupoInvitados[]> {
    return this.getAllGrupos();
  }

  async importData(data: GrupoInvitados[]): Promise<void> {
    // Limpiar datos existentes y importar nuevos
    const grupos = await this.getAllGrupos();
    
    // Eliminar todos los grupos existentes
    for (const grupo of grupos) {
      await this.deleteGrupo(grupo.id);
    }

    // Importar nuevos grupos
    for (const grupo of data) {
      await this.saveGrupo(grupo);
    }
  }
}

export const apiService = new ApiService();

