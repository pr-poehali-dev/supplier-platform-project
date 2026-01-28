import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { getPlanName, getPlanEmoji, SubscriptionLimits, getSubscriptionLimits } from '@/utils/subscription';
import { useSubscription } from '@/hooks/useSubscription';

interface SubscriptionGuardProps {
  feature: keyof Omit<SubscriptionLimits, 'maxUnits'>;
  children: React.ReactNode;
  featureName?: string;
}

const SubscriptionGuard = ({ feature, children, featureName = 'этой функции' }: SubscriptionGuardProps) => {
  const navigate = useNavigate();
  const { subscription, loading } = useSubscription();
  const isDevelopment = import.meta.env.DEV;
  const isEditorMode = window.location.hostname.includes('poehali.dev') || window.location.hostname === 'localhost';
  
  // В режиме разработки и preview всегда даем доступ
  if (isDevelopment || isEditorMode) {
    return <>{children}</>;
  }
  
  // Wait for subscription to load
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader2" className="animate-spin mx-auto mb-4" size={40} />
          <p className="text-gray-600">Проверка подписки...</p>
        </div>
      </div>
    );
  }
  
  // Check access based on API subscription data
  const currentPlan = subscription?.plan_code || 'none';
  const limits = getSubscriptionLimits(currentPlan as any);
  
  // Check if subscription is active (even if cancel_at_period_end = true)
  const isActive = subscription?.status === 'active';
  
  // Check if cancelled but still within period
  const isCancelledButValid = subscription?.status === 'cancelled' && 
    subscription?.current_period_end && 
    new Date(subscription.current_period_end) > new Date();
  
  // Debug
  console.log('SubscriptionGuard check:', {
    status: subscription?.status,
    cancel_at_period_end: subscription?.cancel_at_period_end,
    current_period_end: subscription?.current_period_end,
    isActive,
    isCancelledButValid,
    hasFeatureAccess: limits[feature]
  });
  
  const hasAccess = limits[feature] && (isActive || isCancelledButValid);
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center p-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 gap-2 z-50"
      >
        <Icon name="Home" size={20} />
        На главную
      </Button>

      <Card className="max-w-2xl w-full border-none shadow-2xl">
        <CardContent className="p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center mx-auto mb-6">
            <Icon name="Lock" className="text-orange-600" size={40} />
          </div>
          
          <Badge className="mb-4 bg-orange-50 text-orange-700 border-orange-200">
            {getPlanEmoji(currentPlan)} {getPlanName(currentPlan)}
          </Badge>
          
          <h1 className="text-4xl font-bold font-heading mb-4">
            Требуется подписка
          </h1>
          
          <p className="text-xl text-gray-600 mb-4">
            Для доступа к {featureName.replace('календаря бронирования', 'календарю бронирования')} необходима активная подписка на один из тарифов
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3 text-left">
              <Icon name="AlertCircle" className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-blue-800">
                <strong>Уже купили подписку?</strong>
                <p className="mt-1">Перейдите в Личный кабинет и нажмите кнопку "Обновить данные", чтобы система загрузила информацию о вашей подписке.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4 text-left">
              <Icon name="Info" className="text-primary flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-semibold text-lg mb-2">Доступные тарифы:</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <Icon name="CheckCircle2" className="text-green-500" size={16} />
                    🟢 <strong>START</strong> — от 2 490₽/мес
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="CheckCircle2" className="text-green-500" size={16} />
                    🔵 <strong>PRO</strong> — от 5 990₽/мес (популярный)
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="CheckCircle2" className="text-green-500" size={16} />
                    🟣 <strong>BUSINESS</strong> — от 9 990₽/мес
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/pricing')}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              Выбрать тариф
              <Icon name="ArrowRight" className="ml-2" size={20} />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/profile')}
            >
              <Icon name="User" className="mr-2" size={20} />
              Личный кабинет
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => navigate('/')}
            >
              На главную
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionGuard;