import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Icon from '@/components/ui/icon';
import { Unit } from '@/components/booking/UnitsManagement';
import PricingRulesEditor from './PricingRulesEditor';

const PRICING_ENGINE_URL = 'https://functions.poehali.dev/a4b5c99d-6289-44f5-835f-c865029c71e4';

interface PricingProfile {
  id: number;
  name: string;
  mode: string;
  min_price: string;
  max_price: string;
  is_default: boolean;
  enabled: boolean;
}

interface DynamicPricingProps {
  selectedUnit: Unit | null;
  onUnitUpdate: () => Promise<void>;
}

export default function DynamicPricing({ selectedUnit, onUnitUpdate }: DynamicPricingProps) {
  const [profile, setProfile] = useState<PricingProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [dynamicEnabled, setDynamicEnabled] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (selectedUnit) {
      setDynamicEnabled(selectedUnit.dynamic_pricing_enabled !== false);
    }
  }, [selectedUnit]);

  const loadProfile = async () => {
    try {
      const response = await fetch(`${PRICING_ENGINE_URL}?action=get_profiles`);
      const data = await response.json();
      if (data.profiles && data.profiles.length > 0) {
        const defaultProfile = data.profiles[0];
        setProfile(defaultProfile);
        setMinPrice(defaultProfile.min_price);
        setMaxPrice(defaultProfile.max_price);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const toggleDynamicPricing = async (enabled: boolean) => {
    if (!selectedUnit) return;

    setLoading(true);
    try {
      await fetch(`${PRICING_ENGINE_URL}?action=toggle_dynamic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unit_id: selectedUnit.id, enabled })
      });
      setDynamicEnabled(enabled);
      await onUnitUpdate();
    } catch (error) {
      console.error('Error toggling:', error);
    } finally {
      setLoading(false);
    }
  };

  const enableAllUnits = async () => {
    setLoading(true);
    try {
      await fetch(`${PRICING_ENGINE_URL}?action=toggle_dynamic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable_all: true, enabled: true })
      });
      await onUnitUpdate();
    } catch (error) {
      console.error('Error enabling all:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveLimits = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      await fetch(`${PRICING_ENGINE_URL}?action=update_profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profile.id,
          name: profile.name,
          mode: 'rules',
          min_price: parseFloat(minPrice),
          max_price: parseFloat(maxPrice)
        })
      });
      await loadProfile();
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving limits:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedUnit) {
    return (
      <Card className="mb-6 border-2 border-dashed">
        <CardContent className="py-12 text-center">
          <Icon name="TrendingUp" size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-muted-foreground">Выберите объект для настройки ценообразования</p>
        </CardContent>
      </Card>
    );
  }

  const basePrice = selectedUnit.base_price || 0;

  return (
    <>
    <Card className="mb-6 border-l-4 border-emerald-500">
      <Accordion type="single" collapsible defaultValue="pricing">
        <AccordionItem value="pricing" className="border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-4 w-full">
              <AccordionTrigger className="hover:no-underline py-0 flex-1">
                <CardTitle className="flex items-center gap-3">
                  <Icon name="TrendingUp" size={24} className="text-emerald-600" />
                  <span>Динамическое ценообразование</span>
                  <Badge variant={dynamicEnabled ? "default" : "secondary"} className="bg-emerald-600">
                    {dynamicEnabled ? 'Активно' : 'Выключено'}
                  </Badge>
                </CardTitle>
              </AccordionTrigger>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={enableAllUnits}
                disabled={loading}
                className="gap-2"
              >
                <Icon name="CheckCircle" size={16} />
                Включить везде
              </Button>
            </div>
          </CardHeader>
          <AccordionContent>
            <CardContent className="space-y-4 pt-0">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-5 border border-emerald-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">{selectedUnit.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Базовая цена: <span className="font-bold text-emerald-700 text-lg">{basePrice}₽</span> / ночь
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="dynamic-toggle" className="text-sm font-medium cursor-pointer">
                {dynamicEnabled ? 'Включено' : 'Выключено'}
              </Label>
              <Switch
                id="dynamic-toggle"
                checked={dynamicEnabled}
                onCheckedChange={toggleDynamicPricing}
                disabled={loading}
              />
            </div>
          </div>

          {dynamicEnabled && profile && (
            <div className="space-y-3 pt-4 border-t border-emerald-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Ценовой коридор:</span>
                {!isEditing ? (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-base">
                      {parseFloat(profile.min_price).toLocaleString('ru-RU')}₽ — {parseFloat(profile.max_price).toLocaleString('ru-RU')}₽
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="h-7 w-7 p-0"
                    >
                      <Icon name="Edit" size={14} />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-28 h-8 text-sm"
                      placeholder="Мин"
                    />
                    <span className="text-gray-400">—</span>
                    <Input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-28 h-8 text-sm"
                      placeholder="Макс"
                    />
                    <Button
                      size="sm"
                      onClick={saveLimits}
                      disabled={loading}
                      className="h-8 w-8 p-0"
                    >
                      <Icon name="Check" size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        setMinPrice(profile.min_price);
                        setMaxPrice(profile.max_price);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Icon name="X" size={14} />
                    </Button>
                  </div>
                )}
              </div>

              <div className="bg-white/70 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                  <Icon name="Info" size={13} />
                  Как это работает:
                </p>
                <ul className="text-xs text-gray-700 space-y-1 pl-5">
                  <li>• Расчёт начинается с базовой цены объекта ({basePrice}₽)</li>
                  <li>• Цена корректируется автоматически по правилам</li>
                  <li>• Итоговая цена остаётся в коридоре {parseFloat(profile.min_price).toLocaleString('ru-RU')}₽ — {parseFloat(profile.max_price).toLocaleString('ru-RU')}₽</li>
                </ul>
              </div>
            </div>
          )}
        </div>

            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
    
    {dynamicEnabled && profile && (
      <PricingRulesEditor 
        profileId={profile.id} 
        onRulesUpdate={loadProfile}
      />
    )}
    </>
  );
}