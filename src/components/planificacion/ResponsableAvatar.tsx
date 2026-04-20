import { Responsable } from '@/types/planificacion';

const novioImg = '/icono-plan/novio.png';
const noviaImg = '/icono-plan/novia.png';

const AVATARS: Record<'novio' | 'novia', { src: string; label: string }> = {
  novio: { src: novioImg, label: 'Novio' },
  novia: { src: noviaImg, label: 'Novia' },
};

interface ResponsablesListProps {
  responsables: Responsable[];
  size?: 'sm' | 'md';
}

export default function ResponsablesList({ responsables, size = 'sm' }: ResponsablesListProps) {
  if (!responsables || responsables.length === 0) return null;

  const textClass = size === 'sm' ? 'text-xs' : 'text-sm';

  const avatarSize = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {responsables.map((r, idx) => {
        if (r.tipo === 'novio' || r.tipo === 'novia') {
          const avatar = AVATARS[r.tipo];
          return (
            <img
              key={`${r.tipo}-${idx}`}
              src={avatar.src}
              alt={avatar.label}
              title={avatar.label}
              className={`${avatarSize} rounded-full object-cover ring-1 ring-white/20`}
            />
          );
        }
        return (
          <span
            key={`tercero-${idx}-${r.nombre}`}
            className={`inline-block bg-white/10 text-white/70 rounded-full px-2 py-0.5 ${textClass}`}
          >
            {r.nombre}
          </span>
        );
      })}
    </div>
  );
}
