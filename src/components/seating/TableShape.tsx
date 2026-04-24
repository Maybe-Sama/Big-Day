interface Props {
  forma: 'poligonal' | 'rectangular';
  width: number;
  height: number;
  nombre: string;
  occupiedCount: number;
  capacidad: number;
  isSelected: boolean;
}

export function TableShape({ forma, width, height, nombre, occupiedCount, capacidad, isSelected }: Props) {
  const selectedClass = isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : '';

  if (forma === 'poligonal') {
    return (
      <div
        className={`flex items-center justify-center flex-col rounded-full bg-accent/30 border-2 border-primary/40 hover:border-primary/70 transition-colors ${selectedClass}`}
        style={{ width, height }}
      >
        <span className="text-xs font-semibold text-foreground truncate max-w-[90%] text-center leading-tight">{nombre}</span>
        <span className="text-[10px] text-muted-foreground">{occupiedCount}/{capacidad}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center flex-col rounded-lg bg-accent/30 border-2 border-primary/40 hover:border-primary/70 transition-colors ${selectedClass}`}
      style={{ width, height }}
    >
      <span className="text-xs font-semibold text-foreground truncate max-w-[90%] text-center leading-tight">{nombre}</span>
      <span className="text-[10px] text-muted-foreground">{occupiedCount}/{capacidad}</span>
    </div>
  );
}
