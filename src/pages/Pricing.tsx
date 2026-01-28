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
      id: 1,
      planId: 'start' as const,
      name: 'START',
      price: 2450,
      emoji: '🟢',
      description: 'Для одиночных объектов',
      limits: 'до 1 объекта размещения',
      features: [
        'Календарь бронирования',
        '1 объект размещения',
        'До 50 броней в месяц',
        'Telegram-бот для брони',
        'Базовая аналитика',
        'Email поддержка',
      ],
      popular: false,
      color: 'from-green-500 to-emerald-600',
    },
    {
      id: 2,
      planId: 'pro' as const,
      name: 'PRO',
      price: 4490,
      emoji: '🔵',
      description: 'Основной тариф для большинства',
      limits: 'До 5 объектов размещения',
      features: [
        'Всё из тарифа START',
        'До 5 объектов',
        'До 200 броней в месяц',
        'Приоритетная поддержка',
        'Расширенная аналитика',
        'Доступ к закрытому каналу',
      ],
      popular: true,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      id: 3,
      planId: 'business' as const,
      name: 'BUSINESS',
      price: 7490,
      emoji: '🟣',
      description: 'Для баз отдыха и глэмпингов',
      limits: 'Без ограничений на объекты',
      features: [
        'Всё из тарифа PRO',
        'Неограниченное кол-во объектов',
        'Неограниченное кол-во броней',
        'Приоритетная поддержка 24/7',
        'API доступ',
        'Персональный менеджер',
      ],
      popular: false,
      color: 'from-purple-500 to-pink-600',
    },
  ];

  const handleSelectPlan = (planId: 'start' | 'pro' | 'business') => {
    if (!user) {
      alert('Пожалуйста, войдите в аккаунт для подписки на тариф');
      navigate('/auth');
      return;
    }
    setSelectedPlan(planId);
  };

  const handlePayment = async () => {
    if (!selectedPlan || !user) return;
    
    const plan = plans.find(p => p.planId === selectedPlan);
    if (!plan) return;

    try {
      const response = await fetch('https://functions.poehali.dev/2caae688-634f-4a76-b90b-0009fc13ee84', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          plan_id: plan.id,
          user_email: user.email,
          return_url: `${window.location.origin}/profile?subscription=success`,
        }),
      });

      const data = await response.json();
      
      if (data.confirmation_url) {
        // Redirect to YooKassa payment page
        window.location.href = data.confirmation_url;
      } else {
        alert('Ошибка создания подписки: ' + (data.error || 'Неизвестная ошибка'));
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Ошибка при создании подписки. Попробуйте позже.');
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