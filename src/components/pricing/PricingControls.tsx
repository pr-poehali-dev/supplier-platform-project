import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface PricingControlsProps {
  dynamicEnabled: boolean;
  loading: boolean;
  isEditing: boolean;
  minPrice: string;
  maxPrice: string;
  onToggle: (enabled: boolean) => void;
  onEnableAll: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  hasSelectedUnit: boolean;
}

export default function PricingControls({
  dynamicEnabled,
  loading,
  isEditing,
  minPrice,
  maxPrice,
  onToggle,
  onEnableAll,
  onEdit,
  onSave,
  onCancel,
  onMinPriceChange,
  onMaxPriceChange,
  hasSelectedUnit
}: PricingControlsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-semibold text-gray-700">Управление ценами</h4>
        <Button onClick={onEnableAll} variant="outline" size="sm" disabled={loading}>
          <Icon name="CheckCircle" size={16} className="mr-2" />
          Включить для всех
        </Button>
      </div>
        {hasSelectedUnit ? (
          <>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <Label>Включить для этого объекта</Label>
                <p className="text-sm text-gray-600">Цены будут корректироваться по правилам</p>
              </div>
              <Switch
                checked={dynamicEnabled}
                onCheckedChange={onToggle}
                disabled={loading}
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Label>Ценовые рамки</Label>
                  <p className="text-sm text-gray-600">Цена не выйдет за эти пределы</p>
                </div>
                {!isEditing && (
                  <Button onClick={onEdit} variant="outline" size="sm">
                    <Icon name="Edit" size={16} className="mr-2" />
                    Изменить
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Минимальная цена</Label>
                      <Input
                        type="number"
                        value={minPrice}
                        onChange={(e) => onMinPriceChange(e.target.value)}
                        placeholder="1000"
                      />
                    </div>
                    <div>
                      <Label>Максимальная цена</Label>
                      <Input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => onMaxPriceChange(e.target.value)}
                        placeholder="20000"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={onSave} disabled={loading} className="flex-1">
                      Сохранить
                    </Button>
                    <Button onClick={onCancel} variant="outline" className="flex-1">
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Минимум</p>
                    <p className="text-lg font-bold">{minPrice} ₽</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Максимум</p>
                    <p className="text-lg font-bold">{maxPrice} ₽</p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-center py-4">Выберите объект для настройки</p>
        )}
    </div>
  );
}