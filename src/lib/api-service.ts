import { GrupoInvitados, InvitadoStats } from '@/types/invitados';
import { ConfiguracionBuses } from '@/types/bus';
import { ConfiguracionMesas } from '@/types/mesas';
import { CarreraFotos } from '@/types/carrera-fotos';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  private async fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // ========== GRUPOS DE INVITADOS ==========

  async getAllGrupos(): Promise<GrupoInvitados[]> {
    return this.fetchApi<GrupoInvitados[]>('/invitados');
  }

  async getGrupoById(id: string): Promise<GrupoInvitados | null> {
    const grupos = await this.getAllGrupos();
    return grupos.find(g => g.id === id) || null;
  }

  async getGrupoByToken(token: string): Promise<GrupoInvitados | null> {
    try {
      return await this.fetchApi<GrupoInvitados>(`/invitados/${token}`);
    } catch (error: any) {
      if (error.message.includes('404') || error.message.includes('no encontrado')) {
        return null;
      }
      throw error;
    }
  }

  async saveGrupo(grupo: GrupoInvitados): Promise<void> {
    await this.fetchApi('/invitados', {
      method: 'POST',
      body: JSON.stringify(grupo),
    });
  }

  async deleteGrupo(id: string): Promise<void> {
    await this.fetchApi(`/invitados?id=${id}`, {
      method: 'DELETE',
    });
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
    await this.fetchApi('/config/buses', {
      method: 'POST',
      body: JSON.stringify(config),
    });
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
    await this.fetchApi('/config/mesas', {
      method: 'POST',
      body: JSON.stringify(config),
    });
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

    await this.fetchApi('/carreras', {
      method: 'POST',
      body: JSON.stringify(carreras),
    });
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

