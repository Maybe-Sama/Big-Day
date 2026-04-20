import { TipoResponsable } from '@/types/planificacion';

const novioImg = '/icono-plan/novio.png';
const noviaImg = '/icono-plan/novia.png';

interface ResponsableAvatarProps {
  tipo?: TipoResponsable;
  nombre: string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const AVATARS: Record<'novio' | 'novia', { src: string; label: string }> = {
  novio: { src: novioImg, label: 'Novio' },
  novia: { src: noviaImg, label: 'Novia' },
};

export default function ResponsableAvatar({ tipo, nombre, size = 'sm', showLabel = true }: ResponsableAvatarProps) {
  if (!tipo && !nombre) return null;

  const sizeClass = size === 'sm' ? 'w-5 h-5' : 'w-7 h-7';
  const textClass = size === 'sm' ? 'text-xs' : 'text-sm';

  if (tipo === 'novio' || tipo === 'novia') {
    const avatar = AVATARS[tipo];
    return (
      <span className="inline-flex items-center gap-1.5 bg-white/10 rounded-full pl-0.5 pr-2 py-0.5">
        <img
          src={avatar.src}
          alt={avatar.label}
          className={`${sizeClass} rounded-full object-cover ring-1 ring-white/20`}
        />
        {showLabel && <span className={`${textClass} text-white/80`}>{avatar.label}</span>}
      </span>
    );
  }

  // tercero o sin tipo definido (legacy)
  return (
    <span className={`inline-block bg-white/10 text-white/70 rounded-full px-2 py-0.5 ${textClass}`}>
      {nombre}
    </span>
  );
}
