import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getUserSubscription, getSubscriptionLimits, canAddUnit } from '@/utils/subscription';
import { useNavigate } from 'react-router-dom';
import UnitCard from './UnitCard';
import UnitDialog from './UnitDialog';

export interface Unit {
  id: number;
  name: string;
  type: string;
  description: string;
  base_price: number;
  max_guests: number;
  available_slots?: number;
  total_slots?: number;
  dynamic_pricing_enabled?: boolean;
  pricing_profile_id?: number;
}

interface UnitsManagementProps {
  units: Unit[];
  selectedUnit: Unit | null;
  onSelectUnit: (unit: Unit) => void;
  onAddUnit: (unit: { name: string; type: string; description: string; base_price: string; max_guests: string }) => Promise<void>;
  onUpdateUnit: (unitId: number, unit: { name: string; type: string; description: string; base_price: string; max_guests: string }) => Promise<void>;
  onDeleteUnit: (unitId: number) => Promise<void>;
}

export default function UnitsManagement({
  units,
  selectedUnit,
  onSelectUnit,
  onAddUnit,
  onUpdateUnit,
  onDeleteUnit
}: UnitsManagementProps) {
  const navigate = useNavigate();
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
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

  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
  };

  const handleUpdateUnit = async () => {
    if (!editingUnit) return;
    
    await onUpdateUnit(editingUnit.id, {
      name: editingUnit.name,
      type: editingUnit.type,
      description: editingUnit.description,
      base_price: editingUnit.base_price.toString(),
      max_guests: editingUnit.max_guests.toString()
    });
    setEditingUnit(null);
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
          <Button 
            size="sm" 
            onClick={handleAddButtonClick}
            variant={!canAdd ? 'outline' : 'default'}
            className={!canAdd ? 'opacity-60' : ''}
          >
            <Icon name="Plus" className="mr-2" size={16} />
            Добавить объект
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              isSelected={selectedUnit?.id === unit.id}
              onSelect={() => onSelectUnit(unit)}
              onEdit={() => handleEditUnit(unit)}
              onDelete={async () => {
                if (confirm(`Удалить объект "${unit.name}"?`)) {
                  await onDeleteUnit(unit.id);
                }
              }}
            />
          ))}
        </div>
      </CardContent>

      <UnitDialog
        open={showAddUnit}
        onOpenChange={setShowAddUnit}
        unit={newUnit}
        onUnitChange={setNewUnit}
        onSave={handleAddUnit}
        title="Добавить новый объект"
        description="Создайте новый номер или домик для бронирования"
      />

      {editingUnit && (
        <UnitDialog
          open={!!editingUnit}
          onOpenChange={(open) => !open && setEditingUnit(null)}
          unit={{
            name: editingUnit.name,
            type: editingUnit.type,
            description: editingUnit.description,
            base_price: editingUnit.base_price.toString(),
            max_guests: editingUnit.max_guests.toString()
          }}
          onUnitChange={(data) => setEditingUnit({ ...editingUnit, ...data, base_price: parseFloat(data.base_price) || 0, max_guests: parseInt(data.max_guests) || 0 })}
          onSave={handleUpdateUnit}
          title="Редактировать объект"
          description="Измените параметры объекта"
        />
      )}
    </Card>
  );
}
