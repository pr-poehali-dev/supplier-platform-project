import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

const PRICING_ENGINE_URL = 'https://functions.poehali.dev/a4b5c99d-6289-44f5-835f-c865029c71e4';

interface PriceDay {
  unit_id: number;
  date: string;
  price: number;
  original_price: number;
  applied_rules: Array<{
    rule_name: string;
    change: number;
  }>;
  source: string;
  dynamic_enabled: boolean;
  occupancy: number;
  days_before: number;
}

interface PriceCalendarProps {
  unitId: number;
}

export default function PriceCalendar({ unitId }: PriceCalendarProps) {
  const [priceData, setPriceData] = useState<PriceDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadPriceCalendar();
  }, [unitId, currentMonth]);

  const loadPriceCalendar = async () => {
    setLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];

      const response = await fetch(
        `${PRICING_ENGINE_URL}?action=get_price_calendar&unit_id=${unitId}&start_date=${startDate}&end_date=${endDate}`
      );
      const data = await response.json();
      setPriceData(data.calendar || []);
    } catch (error) {
      // Error loading price calendar
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (delta: number) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + delta);
      return newDate;
    });
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysCount = lastDay.getDate();
    const startWeekday = firstDay.getDay();

    const days: (PriceDay | null)[] = [];
    
    for (let i = 0; i < (startWeekday === 0 ? 6 : startWeekday - 1); i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysCount; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const priceDay = priceData.find(pd => pd.date === dateStr);
      days.push(priceDay || null);
    }

    return days;
  };

  const monthName = currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon name="Calendar" size={24} />
            <span>Календарь цен</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => changeMonth(-1)}>
              <Icon name="ChevronLeft" size={18} />
            </Button>
            <span className="text-sm font-normal min-w-[140px] text-center capitalize">
              {monthName}
            </span>
            <Button variant="outline" size="sm" onClick={() => changeMonth(1)}>
              <Icon name="ChevronRight" size={18} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <Icon name="Loader2" size={32} className="animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-muted-foreground">
              <div>Пн</div>
              <div>Вт</div>
              <div>Ср</div>
              <div>Чт</div>
              <div>Пт</div>
              <div>Сб</div>
              <div>Вс</div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {days.map((day, idx) => {
                if (!day) {
                  return <div key={idx} className="aspect-square" />;
                }

                const dateObj = new Date(day.date);
                const dayNum = dateObj.getDate();
                const hasRules = day.applied_rules && day.applied_rules.length > 0;
                const priceChanged = day.price !== day.original_price;

                return (
                  <div
                    key={idx}
                    className="aspect-square border rounded-lg p-2 hover:shadow-md transition-shadow cursor-pointer group relative"
                  >
                    <div className="text-xs text-muted-foreground mb-1">{dayNum}</div>
                    <div className="text-sm font-bold">
                      {Math.round(day.price).toLocaleString('ru-RU')}₽
                    </div>
                    {priceChanged && (
                      <Badge
                        variant={day.price > day.original_price ? 'default' : 'secondary'}
                        className="text-xs mt-1"
                      >
                        {day.price > day.original_price ? '+' : ''}
                        {Math.round(((day.price - day.original_price) / day.original_price) * 100)}%
                      </Badge>
                    )}

                    {hasRules && (
                      <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-popover border rounded-lg shadow-lg z-10">
                        <div className="text-xs space-y-2">
                          <div className="font-semibold">Применённые правила:</div>
                          {day.applied_rules.map((rule, rIdx) => (
                            <div key={rIdx} className="flex justify-between">
                              <span>{rule.rule_name}</span>
                              <span className={rule.change > 0 ? 'text-green-600' : 'text-red-600'}>
                                {rule.change > 0 ? '+' : ''}{Math.round(rule.change)}₽
                              </span>
                            </div>
                          ))}
                          <div className="pt-2 border-t flex justify-between font-semibold">
                            <span>Итого:</span>
                            <span>{Math.round(day.price).toLocaleString('ru-RU')}₽</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-4 pt-4 border-t text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary rounded" />
                <span className="text-muted-foreground">Цена выше базовой</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-secondary rounded" />
                <span className="text-muted-foreground">Цена ниже базовой</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}