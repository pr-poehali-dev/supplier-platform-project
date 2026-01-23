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
      className={`p-5 border-2 rounded-xl relative transition-all cursor-pointer backdrop-blur-sm ${
        isSelected
          ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10'
          : 'border-border hover:border-primary/50 bg-card/50 shadow-md hover:shadow-lg'
      }`}
    >
      <div className="absolute top-3 right-3 flex gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1.5 rounded-full hover:bg-primary/20 text-primary transition-all hover:scale-110"
          title="Редактировать объект"
        >
          <Icon name="Pencil" size={16} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 rounded-full hover:bg-destructive/20 text-destructive transition-all hover:scale-110"
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
        <p className="text-sm text-muted-foreground mb-3">{unit.description}</p>
      )}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-foreground">
          <Icon name="Banknote" size={16} className="text-primary" />
          <span className="font-semibold">{unit.base_price.toLocaleString('ru-RU')} ₽</span>
          <span className="text-muted-foreground">/ ночь</span>
        </div>
        <div className="flex items-center gap-2 text-foreground">
          <Icon name="Users" size={16} className="text-primary" />
          <span>До {unit.max_guests} гостей</span>
        </div>
      </div>
    </div>
  );
}