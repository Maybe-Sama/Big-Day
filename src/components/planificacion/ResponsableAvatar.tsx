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

  const sizeClass = size === 'sm' ? 'w-5 h-5' : 'w-7 h-7';
  const textClass = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {responsables.map((r, idx) => {
        if (r.tipo === 'novio' || r.tipo === 'novia') {
          const avatar = AVATARS[r.tipo];
          return (
            <span
              key={`${r.tipo}-${idx}`}
              className="inline-flex items-center gap-1.5 bg-white/10 rounded-full pl-0.5 pr-2 py-0.5"
            >
              <img
                src={avatar.src}
                alt={avatar.label}
                className={`${sizeClass} rounded-full object-cover ring-1 ring-white/20`}
              />
              <span className={`${textClass} text-white/80`}>{avatar.label}</span>
            </span>
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
