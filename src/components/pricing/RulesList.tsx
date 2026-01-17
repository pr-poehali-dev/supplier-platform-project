import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface PricingRule {
  id: number;
  name: string;
  condition_type: 'occupancy' | 'days_before' | 'day_of_week';
  condition_value: any;
  action_type: 'increase' | 'decrease' | 'set';
  action_value: number;
  action_unit: 'percent' | 'fixed';
  priority: number;
  enabled: boolean;
}

interface RulesListProps {
  rules: PricingRule[];
  loading: boolean;
  onToggle: (ruleId: number, enabled: boolean) => void;
  onEdit: (rule: PricingRule) => void;
  onDelete: (ruleId: number) => void;
}

export default function RulesList({ rules, loading, onToggle, onEdit, onDelete }: RulesListProps) {
  const getConditionLabel = (rule: PricingRule) => {
    switch (rule.condition_type) {
      case 'occupancy':
        return `Загрузка ≥ ${rule.condition_value?.threshold || 0}%`;
      case 'days_before':
        return `За ${rule.condition_value?.days || 0} дней`;
      case 'day_of_week':
        return `Дни: ${rule.condition_value?.days?.join(', ') || ''}`;
      default:
        return 'Неизвестно';
    }
  };

  const getActionLabel = (rule: PricingRule) => {
    const sign = rule.action_type === 'increase' ? '+' : rule.action_type === 'decrease' ? '-' : '=';
    const unit = rule.action_unit === 'percent' ? '%' : '₽';
    return `${sign}${rule.action_value}${unit}`;
  };

  if (rules.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 text-center text-gray-500">
          <Icon name="Sliders" size={48} className="mx-auto mb-2 text-gray-300" />
          <p>Правила не созданы</p>
          <p className="text-sm">Добавьте первое правило для автоматической корректировки цен</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {rules.map((rule) => (
        <Card key={rule.id} className={!rule.enabled ? 'opacity-50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold">{rule.name}</h4>
                  <Badge variant="outline" className="text-xs">
                    Приоритет: {rule.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Icon name="Filter" size={14} />
                    {getConditionLabel(rule)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="TrendingUp" size={14} />
                    {getActionLabel(rule)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={(checked) => onToggle(rule.id, checked)}
                  disabled={loading}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(rule)}
                  disabled={loading}
                >
                  <Icon name="Edit" size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(rule.id)}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700"
                >
                  <Icon name="Trash2" size={16} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
