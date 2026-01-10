export interface MisionFoto {
  id: number; // 1-20
  titulo: string;
  descripcion: string;
  categoria: 'emociones' | 'personajes' | 'accion' | 'objetos';
}

export interface FotoMision {
  id: string; // ID único de la foto
  misionId: number; // ID de la misión (1-20)
  url: string; // URL de la foto subida
  nombreInvitado: string; // Quién subió la foto
  fechaSubida: string; // ISO string
  validada: boolean; // Si los novios la han validado
}

export interface CarreraFotos {
  mesaId: string; // ID de la mesa
  misiones: number[]; // Array de 7 IDs de misiones asignadas (1-20)
  fotos: FotoMision[]; // Fotos subidas
  fechaInicio?: string; // Cuándo empezó la carrera
  fechaCompletada?: string; // Cuándo completaron las 7 misiones
  completada: boolean; // Si ya completaron todas las misiones
}

export const TODAS_LAS_MISIONES: MisionFoto[] = [
  // I. Misiones de Emociones y Sentimientos
  {
    id: 1,
    titulo: "La foto que demuestre el mayor amor (aparte de los novios)",
    descripcion: "Captura a una pareja de abuelos o una pareja besándose apasionadamente.",
    categoria: 'emociones'
  },
  {
    id: 2,
    titulo: "La lágrima de felicidad más sincera",
    descripcion: "Busca un invitado emocionado durante la ceremonia o un discurso.",
    categoria: 'emociones'
  },
  {
    id: 3,
    titulo: "Alguien riendo a carcajadas (¡sin saber que lo están fotografiando!)",
    descripcion: "La risa \"robada\" o espontánea.",
    categoria: 'emociones'
  },
  {
    id: 4,
    titulo: "El abrazo más fuerte del día",
    descripcion: "Busca el abrazo de un padre/madre, o el de dos viejos amigos.",
    categoria: 'emociones'
  },
  {
    id: 5,
    titulo: "Un gesto de puro alivio",
    descripcion: "El novio o la novia justo después de decir \"Sí, quiero\".",
    categoria: 'emociones'
  },
  // II. Misiones de Personajes y Grupos
  {
    id: 6,
    titulo: "Foto con el invitado más alto y el más bajo",
    descripcion: "Que posen juntos para un contraste épico.",
    categoria: 'personajes'
  },
  {
    id: 7,
    titulo: "Selfie con la Madrina / el Padrino",
    descripcion: "Muestra tu aprecio por el acompañante de honor.",
    categoria: 'personajes'
  },
  {
    id: 8,
    titulo: "El grupo de amigos más antiguo de los novios",
    descripcion: "Foto con amigos que se conocen desde la infancia o la universidad.",
    categoria: 'personajes'
  },
  {
    id: 9,
    titulo: "Una foto con alguien que no conocías antes de hoy",
    descripcion: "¡Rompe el hielo y haz un nuevo amigo!",
    categoria: 'personajes'
  },
  {
    id: 10,
    titulo: "Los novios, pero solo se ve la sombra o el reflejo",
    descripcion: "Foto artística de los protagonistas.",
    categoria: 'personajes'
  },
  // III. Misiones de Acción y Movimiento
  {
    id: 11,
    titulo: "El mejor paso de baile de la noche",
    descripcion: "Captura a alguien haciendo una pirueta o un movimiento ridículo.",
    categoria: 'accion'
  },
  {
    id: 12,
    titulo: "Un grupo de personas haciendo el tren de la conga",
    descripcion: "¡La foto de la fiesta!",
    categoria: 'accion'
  },
  {
    id: 13,
    titulo: "La mejor foto de un salto o un \"vuelo\"",
    descripcion: "Un invitado saltando en la pista de baile.",
    categoria: 'accion'
  },
  {
    id: 14,
    titulo: "Una foto en el aire de las alianzas o del ramo",
    descripcion: "Captura el momento exacto del lanzamiento del ramo o una toma de las alianzas en la mano de alguien.",
    categoria: 'accion'
  },
  {
    id: 15,
    titulo: "La persona que está comiendo con más gusto",
    descripcion: "El disfrute absoluto del menú.",
    categoria: 'accion'
  },
  // IV. Misiones de Objetos y Detalles
  {
    id: 16,
    titulo: "Un detalle de la decoración que nadie más haya notado",
    descripcion: "Un centro de mesa original, una flor específica, un letrero.",
    categoria: 'objetos'
  },
  {
    id: 17,
    titulo: "Un calcetín o unos zapatos ridículamente geniales",
    descripcion: "Los accesorios más inesperados del atuendo de un invitado.",
    categoria: 'objetos'
  },
  {
    id: 18,
    titulo: "Alguien reponiendo su bebida",
    descripcion: "Foto cerca de la barra o del camarero.",
    categoria: 'objetos'
  },
  {
    id: 19,
    titulo: "Algo que tenga el color de la corbata del novio (o el ramo de la novia)",
    descripcion: "Encuentra y fotografía algo que haga match.",
    categoria: 'objetos'
  },
  {
    id: 20,
    titulo: "Un niño o niña jugando felizmente",
    descripcion: "Los más pequeños en acción.",
    categoria: 'objetos'
  },
];

/**
 * Selecciona aleatoriamente 7 misiones de las 20 disponibles
 */
export const seleccionarMisionesAleatorias = (): number[] => {
  const todas = TODAS_LAS_MISIONES.map(m => m.id);
  const seleccionadas: number[] = [];
  
  // Mezclar array
  const mezcladas = [...todas].sort(() => Math.random() - 0.5);
  
  // Seleccionar 7
  for (let i = 0; i < 7; i++) {
    seleccionadas.push(mezcladas[i]);
  }
  
  return seleccionadas.sort((a, b) => a - b);
};

