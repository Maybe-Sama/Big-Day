import { GrupoInvitados, InvitadoStats } from '@/types/invitados';
import { ConfiguracionBuses } from '@/types/bus';
import { ConfiguracionMesas } from '@/types/mesas';
import { CarreraFotos } from '@/types/carrera-fotos';
import { apiService } from './api-service';

class DatabaseService {
  constructor() {
    console.log('[DatabaseService] Usando API (Redis) para almacenamiento');
  }

  async getAllGrupos(): Promise<GrupoInvitados[]> {
    return await apiService.getAllGrupos();
  }

  async getGrupoById(id: string): Promise<GrupoInvitados | null> {
    return await apiService.getGrupoById(id);
  }

  async getGrupoByToken(token: string): Promise<GrupoInvitados | null> {
    return await apiService.getGrupoByToken(token);
  }

  async saveGrupo(grupo: GrupoInvitados): Promise<void> {
    await apiService.saveGrupo(grupo);
  }

  async deleteGrupo(id: string): Promise<void> {
    await apiService.deleteGrupo(id);
  }

  async reorderGrupos(grupos: GrupoInvitados[]): Promise<void> {
    await apiService.reorderGrupos(grupos);
  }

  async getStats(): Promise<InvitadoStats> {
    const grupos = await this.getAllGrupos();
    
    const stats: InvitadoStats = {
      totalGrupos: grupos.length,
      totalPersonas: 0,
      confirmados: 0,
      pendientes: 0,
      rechazados: 0,
      totalAsistentes: 0,
      parejas: 0,
      hijos: 0,
    };

    grupos.forEach(grupo => {
      // Contar personas en el grupo
      const personasEnGrupo = 1 + grupo.acompanantes.length; // invitado principal + acompañantes
      stats.totalPersonas += personasEnGrupo;

      // Contar asistentes individuales
      let asistentesEnGrupo = 0;
      if (grupo.invitadoPrincipal.asistencia === 'confirmado') {
        asistentesEnGrupo++;
      }
      grupo.acompanantes.forEach(acompanante => {
        if (acompanante.asistencia === 'confirmado') {
          asistentesEnGrupo++;
        }
      });
      stats.totalAsistentes += asistentesEnGrupo;

      // Contar por estado de asistencia del grupo
      if (grupo.asistencia === 'confirmado') {
        stats.confirmados++;
      } else if (grupo.asistencia === 'pendiente') {
        stats.pendientes++;
      } else if (grupo.asistencia === 'rechazado') {
        stats.rechazados++;
      }

      // Contar tipos de acompañantes
      grupo.acompanantes.forEach(acompanante => {
        if (acompanante.tipo === 'pareja') {
          stats.parejas++;
        } else if (acompanante.tipo === 'hijo') {
          stats.hijos++;
        }
      });
    });

    return stats;
  }

  async exportData(): Promise<GrupoInvitados[]> {
    return this.getAllGrupos();
  }

  async importData(data: GrupoInvitados[]): Promise<void> {
    await apiService.importData(data);
  }

  // ========== CONFIGURACIÓN DE BUSES ==========

  async getConfiguracionBuses(): Promise<ConfiguracionBuses | null> {
    return await apiService.getConfiguracionBuses();
  }

  async saveConfiguracionBuses(config: ConfiguracionBuses): Promise<void> {
    await apiService.saveConfiguracionBuses(config);
  }

  // ========== CONFIGURACIÓN DE MESAS ==========

  async getConfiguracionMesas(): Promise<ConfiguracionMesas | null> {
    return await apiService.getConfiguracionMesas();
  }

  async saveConfiguracionMesas(config: ConfiguracionMesas): Promise<void> {
    await apiService.saveConfiguracionMesas(config);
  }

  // ========== CARRERAS DE FOTOS ==========

  async getCarreraByMesaId(mesaId: string): Promise<CarreraFotos | null> {
    return await apiService.getCarreraByMesaId(mesaId);
  }

  async getAllCarreras(): Promise<CarreraFotos[]> {
    return await apiService.getAllCarreras();
  }

  async saveCarrera(carrera: CarreraFotos): Promise<void> {
    // Calcular si ya completaron todas las misiones
    const misionesCompletadas = carrera.fotos.filter(f => f.validada).length;
    const todasCompletadas = misionesCompletadas >= 7;
    
    const carreraActualizada: CarreraFotos = {
      ...carrera,
      completada: todasCompletadas,
      fechaCompletada: todasCompletadas && !carrera.fechaCompletada 
        ? new Date().toISOString() 
        : carrera.fechaCompletada,
    };
    
    await apiService.saveCarrera(carreraActualizada);
  }

  async getCarreraByToken(token: string): Promise<CarreraFotos | null> {
    // Primero obtener el grupo por token para saber qué mesa tiene asignada
    const grupo = await this.getGrupoByToken(token);
    if (!grupo || !grupo.mesa) {
      return null;
    }
    
    // Luego obtener la carrera de esa mesa
    return this.getCarreraByMesaId(grupo.mesa);
  }
}

export const dbService = new DatabaseService();
