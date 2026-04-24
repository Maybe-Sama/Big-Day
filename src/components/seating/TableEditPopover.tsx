import { useState } from 'react';
import { useSeatingEditor } from './SeatingEditorProvider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Trash2, RotateCw } from 'lucide-react';

interface Props {
  mesaId: string;
  children: React.ReactNode;
}

export function TableEditPopover({ mesaId, children }: Props) {
  const { mesas, updateTable, deleteTable } = useSeatingEditor();
  const mesa = mesas.find(m => m.id === mesaId);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!mesa) return <>{children}</>;

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" side="right">
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Nombre</Label>
            <Input
              value={mesa.nombre}
              onChange={(e) => updateTable(mesaId, { nombre: e.target.value })}
              className="h-8 text-sm mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Capacidad</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={mesa.capacidad}
              onChange={(e) => updateTable(mesaId, { capacidad: parseInt(e.target.value) || 1 })}
              className="h-8 text-sm mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Forma</Label>
            <div className="flex gap-2 mt-1">
              <Button
                variant={mesa.forma === 'poligonal' || !mesa.forma ? 'default' : 'outline'}
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => updateTable(mesaId, { forma: 'poligonal' })}
              >
                Poligonal
              </Button>
              <Button
                variant={mesa.forma === 'rectangular' ? 'default' : 'outline'}
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => updateTable(mesaId, { forma: 'rectangular' })}
              >
                Rectangular
              </Button>
            </div>
          </div>

          {/* Rotation - only for rectangular */}
          {mesa.forma === 'rectangular' && (
            <div>
              <Label className="text-xs">Orientacion</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  variant={!mesa.rotacion ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => updateTable(mesaId, { rotacion: 0 })}
                >
                  Horizontal
                </Button>
                <Button
                  variant={mesa.rotacion === 90 ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => updateTable(mesaId, { rotacion: 90 })}
                >
                  Vertical
                </Button>
              </div>
            </div>
          )}

          <hr />

          {!confirmDelete ? (
            <Button
              variant="destructive"
              size="sm"
              className="w-full h-8 text-xs"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Eliminar mesa
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => deleteTable(mesaId)}
              >
                Confirmar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => setConfirmDelete(false)}
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
