import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    const invId = searchParams.get('InvId');
    const outSum = searchParams.get('OutSum');
    
    if (invId && outSum) {
      setPaymentData({
        invId,
        amount: outSum,
      });
    }
    
    const loadSubscription = async () => {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('https://functions.poehali.dev/578f8247-37f6-47e4-a3ce-744df886fc3f', {
          method: 'GET',
          headers: {
            'X-Authorization': `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.subscription) {
            localStorage.setItem('subscription_cache', JSON.stringify(data.subscription));
          }
        }
      } catch (error) {
        console.error('Failed to load subscription:', error);
      } finally {
        setIsLoading(false);
      }
    };

    setTimeout(() => {
      loadSubscription();
    }, 2000);
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center">
        <Card className="max-w-md w-full border-none shadow-2xl">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold mb-2">Проверяем платёж...</h2>
            <p className="text-gray-600">Подождите немного</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full border-none shadow-2xl">
        <CardContent className="p-12 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mx-auto mb-6 animate-bounce">
            <Icon name="CheckCircle2" className="text-green-600" size={56} />
          </div>
          
          <Badge className="mb-4 bg-green-50 text-green-700 border-green-200">
            ✅ Оплата успешно завершена
          </Badge>
          
          <h1 className="text-4xl font-bold font-heading mb-4">
            Добро пожаловать в TourConnect!
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Ваша подписка активирована. Теперь у вас есть полный доступ ко всем инструментам платформы.
          </p>

          {paymentData && (
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 mb-8">
              <div className="text-sm text-gray-600 mb-2">Номер платежа: {paymentData.invId}</div>
              <div className="text-2xl font-bold text-primary">
                {parseFloat(paymentData.amount).toLocaleString('ru-RU')} ₽
              </div>
            </div>
          )}
          
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <Icon name="Calendar" className="text-primary mx-auto mb-2" size={32} />
              <h3 className="font-semibold mb-1">Календарь</h3>
              <p className="text-xs text-gray-600">Управление бронью</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <Icon name="Activity" className="text-secondary mx-auto mb-2" size={32} />
              <h3 className="font-semibold mb-1">Диагностика</h3>
              <p className="text-xs text-gray-600">Анализ бизнеса</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <Icon name="Users" className="text-purple-600 mx-auto mb-2" size={32} />
              <h3 className="font-semibold mb-1">Клуб</h3>
              <p className="text-xs text-gray-600">Нетворкинг</p>
            </div>
          </div>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              onClick={() => navigate('/booking-calendar')}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              Открыть календарь
              <Icon name="ArrowRight" className="ml-2" size={20} />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/profile')}
            >
              Мой профиль
            </Button>
          </div>

          <p className="text-sm text-gray-500 mt-8">
            Чек отправлен на ваш email. Если у вас есть вопросы — <a href="/#contact" className="text-primary hover:underline">свяжитесь с нами</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;