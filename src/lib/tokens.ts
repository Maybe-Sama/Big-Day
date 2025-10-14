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
    const response = await fetch('/data/invitados.json');
    const invitados = await response.json();
    return invitados.some((inv: any) => inv.token === token);
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

export const getInvitadoByToken = async (token: string) => {
  try {
    const response = await fetch('/data/invitados.json');
    const invitados = await response.json();
    return invitados.find((inv: any) => inv.token === token);
  } catch (error) {
    console.error('Error getting invitado:', error);
    return null;
  }
};
