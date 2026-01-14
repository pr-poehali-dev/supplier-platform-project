import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

const PRICING_ENGINE_URL = 'https://functions.poehali.dev/a4b5c99d-6289-44f5-835f-c865029c71e4';

interface PricingRule {
  id: number;
  profile_id: number;
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

interface PricingRulesEditorProps {
  profileId: number;
  onRulesUpdate?: () => void;
}

export default function PricingRulesEditor({ profileId, onRulesUpdate }: PricingRulesEditorProps) {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<PricingRule> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadRules();
  }, [profileId]);

  const loadRules = async () => {
    try {
      const response = await fetch(`${PRICING_ENGINE_URL}?action=get_rules&profile_id=${profileId}`);
      const data = await response.json();
      setRules(data.rules || []);
    } catch (error) {
      console.error('Error loading rules:', error);
    }
  };

  const saveRule = async () => {
    if (!editingRule?.name || !editingRule.condition_type || !editingRule.action_type) return;

    setLoading(true);
    try {
      await fetch(`${PRICING_ENGINE_URL}?action=update_rule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule_id: editingRule.id,
          profile_id: profileId,
          name: editingRule.name,
          condition_type: editingRule.condition_type,
          condition_operator: editingRule.condition_operator || '>=',
          condition_value: editingRule.condition_value || {},
          action_type: editingRule.action_type,
          action_value: editingRule.action_value || 0,
          action_unit: editingRule.action_unit || 'percent',
          priority: editingRule.priority || 0,
          enabled: editingRule.enabled !== false
        })
      });
      await loadRules();
      setIsDialogOpen(false);
      setEditingRule(null);
      onRulesUpdate?.();
    } catch (error) {
      console.error('Error saving rule:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (ruleId: number, enabled: boolean) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    setLoading(true);
    try {
      await fetch(`${PRICING_ENGINE_URL}?action=update_rule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rule, enabled })
      });
      await loadRules();
      onRulesUpdate?.();
    } catch (error) {
      console.error('Error toggling rule:', error);
    } finally {
      setLoading(false);
    }
  };

  const openNewRuleDialog = () => {
    setEditingRule({
      name: '',
      condition_type: 'occupancy',
      condition_operator: '>=',
      condition_value: { threshold: 70 },
      action_type: 'increase',
      action_value: 15,
      action_unit: 'percent',
      priority: 0,
      enabled: true
    });
    setIsDialogOpen(true);
  };

  const openEditRuleDialog = (rule: PricingRule) => {
    setEditingRule({ ...rule });
    setIsDialogOpen(true);
  };

  const renderConditionEditor = () => {
    if (!editingRule) return null;

    switch (editingRule.condition_type) {
      case 'occupancy':
        return (
          <div className="space-y-2">
            <Label>Порог загрузки (%)</Label>
            <Input
              type="number"
              value={editingRule.condition_value?.threshold || 0}
              onChange={(e) => setEditingRule({
                ...editingRule,
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
                value={editingRule.condition_value?.days || 0}
                onChange={(e) => setEditingRule({
                  ...editingRule,
                  condition_value: {
                    ...editingRule.condition_value,
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
                value={editingRule.condition_value?.occupancy_max || 100}
                onChange={(e) => setEditingRule({
                  ...editingRule,
                  condition_value: {
                    ...editingRule.condition_value,
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
              value={editingRule.condition_value?.days?.join(',') || ''}
              onChange={(e) => setEditingRule({
                ...editingRule,
                condition_value: {
                  days: e.target.value.split(',').map(d => parseInt(d.trim())).filter(n => !isNaN(n))
                }
              })}
              placeholder="5,6"
            />
            <p className="text-xs text-gray-500">Введите номера дней через запятую</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="Sliders" size={20} className="text-purple-600" />
          <h3 className="text-lg font-semibold">Правила ценообразования</h3>
          <Badge variant="outline">{rules.length}</Badge>
        </div>
        <Button 
          size="sm" 
          onClick={openNewRuleDialog}
          className="gap-2"
        >
          <Icon name="Plus" size={16} />
          Добавить правило
        </Button>
      </div>
      <div className="space-y-3">
        {rules.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Icon name="AlertCircle" size={32} className="mx-auto mb-2 opacity-30" />
            <p>Нет правил. Создайте первое правило!</p>
          </div>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3 flex-1">
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                  disabled={loading}
                />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{rule.name}</p>
                  <p className="text-xs text-gray-600">
                    {rule.action_type === 'increase' ? '+' : rule.action_type === 'decrease' ? '-' : '='}
                    {rule.action_value}{rule.action_unit === 'percent' ? '%' : '₽'}
                    {' • Приоритет: '}{rule.priority}
                  </p>
                </div>
                <Badge variant={rule.enabled ? "default" : "secondary"}>
                  {rule.enabled ? 'Активно' : 'Выкл'}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEditRuleDialog(rule)}
                className="ml-2"
              >
                <Icon name="Edit" size={16} />
              </Button>
            </div>
          ))
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingRule?.id ? 'Редактировать правило' : 'Новое правило'}
              </DialogTitle>
            </DialogHeader>
            {editingRule && (
              <div className="space-y-4">
                <div>
                  <Label>Название</Label>
                  <Input
                    value={editingRule.name || ''}
                    onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                    placeholder="Высокая загрузка"
                  />
                </div>

                <div>
                  <Label>Тип условия</Label>
                  <Select
                    value={editingRule.condition_type}
                    onValueChange={(value: any) => setEditingRule({
                      ...editingRule,
                      condition_type: value
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Действие</Label>
                    <Select
                      value={editingRule.action_type}
                      onValueChange={(value: any) => setEditingRule({
                        ...editingRule,
                        action_type: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="increase">Увеличить</SelectItem>
                        <SelectItem value="decrease">Уменьшить</SelectItem>
                        <SelectItem value="set">Установить</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Единица</Label>
                    <Select
                      value={editingRule.action_unit}
                      onValueChange={(value: any) => setEditingRule({
                        ...editingRule,
                        action_unit: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">Проценты</SelectItem>
                        <SelectItem value="fixed">Фиксированная</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Значение</Label>
                  <Input
                    type="number"
                    value={editingRule.action_value || 0}
                    onChange={(e) => setEditingRule({
                      ...editingRule,
                      action_value: parseFloat(e.target.value)
                    })}
                    placeholder="15"
                  />
                </div>

                <div>
                  <Label>Приоритет (чем выше, тем раньше применяется)</Label>
                  <Input
                    type="number"
                    value={editingRule.priority || 0}
                    onChange={(e) => setEditingRule({
                      ...editingRule,
                      priority: parseInt(e.target.value)
                    })}
                    placeholder="0"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={saveRule} disabled={loading} className="flex-1">
                    {loading ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}