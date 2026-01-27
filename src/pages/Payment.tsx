import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { fetchWithAuth } from '@/lib/api';

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { plan } = location.state || {};
  
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');

  useEffect(() => {
    if (!plan) {
      navigate('/pricing');
      return;
    }

    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setEmail(user.email || '');
      setName(user.full_name || '');
    }

    // Загружаем платежную ссылку для этого тарифа
    fetchPaymentUrl();
  }, [plan, navigate]);

  const fetchPaymentUrl = async () => {
    try {
      const response = await fetchWithAuth('https://functions.poehali.dev/9f1887ba-ac1c-402a-be0d-4ae5c1a9175d?action=get_subscription_payment_links');
      const data = await response.json();
      const link = data.links?.find((l: any) => l.plan_type === plan.id);
      if (link?.payment_url) {
        setPaymentUrl(link.payment_url);
      }
    } catch (error) {
      console.error('Failed to load payment URL:', error);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      toast({
        title: 'Примите условия',
        description: 'Необходимо согласиться с условиями оферты',
        variant: 'destructive',
      });
      return;
    }

    if (!paymentUrl) {
      toast({
        title: 'Ошибка',
        description: 'Платежная ссылка не настроена. Свяжитесь с поддержкой.',
        variant: 'destructive',
      });
      return;
    }

    // Если это Enterprise - открываем Telegram
    if (plan.id === 'enterprise') {
      window.open(paymentUrl, '_blank');
      return;
    }

    setIsProcessing(true);

    // Сохраняем информацию о намерении оплаты
    try {
      await fetchWithAuth('https://functions.poehali.dev/6c81ac6e-86fa-4b52-b7fa-f49593ba95f4', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: plan.id,
          amount: plan.price,
          email,
          phone,
          name,
        }),
      });
    } catch (error) {
      console.error('Failed to log payment intent:', error);
    }

    // Перенаправляем на платежную ссылку
    window.location.href = paymentUrl;
  };

  if (!plan) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 py-20 px-4">
      <Button
        variant="ghost"
        onClick={() => navigate('/pricing')}
        className="fixed top-4 left-4 gap-2 z-50"
      >
        <Icon name="ArrowLeft" size={20} />
        Назад к тарифам
      </Button>

      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12 animate-fade-in">
          <Badge className="mb-4 bg-gradient-to-r from-primary to-secondary text-white border-none">
            💳 Оплата подписки
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold font-heading mb-4">
            Оформление подписки
          </h1>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-none shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-heading">Ваш заказ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl">{plan.emoji}</div>
                  <div>
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    <p className="text-sm text-gray-600">{plan.description}</p>
                  </div>
                </div>
                <Badge variant="outline" className="mb-4">
                  {plan.limits}
                </Badge>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Подписка (месяц)</span>
                    <span className="font-semibold">{plan.price.toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Итого:</span>
                    <span className="text-primary">{plan.price.toLocaleString('ru-RU')} ₽</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Что входит:</h4>
                {plan.features.slice(0, 5).map((feature: string, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <Icon name="CheckCircle2" className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
                {plan.features.length > 5 && (
                  <p className="text-sm text-gray-500">+ ещё {plan.features.length - 5} возможностей</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-heading">Контактные данные</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePayment} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Имя *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Иван Иванов"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    На этот email придёт подтверждение оплаты
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 900 123-45-67"
                    required
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex gap-3">
                    <Icon name="Shield" className="text-blue-600 flex-shrink-0" size={20} />
                    <div className="text-sm text-blue-900">
                      <p className="font-semibold mb-1">Безопасная оплата</p>
                      <p className="text-xs">
                        Оплата проходит через защищённый платёжный шлюз
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
                    Я принимаю{' '}
                    <a href="/oferta" target="_blank" className="text-primary hover:underline">
                      условия публичной оферты
                    </a>{' '}
                    и даю согласие на обработку персональных данных
                  </label>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isProcessing || !agreedToTerms}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                >
                  {isProcessing ? (
                    <>
                      <Icon name="Loader2" className="mr-2 animate-spin" size={20} />
                      Обработка...
                    </>
                  ) : (
                    <>
                      Оплатить {plan.price.toLocaleString('ru-RU')} ₽
                      <Icon name="ArrowRight" className="ml-2" size={20} />
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500">
                  После оплаты вы будете перенаправлены обратно на сайт
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Payment;