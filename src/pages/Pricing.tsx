import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { getUserSubscription, getPlanName, getPlanEmoji } from '@/utils/subscription';
import { usePageMeta } from '@/hooks/usePageMeta';
import JsonLd from '@/components/seo/JsonLd';
import { softwareApplicationSchema, breadcrumbSchema } from '@/utils/seo';
import PricingCard from '@/components/pages/PricingCard';
import CurrentSubscription from '@/components/pages/CurrentSubscription';
import UserProfile from '@/components/navigation/UserProfile';

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
      price: 2450,
      emoji: '🟢',
      description: 'Для одиночных объектов',
      limits: 'до 2 объектов / номеров',
      features: [
        'Календарь бронирования',
        'До 2 номеров',
        'Telegram-бот для брони',
        'Max-бот для брони',
        'Базовая аналитика',
        'Email поддержка',
      ],
      popular: false,
      color: 'from-green-500 to-emerald-600',
    },
    {
      id: 'pro' as const,
      name: 'PRO',
      price: 4490,
      emoji: '🔵',
      description: 'Основной тариф для большинства',
      limits: 'До 10 объектов / номеров',
      features: [
        'Всё из тарифа START',
        'До 10 номеров',
        'Доступ к закрытому каналу',
      ],
      popular: true,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      id: 'business' as const,
      name: 'BUSINESS',
      price: 7490,
      emoji: '🟣',
      description: 'Для баз отдыха и глэмпингов',
      limits: 'До 30 объектов / номеров',
      features: [
        'Всё из тарифа PRO',
        'До 30 номеров',
        'Приоритетная поддержка',
      ],
      popular: false,
      color: 'from-purple-500 to-pink-600',
    },
  ];

  const handleSelectPlan = (planId: 'start' | 'pro' | 'business') => {
    setSelectedPlan(planId);
  };

  const handlePayment = async () => {
    if (!selectedPlan || !user) return;
    
    try {
      const response = await fetch('https://functions.poehali.dev/2e481bdd-814f-4a67-a604-c4dfa33d848c', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({ plan_code: selectedPlan })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка создания подписки');
      }
      
      const { paymentUrl } = await response.json();
      window.location.href = paymentUrl;
    } catch (error: any) {
      alert(error.message || 'Не удалось создать подписку. Попробуйте позже.');
    }
  };

  const handleRenew = () => {
    const currentPlanData = plans.find(p => p.id === currentPlan);
    if (currentPlanData) navigate('/payment', { state: { plan: currentPlanData, isRenewal: true } });
  };

  const handleCancelAutoRenew = () => {
    if (confirm('Вы уверены? Подписка будет отменена в конце текущего периода.')) {
      alert('Автопродление отключено. Подписка останется активной до ' + 
        new Date(user.subscription_expires_at).toLocaleDateString('ru-RU'));
    }
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

      <div className="fixed top-4 right-4 z-50">
        <UserProfile user={user} />
      </div>

      <div className="container mx-auto px-4 py-20">
        {currentPlan !== 'none' && user && (
          <CurrentSubscription
            currentPlan={currentPlan}
            user={user}
            planEmoji={getPlanEmoji(currentPlan)}
            planName={getPlanName(currentPlan)}
            onRenew={handleRenew}
            onCancelAutoRenew={handleCancelAutoRenew}
            onBackToProfile={() => navigate('/profile')}
          />
        )}

        <div className="text-center mb-16 animate-fade-in">
          <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            Выберите свой тариф
          </Badge>
          <h1 className="text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Прозрачные цены. Без скрытых платежей
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Все тарифы включают полный доступ к платформе. Выбирайте по количеству номеров
          </p>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-500 flex-wrap">
            <div className="flex items-center gap-2">
              <Icon name="Check" size={16} className="text-green-600" />
              Подписка списывается автоматически раз в месяц
            </div>
            <div className="flex items-center gap-2">
              <Icon name="X" size={16} className="text-gray-400" />
              Никаких скрытых комиссий
            </div>
            <div className="flex items-center gap-2">
              <Icon name="RotateCcw" size={16} className="text-blue-600" />
              Отменить можно в любой момент
            </div>
          </div>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/tochka-test')}
              className="gap-2 text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <Icon name="TestTube" size={14} />
              Тестирование интеграции Точка Банк
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              {...plan}
              selected={selectedPlan === plan.id}
              isCurrent={currentPlan === plan.id}
              onSelect={() => handleSelectPlan(plan.id)}
            />
          ))}
        </div>

        {selectedPlan && (
          <div className="max-w-2xl mx-auto text-center animate-fade-in">
            <Button
              onClick={handlePayment}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-6 text-lg"
            >
              Перейти к оплате
              <Icon name="ArrowRight" size={20} className="ml-2" />
            </Button>
          </div>
        )}

        {/* Roadmap Link */}
        <div className="max-w-2xl mx-auto text-center mt-12 pt-12 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={() => navigate('/roadmap')}
            className="gap-2"
          >
            <Icon name="Map" size={18} />
            Узнайте, как развивается сервис
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;