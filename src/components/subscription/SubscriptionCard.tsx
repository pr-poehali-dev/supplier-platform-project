import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface SubscriptionCardProps {
  subscription: {
    id: string;
    plan_code: string;
    amount: number;
    status: string;
    current_period_end?: string;
    cancel_at_period_end?: boolean;
    payment_method?: {
      card_type: string;
      card_last4: string;
    };
  } | null;
  onCancel: () => void;
  onChangePlan: () => void;
}

export default function SubscriptionCard({ subscription, onCancel, onChangePlan }: SubscriptionCardProps) {
  console.log('SubscriptionCard render:', {
    subscription,
    has_payment_method: !!subscription?.payment_method,
    cancel_at_period_end: subscription?.cancel_at_period_end
  });

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Подписка</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">У вас нет активной подписки</p>
          <Button onClick={onChangePlan} className="w-full">
            <Icon name="CreditCard" size={18} className="mr-2" />
            Выбрать тариф
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Активна</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Ожидает оплаты</Badge>;
      case 'payment_failed':
        return <Badge className="bg-red-500">Ошибка оплаты</Badge>;
      case 'canceled':
        return <Badge className="bg-gray-500">Отменена</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPlanEmoji = (planCode: string) => {
    switch (planCode.toLowerCase()) {
      case 'start':
        return '🟢';
      case 'pro':
        return '🔵';
      case 'business':
        return '🟣';
      default:
        return '📦';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Подписка</CardTitle>
          <div className="flex gap-2">
            {getStatusBadge(subscription.status)}
            {subscription.cancel_at_period_end && subscription.status === 'active' && (
              <Badge className="bg-orange-500">
                <Icon name="Clock" size={14} className="mr-1" />
                До конца периода
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getPlanEmoji(subscription.plan_code)}</span>
          <div>
            <h3 className="text-xl font-bold">{subscription.plan_code.toUpperCase()}</h3>
            <p className="text-gray-600">
              {subscription.amount.toLocaleString('ru-RU')} ₽/мес
            </p>
          </div>
        </div>

        {subscription.current_period_end && (
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">
              {subscription.cancel_at_period_end ? (
                <>
                  Доступ до:{' '}
                  <span className="font-semibold text-orange-600">
                    {new Date(subscription.current_period_end).toLocaleDateString('ru-RU')}
                  </span>
                </>
              ) : (
                <>
                  Следующее списание:{' '}
                  <span className="font-semibold">
                    {new Date(subscription.current_period_end).toLocaleDateString('ru-RU')}
                  </span>
                </>
              )}
            </p>
          </div>
        )}

        {subscription.payment_method && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Icon name="CreditCard" size={16} />
                <span>
                  {subscription.payment_method.card_type} •••• {subscription.payment_method.card_last4}
                </span>
              </div>
              {!subscription.cancel_at_period_end && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  className="text-red-600 hover:text-red-700 h-auto p-1"
                  title="Отвязать карту"
                >
                  <Icon name="Trash2" size={14} />
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onChangePlan}
            className="flex-1"
          >
            <Icon name="RefreshCw" size={16} className="mr-2" />
            Сменить тариф
          </Button>
          
          {subscription.status === 'active' && !subscription.cancel_at_period_end && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 text-red-600 hover:text-red-700"
            >
              <Icon name="X" size={16} className="mr-2" />
              Отменить
            </Button>
          )}
        </div>

        {subscription.status === 'payment_failed' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              <Icon name="AlertCircle" size={16} className="inline mr-1" />
              Не удалось списать платёж. Проверьте данные карты или привяжите новую.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}