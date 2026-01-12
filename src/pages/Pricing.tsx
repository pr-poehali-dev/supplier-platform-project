import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { getUserSubscription, getPlanName, getPlanEmoji } from '@/utils/subscription';
import { usePageMeta } from '@/hooks/usePageMeta';
import JsonLd from '@/components/seo/JsonLd';
import { softwareApplicationSchema, breadcrumbSchema } from '@/utils/seo';

const Pricing = () => {
  usePageMeta({
    title: 'Тарифы',
    description: 'Выберите подходящий тариф TOURCONNECT: Старт, Про или Бизнес. Доступ к инструментам управления туристическим бизнесом',
    keywords: 'тарифы, подписка, цены TOURCONNECT, стоимость услуг'
  });
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<'start' | 'pro' | 'business' | null>(null);
  const [user, setUser] = useState<any>(null);
  const currentPlan = getUserSubscription();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const plans = [
    {
      id: 'start' as const,
      name: 'START',
      price: 2490,
      emoji: '🟢',
      description: 'Для одиночных объектов',
      limits: '1 объект / до 2 номеров',
      features: [
        'Календарь бронирования',
        'До 2 номеров',
        'Базовая аналитика',
        'Email поддержка',
        'Доступ к диагностике',
        'Telegram бот для брони',
      ],
      popular: false,
      color: 'from-green-500 to-emerald-600',
    },
    {
      id: 'pro' as const,
      name: 'PRO',
      price: 5990,
      emoji: '🔵',
      description: 'Основной тариф для большинства',
      limits: 'До 10 номеров',
      features: [
        'Всё из тарифа START',
        'До 10 номеров',
        'Продвинутая аналитика',
        'Приоритетная поддержка',
        'Доступ к закрытому клубу',
        'Симулятор бизнеса PRO',
        'Персональные рекомендации',
        'Скидки от партнёров 10%',
      ],
      popular: true,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      id: 'business' as const,
      name: 'BUSINESS',
      price: 9990,
      emoji: '🟣',
      description: 'Для баз отдыха и глэмпингов',
      limits: 'До 30 номеров',
      features: [
        'Всё из тарифа PRO',
        'До 30 номеров',
        'Полная аналитика и отчёты',
        'Dedicated менеджер 24/7',
        'API интеграции',
        'Белый лейбл',
        'Приоритет в рейтинге',
        'Маркетинговая поддержка',
        'Скидки от партнёров 20%',
      ],
      popular: false,
      color: 'from-purple-500 to-pink-600',
    },
  ];

  const handleSelectPlan = (planId: 'start' | 'pro' | 'business') => {
    setSelectedPlan(planId);
  };

  const handlePayment = () => {
    if (!selectedPlan) return;
    const plan = plans.find(p => p.id === selectedPlan);
    navigate('/payment', { state: { plan } });
  };

  const breadcrumbs = breadcrumbSchema([
    { name: 'Главная', url: '/' },
    { name: 'Тарифы', url: '/pricing' }
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      <JsonLd data={softwareApplicationSchema} />
      <JsonLd data={breadcrumbs} />
      
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 gap-2 z-50"
      >
        <Icon name="Home" size={20} />
        На главную
      </Button>

      <div className="container mx-auto px-4 py-20">
        {currentPlan !== 'none' && user && (
          <Card className="mb-12 max-w-4xl mx-auto border-2 border-primary shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Icon name="Crown" className="text-yellow-500" size={28} />
                Ваша активная подписка
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="text-sm text-gray-600 mb-1 block">Текущий тариф</label>
                    <Badge 
                      className={`text-lg px-4 py-2 ${
                        currentPlan === 'start' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                        currentPlan === 'pro' ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
                        'bg-gradient-to-r from-purple-500 to-violet-600'
                      } text-white`}
                    >
                      {getPlanEmoji(currentPlan)} {getPlanName(currentPlan)}
                    </Badge>
                  </div>
                  {user.subscription_expires_at && (
                    <div className="mb-4">
                      <label className="text-sm text-gray-600 mb-1 block">Действует до</label>
                      <div className="flex items-center gap-2">
                        <Icon name="Calendar" size={18} />
                        <span className="text-lg font-semibold">
                          {new Date(user.subscription_expires_at).toLocaleDateString('ru-RU', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                  {user.auto_renew && (
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Автопродление</label>
                      <Badge variant="outline" className="text-sm">
                        <Icon name="RefreshCw" size={14} className="mr-1" />
                        Включено
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => {
                      const currentPlanData = plans.find(p => p.id === currentPlan);
                      if (currentPlanData) navigate('/payment', { state: { plan: currentPlanData, isRenewal: true } });
                    }}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90"
                  >
                    <Icon name="RefreshCcw" className="mr-2" size={18} />
                    Продлить подписку
                  </Button>
                  
                  <Button
                    onClick={() => {
                      if (confirm('Вы уверены? Подписка будет отменена в конце текущего периода.')) {
                        alert('Автопродление отключено. Подписка останется активной до ' + 
                          new Date(user.subscription_expires_at).toLocaleDateString('ru-RU'));
                      }
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Icon name="XCircle" className="mr-2" size={18} />
                    Отменить автопродление
                  </Button>
                  
                  <Button
                    onClick={() => navigate('/profile')}
                    variant="ghost"
                    className="w-full"
                  >
                    <Icon name="User" className="mr-2" size={18} />
                    Вернуться в профиль
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center mb-16 animate-fade-in">
          <Badge className="mb-4 bg-gradient-to-r from-primary to-secondary text-white border-none">
            💎 {currentPlan !== 'none' ? 'Улучшить тариф' : 'Выберите тариф'}
          </Badge>
          <h1 className="text-5xl lg:text-6xl font-bold font-heading mb-4">
            {currentPlan !== 'none' ? 'Доступные тарифы' : 'Тарифы и подписки'}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Получите доступ к инструментам календаря, диагностики и закрытому клубу профессионалов туризма
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-12">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            
            return (
              <Card
                key={plan.id}
                className={`relative transition-all duration-300 border-2 cursor-pointer ${
                  isSelected
                    ? 'border-primary shadow-2xl scale-105 -translate-y-2'
                    : 'border-transparent hover:border-gray-300'
                } ${plan.popular ? 'ring-4 ring-primary/20' : ''}`}
                onClick={() => handleSelectPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-primary to-secondary text-white border-none px-4 py-1">
                      🔥 Популярный — 70% выбирают этот
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pt-8">
                  <div className="text-5xl mb-4">{plan.emoji}</div>
                  <CardTitle className="text-3xl font-heading mb-2">
                    {plan.name}
                  </CardTitle>
                  <p className="text-sm text-gray-500 mb-2">{plan.description}</p>
                  <Badge variant="outline" className="mb-4">
                    {plan.limits}
                  </Badge>
                  <div className="text-5xl font-bold text-gray-900 mb-2">
                    {plan.price.toLocaleString('ru-RU')} ₽
                  </div>
                  <p className="text-gray-600">/ месяц</p>
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
                    {isSelected ? 'Выбрано ✓' : 'Выбрать тариф'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="max-w-4xl mx-auto border-2 border-gray-800 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
          <CardContent className="p-8 text-center">
            <div className="text-5xl mb-4">🔴</div>
            <h3 className="text-3xl font-bold font-heading mb-3">ENTERPRISE / CUSTOM</h3>
            <p className="text-gray-300 mb-4">
              Индивидуальные условия для крупных сетей и уникальных проектов
            </p>
            <Badge className="mb-6 bg-white/10 text-white border-white/20">
              Безлимитные номера и объекты
            </Badge>
            <div className="grid md:grid-cols-2 gap-4 mb-6 text-left">
              <div className="flex items-start gap-3">
                <Icon name="CheckCircle2" className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
                <span className="text-sm">Безлимитные объекты</span>
              </div>
              <div className="flex items-start gap-3">
                <Icon name="CheckCircle2" className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
                <span className="text-sm">Dedicated команда поддержки</span>
              </div>
              <div className="flex items-start gap-3">
                <Icon name="CheckCircle2" className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
                <span className="text-sm">Кастомные интеграции</span>
              </div>
              <div className="flex items-start gap-3">
                <Icon name="CheckCircle2" className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
                <span className="text-sm">Персональный аккаунт-менеджер</span>
              </div>
              <div className="flex items-start gap-3">
                <Icon name="CheckCircle2" className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
                <span className="text-sm">SLA 99.9% uptime</span>
              </div>
              <div className="flex items-start gap-3">
                <Icon name="CheckCircle2" className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
                <span className="text-sm">Приоритет в разработке функций</span>
              </div>
            </div>
            <Button 
              size="lg" 
              variant="outline"
              className="bg-white text-gray-900 hover:bg-gray-100 border-white"
              onClick={() => window.open('https://t.me/Maxim_Romantsov', '_blank')}
            >
              Свяжитесь с нами
              <Icon name="Send" className="ml-2" size={20} />
            </Button>
          </CardContent>
        </Card>

        {selectedPlan && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 p-6 shadow-2xl z-50">
            <div className="container mx-auto flex items-center justify-between max-w-4xl">
              <div>
                <div className="text-sm text-gray-600">Выбранный тариф:</div>
                <div className="text-2xl font-bold">
                  {plans.find(p => p.id === selectedPlan)?.emoji} {plans.find(p => p.id === selectedPlan)?.name}
                  <span className="text-primary ml-2">
                    {plans.find(p => p.id === selectedPlan)?.price.toLocaleString('ru-RU')} ₽/мес
                  </span>
                </div>
              </div>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                onClick={handlePayment}
              >
                Перейти к оплате
                <Icon name="ArrowRight" className="ml-2" size={20} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pricing;