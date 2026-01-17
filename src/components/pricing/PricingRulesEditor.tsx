import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { fetchWithAuth } from '@/lib/api';
import RulesList from './RulesList';
import RuleDialog from './RuleDialog';

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
      const response = await fetchWithAuth(`${PRICING_ENGINE_URL}?action=get_rules&profile_id=${profileId}`);
      const data = await response.json();
      setRules(data.rules || []);
    } catch (error) {
      // Error loading rules
    }
  };

  const saveRule = async () => {
    if (!editingRule?.name || !editingRule.condition_type || !editingRule.action_type) return;

    setLoading(true);
    try {
      await fetchWithAuth(`${PRICING_ENGINE_URL}?action=update_rule`, {
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
      // Error saving rule
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
        body: JSON.stringify({
          rule_id: rule.id,
          profile_id: rule.profile_id,
          name: rule.name,
          condition_type: rule.condition_type,
          condition_operator: rule.condition_operator,
          condition_value: rule.condition_value,
          action_type: rule.action_type,
          action_value: rule.action_value,
          action_unit: rule.action_unit,
          priority: rule.priority,
          enabled
        })
      });
      
      setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled } : r));
      onRulesUpdate?.();
    } catch (error) {
      await loadRules();
    } finally {
      setLoading(false);
    }
  };

  const deleteRule = async (ruleId: number) => {
    if (!confirm('Удалить это правило? Действие необратимо.')) return;

    setLoading(true);
    try {
      await fetch(`${PRICING_ENGINE_URL}?action=delete_rule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule_id: ruleId })
      });
      
      setRules(prev => prev.filter(r => r.id !== ruleId));
      onRulesUpdate?.();
    } catch (error) {
      await loadRules();
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
          disabled={loading}
        >
          <Icon name="Plus" size={16} className="mr-1" />
          Добавить правило
        </Button>
      </div>

      <RulesList
        rules={rules}
        loading={loading}
        onToggle={toggleRule}
        onEdit={openEditRuleDialog}
        onDelete={deleteRule}
      />

      <RuleDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        rule={editingRule}
        onRuleChange={setEditingRule}
        onSave={saveRule}
        loading={loading}
      />
    </div>
  );
}
