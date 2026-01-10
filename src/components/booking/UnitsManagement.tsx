import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { getUserSubscription, getSubscriptionLimits, canAddUnit } from '@/utils/subscription';
import { useNavigate } from 'react-router-dom';

export interface Unit {
  id: number;
  name: string;
  type: string;
  description: string;
  base_price: number;
  max_guests: number;
  available_slots?: number;
  total_slots?: number;
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
  const navigate = useNavigate();
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [newUnit, setNewUnit] = useState({
    name: '',
    type: 'house',
    description: '',
    base_price: '',
    max_guests: ''
  });

  const currentPlan = getUserSubscription();
  const limits = getSubscriptionLimits();
  const canAdd = canAddUnit(units.length);

  const handleAddUnit = async () => {
    if (!canAdd) {
      alert(`Достигнут лимит объектов для тарифа ${currentPlan.toUpperCase()}. Улучшите подписку для добавления новых объектов.`);
      return;
    }
    
    await onAddUnit(newUnit);
    setShowAddUnit(false);
    setNewUnit({ name: '', type: 'house', description: '', base_price: '', max_guests: '' });
  };

  const handleAddButtonClick = () => {
    if (!canAdd) {
      if (confirm(`У вас достигнут лимит: ${units.length} из ${limits.maxUnits} объектов.\n\nУлучшить подписку?`)) {
        navigate('/pricing');
      }
      return;
    }
    setShowAddUnit(true);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span>Объекты для бронирования</span>
            <Badge 
              variant="outline" 
              className={`${!canAdd ? 'bg-red-50 text-red-700 border-red-300' : 'bg-green-50 text-green-700 border-green-300'}`}
            >
              {units.length} / {limits.maxUnits === 999 ? '∞' : limits.maxUnits}
            </Badge>
          </div>
          <Dialog open={showAddUnit} onOpenChange={setShowAddUnit}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                onClick={handleAddButtonClick}
                variant={!canAdd ? 'outline' : 'default'}
                className={!canAdd ? 'opacity-60' : ''}
              >
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map((unit) => {
            const availableSlots = unit.available_slots ?? 30;
            const totalSlots = unit.total_slots ?? 30;
            const occupancyPercent = ((totalSlots - availableSlots) / totalSlots) * 100;
            const isLowAvailability = availableSlots < totalSlots * 0.3;
            
            return (
              <div
                key={unit.id}
                className={`p-5 border-2 rounded-xl relative transition-all shadow-sm hover:shadow-md ${
                  selectedUnit?.id === unit.id
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-blue-300 bg-white'
                }`}
              >
                <button
                  onClick={() => onDeleteUnit(unit.id)}
                  className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-red-100 text-red-600 transition-colors"
                >
                  <Icon name="Trash2" size={16} />
                </button>
                
                <div onClick={() => onSelectUnit(unit)} className="cursor-pointer">
                  <div className="flex items-start gap-2 mb-3 pr-8">
                    <div className="mt-1">
                      <Icon 
                        name={unit.type === 'house' ? 'Home' : unit.type === 'bathhouse' ? 'Droplet' : 'DoorClosed'} 
                        size={20} 
                        className="text-blue-600"
                      />
                    </div>
                    <h3 className="font-bold text-lg leading-tight">{unit.name}</h3>
                  </div>
                  
                  {unit.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{unit.description}</p>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-gray-600">
                        <Icon name="Users" size={14} />
                        До {unit.max_guests} гостей
                      </span>
                      <span className="font-bold text-blue-600">
                        {unit.base_price.toLocaleString()} ₽/ночь
                      </span>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Свободно слотов
                        </span>
                        <Badge 
                          variant={isLowAvailability ? "destructive" : "default"}
                          className={isLowAvailability ? "bg-red-500" : "bg-green-500"}
                        >
                          {availableSlots} / {totalSlots}
                        </Badge>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full transition-all ${
                            isLowAvailability ? 'bg-red-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${((totalSlots - occupancyPercent) / totalSlots) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}