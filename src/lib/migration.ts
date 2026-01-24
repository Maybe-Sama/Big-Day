import { GrupoInvitados } from '@/types/invitados';
import { dbService } from './database';
import { generateToken } from './tokens';

interface OldInvitado {
  id: number;
  nombre: string;
  email: string;
  pareja: boolean;
  hijos: number;
  token: string;
  asistencia: 'pendiente' | 'confirmado' | 'rechazado';
  acompanantes: number;
}

export const migrateOldData = async (): Promise<void> => {
  try {
    // Verificar si ya hay datos en la nueva base de datos
    const existingGrupos = await dbService.getAllGrupos();
    if (existingGrupos.length > 0) {
      console.log('Los datos ya han sido migrados');
      return;
    }

    // Intentar cargar datos del JSON de ejemplo (opcional)
    let oldData: OldInvitado[] = [];
    try {
      const response = await fetch('/data/invitados-ejemplo.json');
      oldData = await response.json();
    } catch (error) {
      console.log('No se encontró archivo JSON de ejemplo para migrar');
      return;
    }

    // Convertir datos antiguos al nuevo formato
    const newGrupos: GrupoInvitados[] = oldData.map((oldInvitado) => {
      const acompanantes = [];
      
      // Si tenía pareja, crear un acompañante de tipo pareja
      if (oldInvitado.pareja) {
        acompanantes.push({
          id: `${oldInvitado.id}-pareja`,
          nombre: 'Pareja',
          apellidos: 'de ' + oldInvitado.nombre.split(' ')[0],
          tipo: 'pareja' as const,
        });
      }

      // Si tenía hijos, crear acompañantes de tipo hijo
      for (let i = 0; i < oldInvitado.hijos; i++) {
        acompanantes.push({
          id: `${oldInvitado.id}-hijo-${i + 1}`,
          nombre: `Hijo ${i + 1}`,
          apellidos: oldInvitado.nombre.split(' ').slice(1).join(' '),
          tipo: 'hijo' as const,
          edad: 5 + i * 2, // Edad estimada
        });
      }

      // Separar nombre y apellidos del invitado principal
      const nombreCompleto = oldInvitado.nombre.split(' ');
      const nombre = nombreCompleto[0];
      const apellidos = nombreCompleto.slice(1).join(' ') || 'Sin apellidos';

      return {
        id: oldInvitado.id.toString(),
        invitadoPrincipal: {
          nombre,
          apellidos,
          email: oldInvitado.email,
          asistencia: oldInvitado.asistencia,
          alergias: undefined, // Sin alergias por defecto
        },
        acompanantes: acompanantes.map(ac => ({
          ...ac,
          asistencia: 'pendiente' as const, // Por defecto pendiente para acompañantes migrados
          alergias: undefined, // Sin alergias por defecto
        })),
        token: oldInvitado.token,
        asistencia: oldInvitado.asistencia,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        notas: `Migrado desde datos antiguos. Acompañantes originales: ${oldInvitado.acompanantes}`,
        confirmacion_bus: false, // Por defecto no usan bus
        ubicacion_bus: undefined,
        mesa: undefined, // Sin mesa asignada por defecto
      };
    });

    // Guardar en la nueva base de datos
    for (const grupo of newGrupos) {
      await dbService.saveGrupo(grupo);
    }

    console.log(`Migración completada: ${newGrupos.length} grupos migrados`);
  } catch (error) {
    console.error('Error durante la migración:', error);
    throw error;
  }
};

export const clearDatabase = async (): Promise<void> => {
  try {
    const grupos = await dbService.getAllGrupos();
    for (const grupo of grupos) {
      await dbService.deleteGrupo(grupo.id);
    }
    console.log('Base de datos limpiada');
  } catch (error) {
    console.error('Error limpiando la base de datos:', error);
    throw error;
  }
};
