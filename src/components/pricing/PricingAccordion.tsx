import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import DynamicPricing from './DynamicPricing';
import type { Unit } from '@/components/booking/UnitsManagement';

interface PricingAccordionProps {
  selectedUnit: Unit | null;
  onUnitUpdate: () => Promise<void>;
}

export default function PricingAccordion({ selectedUnit, onUnitUpdate }: PricingAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="mb-6 overflow-hidden">
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
              <Icon name="Zap" className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Динамическое ценообразование</h3>
              <p className="text-sm text-gray-600">Настройка автоматического изменения цен</p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <Icon 
              name={isOpen ? "ChevronUp" : "ChevronDown"} 
              size={20} 
              className="text-gray-500"
            />
          </Button>
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="border-t">
          <DynamicPricing 
            selectedUnit={selectedUnit} 
            onUnitUpdate={onUnitUpdate}
          />
        </CardContent>
      )}
    </Card>
  );
}
