import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { Unit } from './UnitsManagement';

interface UnitCardProps {
  unit: Unit;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function UnitCard({ unit, isSelected, onSelect, onEdit, onDelete }: UnitCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`p-5 border-2 rounded-xl relative transition-all shadow-sm hover:shadow-md cursor-pointer ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-lg'
          : 'border-gray-200 hover:border-blue-300 bg-white'
      }`}
    >
      <div className="absolute top-3 right-3 flex gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1.5 rounded-full hover:bg-blue-100 text-blue-600 transition-colors"
          title="Редактировать объект"
        >
          <Icon name="Pencil" size={16} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 rounded-full hover:bg-red-100 text-red-600 transition-colors"
          title="Удалить объект"
        >
          <Icon name="Trash2" size={16} />
        </button>
      </div>
      <div className="mb-3">
        <h3 className="font-bold text-lg mb-1">{unit.name}</h3>
        <Badge variant="secondary" className="text-xs">
          {unit.type === 'house' ? 'Домик' : unit.type === 'room' ? 'Номер' : 'Баня'}
        </Badge>
      </div>
      {unit.description && (
        <p className="text-sm text-gray-600 mb-3">{unit.description}</p>
      )}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-700">
          <Icon name="Banknote" size={16} />
          <span className="font-semibold">{unit.base_price.toLocaleString('ru-RU')} ₽</span>
          <span className="text-gray-500">/ ночь</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Icon name="Users" size={16} />
          <span>До {unit.max_guests} гостей</span>
        </div>
      </div>
    </div>
  );
}
