import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface UnitFormData {
  name: string;
  type: string;
  description: string;
  base_price: string;
  max_guests: string;
}

interface UnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: UnitFormData;
  onUnitChange: (unit: UnitFormData) => void;
  onSave: () => void;
  title: string;
  description: string;
}

export default function UnitDialog({ open, onOpenChange, unit, onUnitChange, onSave, title, description }: UnitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="unitName">Название *</Label>
            <Input
              id="unitName"
              placeholder="Домик №1"
              value={unit.name}
              onChange={(e) => onUnitChange({ ...unit, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="unitType">Тип</Label>
            <select
              id="unitType"
              className="w-full p-2 border rounded-md"
              value={unit.type}
              onChange={(e) => onUnitChange({ ...unit, type: e.target.value })}
            >
              <option value="house">Домик</option>
              <option value="room">Номер</option>
              <option value="bathhouse">Баня</option>
            </select>
          </div>
          <div>
            <Label htmlFor="unitDescription">Описание</Label>
            <Input
              id="unitDescription"
              placeholder="2 спальни, кухня, терраса"
              value={unit.description}
              onChange={(e) => onUnitChange({ ...unit, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unitPrice">Цена за ночь *</Label>
              <Input
                id="unitPrice"
                type="number"
                placeholder="5000"
                value={unit.base_price}
                onChange={(e) => onUnitChange({ ...unit, base_price: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="unitGuests">Макс. гостей *</Label>
              <Input
                id="unitGuests"
                type="number"
                placeholder="4"
                value={unit.max_guests}
                onChange={(e) => onUnitChange({ ...unit, max_guests: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={onSave} className="w-full">
            Сохранить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
