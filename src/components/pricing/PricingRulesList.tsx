import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';

const PRICING_ENGINE_URL = 'https://functions.poehali.dev/a4b5c99d-6289-44f5-835f-c865029c71e4';

interface PricingRule {
  id: number;
  name: string;
  condition_type: string;
  condition_operator: string;
  condition_value: any;
  action_type: string;
  action_value: number;
  action_unit: string;
  priority: number;
  enabled: boolean;
}

interface PricingRulesListProps {
  profileId: number;
}

export default function PricingRulesList({ profileId }: PricingRulesListProps) {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRules();
  }, [profileId]);

  const loadRules = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${PRICING_ENGINE_URL}?action=get_rules&profile_id=${profileId}`);
      const data = await response.json();
      setRules(data.rules || []);
    } catch (error) {
      console.error('Error loading rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (ruleId: number, enabled: boolean) => {
    try {
      const rule = rules.find(r => r.id === ruleId);
      if (!rule) return;

      await fetch(`${PRICING_ENGINE_URL}?action=update_rule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rule,
          rule_id: ruleId,
          enabled
        })
      });

      setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled } : r));
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const getConditionText = (rule: PricingRule): string => {
    const { condition_type, condition_operator, condition_value } = rule;

    if (condition_type === 'occupancy') {
      return `Загрузка ${condition_operator} ${condition_value.threshold}%`;
    } else if (condition_type === 'days_before') {
      const occupancyText = condition_value.occupancy_max 
        ? ` и загрузка ≤ ${condition_value.occupancy_max}%` 
        : '';
      return `До заезда ${condition_operator} ${condition_value.days} дней${occupancyText}`;
    } else if (condition_type === 'day_of_week') {
      const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
      const days = condition_value.days.map((d: number) => dayNames[d]).join(', ');
      return `День недели: ${days}`;
    }

    return 'Условие не определено';
  };

  const getActionText = (rule: PricingRule): string => {
    const { action_type, action_value, action_unit } = rule;
    const valueText = action_unit === 'percent' ? `${action_value}%` : `${action_value}₽`;

    if (action_type === 'increase') {
      return `+${valueText}`;
    } else if (action_type === 'decrease') {
      return `−${valueText}`;
    } else if (action_type === 'set') {
      return `= ${valueText}`;
    }

    return '';
  };

  const getActionIcon = (actionType: string) => {
    if (actionType === 'increase') return 'TrendingUp';
    if (actionType === 'decrease') return 'TrendingDown';
    return 'Equal';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Icon name="Loader2" size={32} className="animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon name="ListChecks" size={24} />
            <span>Правила ценообразования</span>
            <Badge variant="outline">{rules.length}</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="FileQuestion" size={48} className="mx-auto mb-4 opacity-50" />
              <p>Правила не настроены</p>
            </div>
          ) : (
            rules.map(rule => (
              <div
                key={rule.id}
                className={`p-4 border rounded-lg ${
                  rule.enabled ? 'bg-background' : 'bg-muted opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon 
                        name={getActionIcon(rule.action_type)} 
                        size={18}
                        className={
                          rule.action_type === 'increase' 
                            ? 'text-green-600' 
                            : rule.action_type === 'decrease' 
                            ? 'text-red-600' 
                            : 'text-blue-600'
                        }
                      />
                      <span className="font-semibold">{rule.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        Приоритет: {rule.priority}
                      </Badge>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Icon name="Filter" size={14} />
                        <span>Условие: {getConditionText(rule)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Icon name="ArrowRightLeft" size={14} />
                        <span>Действие: {getActionText(rule)}</span>
                      </div>
                    </div>
                  </div>

                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(enabled) => toggleRule(rule.id, enabled)}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="flex items-start gap-3">
            <Icon name="Info" className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm space-y-1">
              <p className="font-medium">Как применяются правила?</p>
              <p className="text-muted-foreground">
                Правила обрабатываются по приоритету (чем выше число, тем раньше применяется). 
                Финальная цена всегда находится в диапазоне между минимальной и максимальной ценой профиля.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
