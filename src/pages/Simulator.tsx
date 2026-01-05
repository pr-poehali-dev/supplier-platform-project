import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';

const Simulator = () => {
  const navigate = useNavigate();
  const [businessType, setBusinessType] = useState<'glamping' | 'hotel' | 'resort'>('glamping');
  const [rooms, setRooms] = useState([15]);
  const [avgPrice, setAvgPrice] = useState([8000]);
  const [occupancy, setOccupancy] = useState([65]);
  const [expenses, setExpenses] = useState([40]);

  const monthlyRevenue = rooms[0] * avgPrice[0] * 30 * (occupancy[0] / 100);
  const monthlyExpenses = monthlyRevenue * (expenses[0] / 100);
  const monthlyProfit = monthlyRevenue - monthlyExpenses;
  const yearlyProfit = monthlyProfit * 12;

  const businessTypes = {
    glamping: {
      name: 'Глемпинг',
      icon: 'Tent',
      color: 'from-green-500 to-emerald-600',
      description: 'Эко-отдых в комфортных купольных домиках на природе'
    },
    hotel: {
      name: 'Арт-отель',
      icon: 'Building2',
      color: 'from-purple-500 to-pink-600',
      description: 'Дизайнерский бутик-отель с уникальным стилем'
    },
    resort: {
      name: 'База отдыха',
      icon: 'Home',
      color: 'from-blue-500 to-cyan-600',
      description: 'Загородный комплекс для семейного отдыха'
    }
  };

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
            <Icon name="ArrowLeft" className="group-hover:-translate-x-1 transition-transform" size={20} />
            <h1 className="text-2xl font-bold font-heading bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              TourConnect
            </h1>
          </button>
          <Button onClick={() => navigate('/club')} className="bg-gradient-to-r from-primary to-secondary">
            Клуб партнёров
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              📊 Бизнес-калькулятор
            </Badge>
            <h1 className="text-5xl font-bold font-heading mb-4">
              Симулятор отельера
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Рассчитайте потенциальную прибыль вашего гостиничного бизнеса
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {(Object.keys(businessTypes) as Array<keyof typeof businessTypes>).map((type) => (
              <Card
                key={type}
                className={`cursor-pointer transition-all duration-300 border-2 ${
                  businessType === type
                    ? 'border-primary shadow-lg scale-105'
                    : 'border-transparent hover:border-gray-300'
                }`}
                onClick={() => setBusinessType(type)}
              >
                <CardContent className="pt-6 text-center">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${businessTypes[type].color} flex items-center justify-center mx-auto mb-4`}>
                    <Icon name={businessTypes[type].icon as any} className="text-white" size={32} />
                  </div>
                  <h3 className="text-xl font-bold font-heading mb-2">{businessTypes[type].name}</h3>
                  <p className="text-sm text-gray-600">{businessTypes[type].description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Settings" className="text-primary" size={24} />
                  Параметры бизнеса
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-semibold">Количество номеров</Label>
                    <span className="text-2xl font-bold text-primary">{rooms[0]}</span>
                  </div>
                  <Slider
                    value={rooms}
                    onValueChange={setRooms}
                    min={5}
                    max={50}
                    step={1}
                    className="py-4"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>5 номеров</span>
                    <span>50 номеров</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-semibold">Средняя цена за ночь</Label>
                    <span className="text-2xl font-bold text-primary">{formatMoney(avgPrice[0])}</span>
                  </div>
                  <Slider
                    value={avgPrice}
                    onValueChange={setAvgPrice}
                    min={2000}
                    max={20000}
                    step={500}
                    className="py-4"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>2 000 ₽</span>
                    <span>20 000 ₽</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-semibold">Средняя загрузка</Label>
                    <span className="text-2xl font-bold text-primary">{occupancy[0]}%</span>
                  </div>
                  <Slider
                    value={occupancy}
                    onValueChange={setOccupancy}
                    min={20}
                    max={95}
                    step={5}
                    className="py-4"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>20%</span>
                    <span>95%</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-semibold">Операционные расходы</Label>
                    <span className="text-2xl font-bold text-primary">{expenses[0]}%</span>
                  </div>
                  <Slider
                    value={expenses}
                    onValueChange={setExpenses}
                    min={20}
                    max={70}
                    step={5}
                    className="py-4"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>20%</span>
                    <span>70%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-none shadow-xl bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="TrendingUp" className="text-primary" size={24} />
                    Финансовый прогноз
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Выручка в месяц</p>
                        <p className="text-2xl font-bold text-gray-900">{formatMoney(monthlyRevenue)}</p>
                      </div>
                      <Icon name="DollarSign" className="text-green-500" size={32} />
                    </div>

                    <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Расходы в месяц</p>
                        <p className="text-2xl font-bold text-gray-900">{formatMoney(monthlyExpenses)}</p>
                      </div>
                      <Icon name="Receipt" className="text-orange-500" size={32} />
                    </div>

                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-primary to-secondary rounded-lg text-white">
                      <div>
                        <p className="text-sm text-white/90">Прибыль в месяц</p>
                        <p className="text-3xl font-bold">{formatMoney(monthlyProfit)}</p>
                      </div>
                      <Icon name="Wallet" className="text-white" size={32} />
                    </div>

                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-accent to-primary rounded-lg text-white">
                      <div>
                        <p className="text-sm text-white/90">Годовая прибыль</p>
                        <p className="text-3xl font-bold">{formatMoney(yearlyProfit)}</p>
                      </div>
                      <Icon name="TrendingUp" className="text-white" size={32} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Lightbulb" className="text-accent" size={24} />
                    Рекомендации
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {occupancy[0] < 50 && (
                    <div className="flex gap-3 p-3 bg-yellow-50 rounded-lg">
                      <Icon name="AlertCircle" className="text-yellow-600 flex-shrink-0" size={20} />
                      <p className="text-sm text-yellow-800">
                        Низкая загрузка. Используйте TourConnect для привлечения партнёров и увеличения бронирований!
                      </p>
                    </div>
                  )}
                  {expenses[0] > 60 && (
                    <div className="flex gap-3 p-3 bg-orange-50 rounded-lg">
                      <Icon name="AlertTriangle" className="text-orange-600 flex-shrink-0" size={20} />
                      <p className="text-sm text-orange-800">
                        Высокие расходы. Автоматизация через нашу платформу снизит операционные затраты до 30%.
                      </p>
                    </div>
                  )}
                  {monthlyProfit > 500000 && (
                    <div className="flex gap-3 p-3 bg-green-50 rounded-lg">
                      <Icon name="CheckCircle" className="text-green-600 flex-shrink-0" size={20} />
                      <p className="text-sm text-green-800">
                        Отличные показатели! Вступайте в закрытый клуб для масштабирования бизнеса.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="mt-8 border-none shadow-xl bg-gradient-to-r from-primary via-secondary to-accent text-white">
            <CardContent className="py-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-2xl font-bold font-heading mb-2">
                    Готовы увеличить прибыль на 40%?
                  </h3>
                  <p className="text-white/90">
                    Присоединяйтесь к TourConnect и получите доступ к сети проверенных партнёров
                  </p>
                </div>
                <Button 
                  size="lg" 
                  onClick={() => navigate('/club')}
                  className="bg-white text-primary hover:bg-gray-100 font-bold whitespace-nowrap"
                >
                  Вступить в клуб
                  <Icon name="ArrowRight" className="ml-2" size={20} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Simulator;
