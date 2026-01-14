import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { Unit } from '@/components/booking/UnitsManagement';
import PriceCalendar from './PriceCalendar';
import PricingRulesList from './PricingRulesList';

const PRICING_ENGINE_URL = 'https://functions.poehali.dev/a4b5c99d-6289-44f5-835f-c865029c71e4';

interface PricingProfile {
  id: number;
  name: string;
  mode: string;
  base_price: string;
  min_price: string;
  max_price: string;
  is_default: boolean;
  enabled: boolean;
  units_count: number;
}

interface DynamicPricingProps {
  selectedUnit: Unit | null;
  onUnitUpdate: () => Promise<void>;
}

export default function DynamicPricing({ selectedUnit, onUnitUpdate }: DynamicPricingProps) {
  const [profiles, setProfiles] = useState<PricingProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [dynamicEnabled, setDynamicEnabled] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    if (selectedUnit) {
      setDynamicEnabled(selectedUnit.dynamic_pricing_enabled !== false);
    }
  }, [selectedUnit]);

  const loadProfiles = async () => {
    try {
      const response = await fetch(`${PRICING_ENGINE_URL}?action=get_profiles`);
      const data = await response.json();
      setProfiles(data.profiles || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const toggleDynamicPricing = async (enabled: boolean) => {
    if (!selectedUnit) return;

    setLoading(true);
    try {
      const response = await fetch(`${PRICING_ENGINE_URL}?action=toggle_dynamic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: selectedUnit.id,
          enabled
        })
      });

      if (response.ok) {
        setDynamicEnabled(enabled);
        await onUnitUpdate();
      }
    } catch (error) {
      console.error('Error toggling dynamic pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedUnit) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            <Icon name="TrendingUp" size={48} className="mx-auto mb-4 opacity-50" />
            <p>Выберите объект для настройки ценообразования</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const defaultProfile = profiles.find(p => p.is_default);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="TrendingUp" size={24} />
              <span>Динамическое ценообразование</span>
              <Badge variant={dynamicEnabled ? "default" : "secondary"}>
                {dynamicEnabled ? 'Активно' : 'Выключено'}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <Label htmlFor="dynamic-switch" className="text-sm font-normal">
                {dynamicEnabled ? 'Включено' : 'Выключено'}
              </Label>
              <Switch
                id="dynamic-switch"
                checked={dynamicEnabled}
                onCheckedChange={toggleDynamicPricing}
                disabled={loading}
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-3">
                <Icon name="Info" className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Как работает динамическое ценообразование?</p>
                  <p className="text-muted-foreground">
                    Система автоматически корректирует цены на основе заданных правил: 
                    загрузки объектов, срочности бронирования, дня недели и других факторов.
                  </p>
                </div>
              </div>
            </div>

            {defaultProfile && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Базовая цена</div>
                  <div className="text-2xl font-bold">
                    {parseFloat(defaultProfile.base_price).toLocaleString('ru-RU')} ₽
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Минимальная цена</div>
                  <div className="text-2xl font-bold text-red-600">
                    {parseFloat(defaultProfile.min_price).toLocaleString('ru-RU')} ₽
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Максимальная цена</div>
                  <div className="text-2xl font-bold text-green-600">
                    {parseFloat(defaultProfile.max_price).toLocaleString('ru-RU')} ₽
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCalendar(!showCalendar)}
                className="flex-1"
              >
                <Icon name="Calendar" className="mr-2" size={18} />
                {showCalendar ? 'Скрыть календарь' : 'Календарь цен'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRules(!showRules)}
                className="flex-1"
              >
                <Icon name="ListChecks" className="mr-2" size={18} />
                {showRules ? 'Скрыть правила' : 'Правила расчёта'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showCalendar && selectedUnit && (
        <PriceCalendar unitId={selectedUnit.id} />
      )}

      {showRules && defaultProfile && (
        <PricingRulesList profileId={defaultProfile.id} />
      )}
    </div>
  );
}
