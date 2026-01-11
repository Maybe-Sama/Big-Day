import { GrupoInvitados, InvitadoStats } from '@/types/invitados';
import { ConfiguracionBuses } from '@/types/bus';
import { ConfiguracionMesas } from '@/types/mesas';
import { CarreraFotos } from '@/types/carrera-fotos';
import { apiService } from './api-service';

const DB_NAME = 'forever-forms-db';
const DB_VERSION = 5; // Incrementado para añadir carreras de fotos
const STORE_NAME = 'grupos-invitados';
const CONFIG_STORE_NAME = 'configuracion-buses';
const MESAS_STORE_NAME = 'configuracion-mesas';
const CARRERAS_STORE_NAME = 'carreras-fotos';

class DatabaseService {
  private db: IDBDatabase | null = null;
  private useApi: boolean = false;
  
  constructor() {
    // En producción, usar API. En desarrollo, usar IndexedDB como fallback
    // Pero si VITE_USE_API está configurado, forzar el uso de API
    this.useApi = import.meta.env.PROD || import.meta.env.VITE_USE_API === 'true';
    
    if (this.useApi) {
      console.log('[DatabaseService] Usando API (Redis) para almacenamiento');
    } else {
      console.log('[DatabaseService] Usando IndexedDB local para almacenamiento');
    }
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;
        
        // Crear o actualizar store de grupos
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          // Crear el store si no existe
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('email', 'invitadoPrincipal.email', { unique: false });
          store.createIndex('token', 'token', { unique: true });
          store.createIndex('asistencia', 'asistencia', { unique: false });
          store.createIndex('confirmacion_bus', 'confirmacion_bus', { unique: false });
        } else if (oldVersion < 2) {
          // Migración de versión 1 a 2: añadir índices para bus
          const transaction = (event.target as IDBOpenDBRequest).transaction;
          if (transaction) {
            const store = transaction.objectStore(STORE_NAME);
            // Añadir índice para confirmacion_bus si no existe
            if (!store.indexNames.contains('confirmacion_bus')) {
              store.createIndex('confirmacion_bus', 'confirmacion_bus', { unique: false });
            }
          }
        }
        
        // Crear store de configuración de buses (versión 3)
        if (!db.objectStoreNames.contains(CONFIG_STORE_NAME)) {
          const configStore = db.createObjectStore(CONFIG_STORE_NAME, { keyPath: 'id' });
          // No necesitamos índices adicionales para la configuración
        }
        
        // Crear store de configuración de mesas (versión 4)
        if (!db.objectStoreNames.contains(MESAS_STORE_NAME)) {
          const mesasStore = db.createObjectStore(MESAS_STORE_NAME, { keyPath: 'id' });
          // No necesitamos índices adicionales para la configuración
        }
        
        // Crear store de carreras de fotos (versión 5)
        if (!db.objectStoreNames.contains(CARRERAS_STORE_NAME)) {
          const carrerasStore = db.createObjectStore(CARRERAS_STORE_NAME, { keyPath: 'mesaId' });
          carrerasStore.createIndex('completada', 'completada', { unique: false });
        }
      };
    });
  }

  /**
   * Migra un grupo antiguo a la nueva estructura con campos de alergias, bus y mesa
   */
  private migrateGrupo(grupo: any): GrupoInvitados {
    return {
      ...grupo,
      invitadoPrincipal: {
        ...grupo.invitadoPrincipal,
        alergias: grupo.invitadoPrincipal?.alergias || undefined,
      },
      acompanantes: grupo.acompanantes?.map((ac: any) => ({
        ...ac,
        alergias: ac.alergias || undefined,
      })) || [],
      confirmacion_bus: grupo.confirmacion_bus !== undefined ? grupo.confirmacion_bus : false,
      ubicacion_bus: grupo.ubicacion_bus || undefined,
      parada_bus: grupo.parada_bus || undefined,
      mesa: grupo.mesa || undefined,
    };
  }

  async getAllGrupos(): Promise<GrupoInvitados[]> {
    if (this.useApi) {
      try {
        return await apiService.getAllGrupos();
      } catch (error) {
        console.warn('Error usando API, fallback a IndexedDB:', error);
        this.useApi = false;
      }
    }
    
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const grupos = request.result.map(grupo => this.migrateGrupo(grupo));
        resolve(grupos);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getGrupoById(id: string): Promise<GrupoInvitados | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const grupo = request.result;
        resolve(grupo ? this.migrateGrupo(grupo) : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getGrupoByToken(token: string): Promise<GrupoInvitados | null> {
    if (this.useApi) {
      try {
        return await apiService.getGrupoByToken(token);
      } catch (error) {
        console.warn('Error usando API, fallback a IndexedDB:', error);
        this.useApi = false;
      }
    }
    
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('token');
      const request = index.get(token);

      request.onsuccess = () => {
        const grupo = request.result;
        resolve(grupo ? this.migrateGrupo(grupo) : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveGrupo(grupo: GrupoInvitados): Promise<void> {
    if (this.useApi) {
      try {
        await apiService.saveGrupo(grupo);
        return;
      } catch (error) {
        console.warn('Error usando API, fallback a IndexedDB:', error);
        this.useApi = false;
      }
    }
    
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(grupo);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        transaction.onerror = () => reject(transaction.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  async deleteGrupo(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
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
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // Limpiar datos existentes
      store.clear();
      
      // Importar nuevos datos
      let completed = 0;
      data.forEach(grupo => {
        const request = store.add(grupo);
        request.onsuccess = () => {
          completed++;
          if (completed === data.length) {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  // ========== CONFIGURACIÓN DE BUSES ==========

  async getConfiguracionBuses(): Promise<ConfiguracionBuses | null> {
    if (this.useApi) {
      try {
        return await apiService.getConfiguracionBuses();
      } catch (error) {
        console.warn('Error usando API, fallback a IndexedDB:', error);
        this.useApi = false;
      }
    }
    
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CONFIG_STORE_NAME], 'readonly');
      const store = transaction.objectStore(CONFIG_STORE_NAME);
      const request = store.get('config-buses');

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveConfiguracionBuses(config: ConfiguracionBuses): Promise<void> {
    if (this.useApi) {
      try {
        await apiService.saveConfiguracionBuses(config);
        return;
      } catch (error) {
        console.warn('Error usando API, fallback a IndexedDB:', error);
        this.useApi = false;
      }
    }
    
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CONFIG_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(CONFIG_STORE_NAME);
      const request = store.put({
        ...config,
        fechaActualizacion: new Date().toISOString(),
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ========== CONFIGURACIÓN DE MESAS ==========

  async getConfiguracionMesas(): Promise<ConfiguracionMesas | null> {
    if (this.useApi) {
      try {
        return await apiService.getConfiguracionMesas();
      } catch (error) {
        console.warn('Error usando API, fallback a IndexedDB:', error);
        this.useApi = false;
      }
    }
    
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MESAS_STORE_NAME], 'readonly');
      const store = transaction.objectStore(MESAS_STORE_NAME);
      const request = store.get('config-mesas');

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveConfiguracionMesas(config: ConfiguracionMesas): Promise<void> {
    if (this.useApi) {
      try {
        await apiService.saveConfiguracionMesas(config);
        return;
      } catch (error) {
        console.warn('Error usando API, fallback a IndexedDB:', error);
        this.useApi = false;
      }
    }
    
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MESAS_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(MESAS_STORE_NAME);
      const request = store.put({
        ...config,
        fechaActualizacion: new Date().toISOString(),
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ========== CARRERAS DE FOTOS ==========

  async getCarreraByMesaId(mesaId: string): Promise<CarreraFotos | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CARRERAS_STORE_NAME], 'readonly');
      const store = transaction.objectStore(CARRERAS_STORE_NAME);
      const request = store.get(mesaId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllCarreras(): Promise<CarreraFotos[]> {
    if (this.useApi) {
      try {
        return await apiService.getAllCarreras();
      } catch (error) {
        console.warn('Error usando API, fallback a IndexedDB:', error);
        this.useApi = false;
      }
    }
    
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CARRERAS_STORE_NAME], 'readonly');
      const store = transaction.objectStore(CARRERAS_STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async saveCarrera(carrera: CarreraFotos): Promise<void> {
    if (this.useApi) {
      try {
        await apiService.saveCarrera(carrera);
        return;
      } catch (error) {
        console.warn('Error usando API, fallback a IndexedDB:', error);
        this.useApi = false;
      }
    }
    
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CARRERAS_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(CARRERAS_STORE_NAME);
      
      // Verificar si ya completaron todas las misiones
      const misionesCompletadas = carrera.fotos.filter(f => f.validada).length;
      const todasCompletadas = misionesCompletadas >= 7;
      
      const carreraActualizada: CarreraFotos = {
        ...carrera,
        completada: todasCompletadas,
        fechaCompletada: todasCompletadas && !carrera.fechaCompletada 
          ? new Date().toISOString() 
          : carrera.fechaCompletada,
      };
      
      const request = store.put(carreraActualizada);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
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
