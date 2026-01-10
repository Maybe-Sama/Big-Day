import { dbService } from './database';

export const generateToken = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

export const validateToken = async (token: string): Promise<boolean> => {
  try {
    await dbService.init();
    const grupo = await dbService.getGrupoByToken(token);
    return !!grupo;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

export const getInvitadoByToken = async (token: string) => {
  try {
    await dbService.init();
    const grupo = await dbService.getGrupoByToken(token);
    return grupo;
  } catch (error) {
    console.error('Error getting invitado:', error);
    return null;
  }
};
