import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export interface Unit {
  id: number;
  name: string;
  type: string;
  description: string;
  base_price: number;
  max_guests: number;
}

interface UnitsManagementProps {
  units: Unit[];
  selectedUnit: Unit | null;
  onSelectUnit: (unit: Unit) => void;
  onAddUnit: (unit: { name: string; type: string; description: string; base_price: string; max_guests: string }) => Promise<void>;
  onDeleteUnit: (unitId: number) => Promise<void>;
}

export default function UnitsManagement({
  units,
  selectedUnit,
  onSelectUnit,
  onAddUnit,
  onDeleteUnit
}: UnitsManagementProps) {
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [newUnit, setNewUnit] = useState({
    name: '',
    type: 'house',
    description: '',
    base_price: '',
    max_guests: ''
  });

  const handleAddUnit = async () => {
    await onAddUnit(newUnit);
    setShowAddUnit(false);
    setNewUnit({ name: '', type: 'house', description: '', base_price: '', max_guests: '' });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Объекты для бронирования</span>
          <Dialog open={showAddUnit} onOpenChange={setShowAddUnit}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Icon name="Plus" className="mr-2" size={16} />
                Добавить объект
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Добавить новый объект</DialogTitle>
                <DialogDescription>
                  Создайте новый номер или домик для бронирования
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="unitName">Название *</Label>
                  <Input
                    id="unitName"
                    placeholder="Домик №1"
                    value={newUnit.name}
                    onChange={(e) => setNewUnit({...newUnit, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="unitType">Тип</Label>
                  <select
                    id="unitType"
                    className="w-full p-2 border rounded-md"
                    value={newUnit.type}
                    onChange={(e) => setNewUnit({...newUnit, type: e.target.value})}
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
                    value={newUnit.description}
                    onChange={(e) => setNewUnit({...newUnit, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="unitPrice">Цена за ночь *</Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      placeholder="5000"
                      value={newUnit.base_price}
                      onChange={(e) => setNewUnit({...newUnit, base_price: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="unitGuests">Макс. гостей *</Label>
                    <Input
                      id="unitGuests"
                      type="number"
                      placeholder="4"
                      value={newUnit.max_guests}
                      onChange={(e) => setNewUnit({...newUnit, max_guests: e.target.value})}
                    />
                  </div>
                </div>
                <Button onClick={handleAddUnit} className="w-full">
                  Создать объект
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {units.map((unit) => (
            <div
              key={unit.id}
              className={`p-4 border-2 rounded-lg relative transition-all ${
                selectedUnit?.id === unit.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <button
                onClick={() => onDeleteUnit(unit.id)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-100 text-red-600"
              >
                <Icon name="Trash2" size={16} />
              </button>
              <div onClick={() => onSelectUnit(unit)} className="cursor-pointer">
                <h3 className="font-semibold text-lg pr-8">{unit.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{unit.description}</p>
                <div className="flex justify-between items-center mt-3">
                  <span className="flex items-center gap-1 text-sm">
                    <Icon name="Users" size={14} />
                    До {unit.max_guests} гостей
                  </span>
                  <span className="font-bold text-blue-600">
                    {unit.base_price.toLocaleString()} ₽
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
