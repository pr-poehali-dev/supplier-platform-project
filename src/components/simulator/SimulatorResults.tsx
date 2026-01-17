import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface SimulatorResultsProps {
  monthlyRevenue: number;
  staffExpenses: number;
  utilities: number;
  marketing: number;
  otherExpenses: number;
  totalExpenses: number;
  result: number;
  interpretation: {
    title: string;
    description: string;
    color: string;
    bg: string;
    icon: string;
  };
}

const SimulatorResults = ({
  monthlyRevenue,
  staffExpenses,
  utilities,
  marketing,
  otherExpenses,
  totalExpenses,
  result,
  interpretation,
}: SimulatorResultsProps) => {
  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="TrendingUp" className="text-primary" size={24} />
            Результаты
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Ежемесячная выручка</p>
            <p className="text-3xl font-bold text-primary">{formatMoney(monthlyRevenue)}</p>
          </div>

          <div className="space-y-3">
            <p className="font-semibold text-gray-700">Расходы:</p>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 flex items-center gap-2">
                <Icon name="Users" size={16} className="text-gray-400" />
                Персонал
              </span>
              <span className="font-medium">{formatMoney(staffExpenses)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600 flex items-center gap-2">
                <Icon name="Zap" size={16} className="text-gray-400" />
                Коммуналка
              </span>
              <span className="font-medium">{formatMoney(utilities)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600 flex items-center gap-2">
                <Icon name="Megaphone" size={16} className="text-gray-400" />
                Маркетинг
              </span>
              <span className="font-medium">{formatMoney(marketing)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600 flex items-center gap-2">
                <Icon name="MoreHorizontal" size={16} className="text-gray-400" />
                Прочее
              </span>
              <span className="font-medium">{formatMoney(otherExpenses)}</span>
            </div>

            <div className="pt-3 border-t flex justify-between items-center">
              <span className="font-semibold text-gray-700">Итого расходов:</span>
              <span className="font-bold text-lg">{formatMoney(totalExpenses)}</span>
            </div>
          </div>

          <div className={`${result >= 0 ? 'bg-green-50' : 'bg-red-50'} p-4 rounded-lg border-2 ${result >= 0 ? 'border-green-200' : 'border-red-200'}`}>
            <p className="text-sm text-gray-600 mb-1">Результат месяца</p>
            <p className={`text-3xl font-bold ${result >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {result >= 0 ? '+' : ''}{formatMoney(result)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className={`border-2 ${interpretation.bg} border-opacity-50`}>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className={`${interpretation.color}`}>
              <Icon name={interpretation.icon as any} size={32} />
            </div>
            <div>
              <h3 className={`font-bold text-lg mb-2 ${interpretation.color}`}>
                {interpretation.title}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {interpretation.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimulatorResults;
