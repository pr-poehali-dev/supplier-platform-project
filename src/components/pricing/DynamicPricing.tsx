import { useState, useEffect } from 'react';
import { Unit } from '@/components/booking/UnitsManagement';
import PricingRulesEditor from './PricingRulesEditor';
import PricingControls from './PricingControls';
import { fetchWithAuth } from '@/lib/api';

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
      const response = await fetchWithAuth(`${PRICING_ENGINE_URL}?action=get_profiles`);
      const data = await response.json();
      if (data.profiles && data.profiles.length > 0) {
        const defaultProfile = data.profiles[0];
        setProfile(defaultProfile);
        setMinPrice(defaultProfile.min_price);
        setMaxPrice(defaultProfile.max_price);
      }
    } catch (error) {
      // Error loading profiles
    }
  };

  const toggleDynamicPricing = async (enabled: boolean) => {
    if (!selectedUnit) return;

    setLoading(true);
    try {
      await fetchWithAuth(`${PRICING_ENGINE_URL}?action=toggle_dynamic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unit_id: selectedUnit.id, enabled })
      });
      setDynamicEnabled(enabled);
      await onUnitUpdate();
      
      if ((window as any).__reloadCalendarPrices) {
        (window as any).__reloadCalendarPrices();
      }
    } catch (error) {
      // Error toggling
    } finally {
      setLoading(false);
    }
  };

  const enableAllUnits = async () => {
    setLoading(true);
    try {
      await fetchWithAuth(`${PRICING_ENGINE_URL}?action=toggle_dynamic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable_all: true, enabled: true })
      });
      await onUnitUpdate();
    } catch (error) {
      // Error enabling all
    } finally {
      setLoading(false);
    }
  };

  const saveLimits = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      await fetchWithAuth(`${PRICING_ENGINE_URL}?action=update_profile`, {
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
      // Error saving limits
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PricingControls
        dynamicEnabled={dynamicEnabled}
        loading={loading}
        isEditing={isEditing}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onToggle={toggleDynamicPricing}
        onEnableAll={enableAllUnits}
        onEdit={() => setIsEditing(true)}
        onSave={saveLimits}
        onCancel={() => {
          setIsEditing(false);
          if (profile) {
            setMinPrice(profile.min_price);
            setMaxPrice(profile.max_price);
          }
        }}
        onMinPriceChange={setMinPrice}
        onMaxPriceChange={setMaxPrice}
        hasSelectedUnit={!!selectedUnit}
      />

      {profile && selectedUnit && (
        <PricingRulesEditor
          profileId={profile.id}
          onRulesUpdate={onUnitUpdate}
        />
      )}
    </div>
  );
}