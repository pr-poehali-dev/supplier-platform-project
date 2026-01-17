import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SimulatorInputsProps {
  format: 'weekend' | 'eco' | 'glamping';
  setFormat: (value: 'weekend' | 'eco' | 'glamping') => void;
  units: number;
  setUnits: (value: number) => void;
  price: number;
  setPrice: (value: number) => void;
  occupancy: number;
  setOccupancy: (value: number) => void;
  season: 'low' | 'medium' | 'high';
  setSeason: (value: 'low' | 'medium' | 'high') => void;
  staffExpenses: number;
  setStaffExpenses: (value: number) => void;
  marketingExpenses: number;
  setMarketingExpenses: (value: number) => void;
  otherExpenses: number;
  setOtherExpenses: (value: number) => void;
}

const SimulatorInputs = ({
  format,
  setFormat,
  units,
  setUnits,
  price,
  setPrice,
  occupancy,
  setOccupancy,
  season,
  setSeason,
  staffExpenses,
  setStaffExpenses,
  marketingExpenses,
  setMarketingExpenses,
  otherExpenses,
  setOtherExpenses,
}: SimulatorInputsProps) => {
  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Card className="border-none shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Settings" className="text-primary" size={24} />
          Параметры проекта
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-base font-medium">Формат проекта</Label>
          <Select value={format} onValueChange={(v: any) => setFormat(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekend">База выходного дня</SelectItem>
              <SelectItem value="eco">Эко-отель</SelectItem>
              <SelectItem value="glamping">Глэмпинг</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-base font-medium">Количество домиков / номеров</Label>
          <input
            type="number"
            value={units}
            onChange={(e) => setUnits(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            min="1"
            max="50"
          />
          <p className="text-sm text-gray-500">От 1 до 50 единиц</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-base font-medium">Средняя цена за сутки</Label>
            <span className="text-lg font-semibold text-primary">{formatMoney(price)}</span>
          </div>
          <input
            type="range"
            min="2000"
            max="20000"
            step="500"
            value={price}
            onChange={(e) => setPrice(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>2 000 ₽</span>
            <span>20 000 ₽</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-base font-medium">Средняя загрузка</Label>
            <span className="text-lg font-semibold text-primary">{occupancy}%</span>
          </div>
          <input
            type="range"
            min="20"
            max="95"
            step="5"
            value={occupancy}
            onChange={(e) => setOccupancy(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>20%</span>
            <span>95%</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-base font-medium">Сезонность</Label>
          <Select value={season} onValueChange={(v: any) => setSeason(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Низкий сезон (-40%)</SelectItem>
              <SelectItem value="medium">Средний сезон</SelectItem>
              <SelectItem value="high">Высокий сезон (+30%)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icon name="Wallet" className="text-primary" size={20} />
            Ежемесячные расходы
          </h3>

          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-base font-medium">Персонал</Label>
                <span className="text-lg font-semibold text-primary">{formatMoney(staffExpenses)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1000000"
                step="50000"
                value={staffExpenses}
                onChange={(e) => setStaffExpenses(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0 ₽</span>
                <span>1 000 000 ₽</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-base font-medium">Маркетинг</Label>
                <span className="text-lg font-semibold text-primary">
                  {marketingExpenses === 0 ? 'Авто (5%)' : formatMoney(marketingExpenses)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="500000"
                step="25000"
                value={marketingExpenses}
                onChange={(e) => setMarketingExpenses(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Авто</span>
                <span>500 000 ₽</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-base font-medium">Прочие расходы</Label>
                <span className="text-lg font-semibold text-primary">{formatMoney(otherExpenses)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="500000"
                step="25000"
                value={otherExpenses}
                onChange={(e) => setOtherExpenses(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0 ₽</span>
                <span>500 000 ₽</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimulatorInputs;
