import { dbService } from './database';

export const clearAllData = async (): Promise<void> => {
  try {
    await dbService.init();
    const grupos = await dbService.getAllGrupos();
    
    // Eliminar todos los grupos
    for (const grupo of grupos) {
      await dbService.deleteGrupo(grupo.id);
    }
    
    console.log('Base de datos limpiada completamente');
  } catch (error) {
    console.error('Error limpiando la base de datos:', error);
    throw error;
  }
};
