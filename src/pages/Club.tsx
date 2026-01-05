import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Club = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium' | 'vip'>('premium');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');

  const plans = {
    basic: {
      name: 'Базовый',
      monthlyPrice: 15000,
      yearlyPrice: 150000,
      color: 'from-blue-500 to-cyan-600',
      icon: 'Star',
      features: [
        'Доступ к каталогу партнёров',
        'До 50 сообщений в месяц',
        'Базовая аналитика',
        'Email поддержка',
        'Ежемесячный дайджест'
      ]
    },
    premium: {
      name: 'Премиум',
      monthlyPrice: 35000,
      yearlyPrice: 350000,
      color: 'from-purple-500 to-pink-600',
      icon: 'Crown',
      popular: true,
      features: [
        'Всё из тарифа "Базовый"',
        'Неограниченные сообщения',
        'Продвинутая аналитика',
        'Приоритетная поддержка 24/7',
        'Персональный менеджер',
        'Участие в закрытых мероприятиях',
        'Скидки от партнёров до 15%'
      ]
    },
    vip: {
      name: 'VIP',
      monthlyPrice: 75000,
      yearlyPrice: 750000,
      color: 'from-amber-500 to-orange-600',
      icon: 'Gem',
      features: [
        'Всё из тарифа "Премиум"',
        'Эксклюзивные партнёрства',
        'Индивидуальные условия',
        'Dedicated менеджер',
        'Организация встреч с партнёрами',
        'Маркетинговая поддержка',
        'Приоритет в рейтинге платформы',
        'Участие в управлении экосистемой'
      ]
    }
  };

  const getPrice = (plan: keyof typeof plans) => {
    return billingPeriod === 'monthly' 
      ? plans[plan].monthlyPrice 
      : plans[plan].yearlyPrice;
  };

  const getSavings = (plan: keyof typeof plans) => {
    const monthlyTotal = plans[plan].monthlyPrice * 12;
    const yearlyPrice = plans[plan].yearlyPrice;
    return monthlyTotal - yearlyPrice;
  };

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Заявка принята! 🎉',
      description: 'Наш менеджер свяжется с вами в течение 24 часов.',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30">
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
            <Icon name="ArrowLeft" className="group-hover:-translate-x-1 transition-transform" size={20} />
            <h1 className="text-2xl font-bold font-heading bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              TourConnect
            </h1>
          </button>
          <Button onClick={() => navigate('/simulator')} variant="outline">
            Симулятор бизнеса
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <Badge className="mb-4 bg-gradient-to-r from-primary to-secondary text-white border-none">
              👑 Эксклюзивное сообщество
            </Badge>
            <h1 className="text-5xl lg:text-6xl font-bold font-heading mb-4">
              Закрытый клуб партнёров
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Станьте частью элитного сообщества профессионалов туризма. Доступ к лучшим партнёрам, эксклюзивным условиям и закрытым мероприятиям.
            </p>
          </div>

          <div className="flex justify-center mb-12">
            <Card className="inline-flex p-2 border-none shadow-lg">
              <div className="flex gap-2">
                <Button
                  variant={billingPeriod === 'monthly' ? 'default' : 'ghost'}
                  onClick={() => setBillingPeriod('monthly')}
                  className={billingPeriod === 'monthly' ? 'bg-gradient-to-r from-primary to-secondary' : ''}
                >
                  Помесячно
                </Button>
                <Button
                  variant={billingPeriod === 'yearly' ? 'default' : 'ghost'}
                  onClick={() => setBillingPeriod('yearly')}
                  className={billingPeriod === 'yearly' ? 'bg-gradient-to-r from-primary to-secondary' : ''}
                >
                  Годовая подписка
                  <Badge className="ml-2 bg-green-500 text-white border-none">-17%</Badge>
                </Button>
              </div>
            </Card>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {(Object.keys(plans) as Array<keyof typeof plans>).map((planKey) => {
              const plan = plans[planKey];
              const isSelected = selectedPlan === planKey;
              
              return (
                <Card
                  key={planKey}
                  className={`relative transition-all duration-300 border-2 cursor-pointer ${
                    isSelected
                      ? 'border-primary shadow-2xl scale-105 -translate-y-2'
                      : 'border-transparent hover:border-gray-300'
                  } ${plan.popular ? 'ring-4 ring-primary/20' : ''}`}
                  onClick={() => setSelectedPlan(planKey)}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-primary to-secondary text-white border-none px-4 py-1">
                        🔥 Популярный
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pt-8">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mx-auto mb-4`}>
                      <Icon name={plan.icon as any} className="text-white" size={32} />
                    </div>
                    <CardTitle className="text-2xl font-heading">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <div className="text-4xl font-bold text-gray-900">
                        {formatMoney(getPrice(planKey))}
                      </div>
                      <p className="text-gray-600 mt-1">
                        {billingPeriod === 'monthly' ? '/ месяц' : '/ год'}
                      </p>
                      {billingPeriod === 'yearly' && (
                        <Badge className="mt-2 bg-green-50 text-green-700 border-green-200">
                          Экономия {formatMoney(getSavings(planKey))}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <Icon name="CheckCircle2" className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button
                      className={`w-full mt-6 ${
                        isSelected 
                          ? 'bg-gradient-to-r from-primary to-secondary hover:opacity-90' 
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                      size="lg"
                    >
                      {isSelected ? 'Выбрано' : 'Выбрать план'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Icon name="Gift" className="text-primary" size={28} />
                  Что вы получаете
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg">
                  <Icon name="Users" className="text-primary flex-shrink-0" size={24} />
                  <div>
                    <h4 className="font-bold mb-1">Сеть из 500+ партнёров</h4>
                    <p className="text-sm text-gray-600">Отели, туроператоры, организаторы мероприятий по всему миру</p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 bg-gradient-to-r from-secondary/5 to-accent/5 rounded-lg">
                  <Icon name="Zap" className="text-secondary flex-shrink-0" size={24} />
                  <div>
                    <h4 className="font-bold mb-1">Автоматизация процессов</h4>
                    <p className="text-sm text-gray-600">CRM, бронирования, аналитика — всё в одной платформе</p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 bg-gradient-to-r from-accent/5 to-primary/5 rounded-lg">
                  <Icon name="Calendar" className="text-accent flex-shrink-0" size={24} />
                  <div>
                    <h4 className="font-bold mb-1">Закрытые мероприятия</h4>
                    <p className="text-sm text-gray-600">Нетворкинг, мастер-классы, деловые туры 4 раза в год</p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg">
                  <Icon name="TrendingUp" className="text-primary flex-shrink-0" size={24} />
                  <div>
                    <h4 className="font-bold mb-1">Рост выручки до 40%</h4>
                    <p className="text-sm text-gray-600">В среднем наши партнёры увеличивают доход на 40% в первый год</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Icon name="UserPlus" className="text-primary" size={28} />
                  Заявка на вступление
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubscribe} className="space-y-5">
                  <div className="space-y-2">
                    <Label>Ваше имя *</Label>
                    <Input placeholder="Иван Петров" required className="h-12" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input type="email" placeholder="ivan@example.com" required className="h-12" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Телефон *</Label>
                    <Input type="tel" placeholder="+7 (999) 123-45-67" required className="h-12" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Компания *</Label>
                    <Input placeholder="Название вашей компании" required className="h-12" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Тип бизнеса *</Label>
                    <select className="w-full h-12 px-4 rounded-md border border-input bg-background" required>
                      <option value="">Выберите</option>
                      <option value="hotel">Отель</option>
                      <option value="glamping">Глемпинг</option>
                      <option value="resort">База отдыха</option>
                      <option value="agency">Турагентство</option>
                      <option value="other">Другое</option>
                    </select>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-semibold mb-2">Выбранный тариф:</p>
                    <p className="text-2xl font-bold text-primary">
                      {plans[selectedPlan].name} — {formatMoney(getPrice(selectedPlan))}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {billingPeriod === 'monthly' ? 'Ежемесячная оплата' : 'Годовая подписка'}
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <Checkbox id="terms" required />
                    <label htmlFor="terms" className="text-sm text-gray-600 leading-tight">
                      Согласен с условиями членства в клубе и обработкой персональных данных
                    </label>
                  </div>
                  
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-lg"
                  >
                    Отправить заявку
                    <Icon name="Send" className="ml-2" size={20} />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-xl bg-gradient-to-br from-slate-900 to-purple-900 text-white">
            <CardContent className="py-12">
              <div className="max-w-3xl mx-auto text-center">
                <Icon name="Quote" className="mx-auto mb-6 text-white/30" size={48} />
                <blockquote className="text-2xl font-heading mb-6 italic">
                  "Вступление в клуб TourConnect изменило наш бизнес. За 6 месяцев мы увеличили загрузку с 45% до 78% и нашли 12 надёжных партнёров."
                </blockquote>
                <div className="flex items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold">
                    АК
                  </div>
                  <div className="text-left">
                    <p className="font-bold">Алексей Карпов</p>
                    <p className="text-white/70">Владелец глемпинга "Звёздное небо"</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Club;
