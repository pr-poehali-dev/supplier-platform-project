import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PricingRule {
  id?: number;
  name: string;
  condition_type: 'occupancy' | 'days_before' | 'day_of_week';
  condition_operator: string;
  condition_value: any;
  action_type: 'increase' | 'decrease' | 'set';
  action_value: number;
  action_unit: 'percent' | 'fixed';
  priority: number;
  enabled: boolean;
}

interface RuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: Partial<PricingRule> | null;
  onRuleChange: (rule: Partial<PricingRule>) => void;
  onSave: () => void;
  loading: boolean;
}

export default function RuleDialog({ open, onOpenChange, rule, onRuleChange, onSave, loading }: RuleDialogProps) {
  if (!rule) return null;

  const renderConditionEditor = () => {
    switch (rule.condition_type) {
      case 'occupancy':
        return (
          <div className="space-y-2">
            <Label>Порог загрузки (%)</Label>
            <Input
              type="number"
              value={rule.condition_value?.threshold || 0}
              onChange={(e) => onRuleChange({
                ...rule,
                condition_value: { threshold: parseInt(e.target.value) }
              })}
              placeholder="70"
            />
          </div>
        );

      case 'days_before':
        return (
          <div className="space-y-3">
            <div>
              <Label>Количество дней до заезда</Label>
              <Input
                type="number"
                value={rule.condition_value?.days || 0}
                onChange={(e) => onRuleChange({
                  ...rule,
                  condition_value: {
                    ...rule.condition_value,
                    days: parseInt(e.target.value)
                  }
                })}
                placeholder="5"
              />
            </div>
            <div>
              <Label>Макс. загрузка для применения (%)</Label>
              <Input
                type="number"
                value={rule.condition_value?.occupancy_max || 100}
                onChange={(e) => onRuleChange({
                  ...rule,
                  condition_value: {
                    ...rule.condition_value,
                    occupancy_max: parseInt(e.target.value)
                  }
                })}
                placeholder="40"
              />
            </div>
          </div>
        );

      case 'day_of_week':
        return (
          <div className="space-y-2">
            <Label>Дни недели (0=ВС, 6=СБ)</Label>
            <Input
              type="text"
              value={rule.condition_value?.days?.join(',') || ''}
              onChange={(e) => onRuleChange({
                ...rule,
                condition_value: {
                  days: e.target.value.split(',').map(d => parseInt(d.trim())).filter(n => !isNaN(n))
                }
              })}
              placeholder="5,6"
            />
            <p className="text-xs text-gray-500">Введите номера дней через запятую</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule.id ? 'Редактирование' : 'Создание'} правила</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Название правила</Label>
            <Input
              value={rule.name || ''}
              onChange={(e) => onRuleChange({ ...rule, name: e.target.value })}
              placeholder="Высокий спрос - повышение цены"
            />
          </div>

          <div>
            <Label>Условие применения</Label>
            <Select
              value={rule.condition_type}
              onValueChange={(v: any) => onRuleChange({
                ...rule,
                condition_type: v,
                condition_value: v === 'occupancy' ? { threshold: 70 } : v === 'days_before' ? { days: 5 } : { days: [] }
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="occupancy">Загрузка</SelectItem>
                <SelectItem value="days_before">Дни до заезда</SelectItem>
                <SelectItem value="day_of_week">День недели</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {renderConditionEditor()}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Действие</Label>
              <Select
                value={rule.action_type}
                onValueChange={(v: any) => onRuleChange({ ...rule, action_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase">Повысить</SelectItem>
                  <SelectItem value="decrease">Понизить</SelectItem>
                  <SelectItem value="set">Установить</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Единица измерения</Label>
              <Select
                value={rule.action_unit}
                onValueChange={(v: any) => onRuleChange({ ...rule, action_unit: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Процент (%)</SelectItem>
                  <SelectItem value="fixed">Фикс. сумма (₽)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Значение</Label>
            <Input
              type="number"
              value={rule.action_value || 0}
              onChange={(e) => onRuleChange({ ...rule, action_value: parseFloat(e.target.value) })}
              placeholder="15"
            />
          </div>

          <div>
            <Label>Приоритет (чем выше - тем раньше применяется)</Label>
            <Input
              type="number"
              value={rule.priority || 0}
              onChange={(e) => onRuleChange({ ...rule, priority: parseInt(e.target.value) })}
              placeholder="0"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Отмена
            </Button>
            <Button onClick={onSave} disabled={loading || !rule.name}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
