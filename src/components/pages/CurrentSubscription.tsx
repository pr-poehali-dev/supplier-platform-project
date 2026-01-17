import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface CurrentSubscriptionProps {
  currentPlan: string;
  user: any;
  planEmoji: string;
  planName: string;
  onRenew: () => void;
  onCancelAutoRenew: () => void;
  onBackToProfile: () => void;
}

export default function CurrentSubscription({
  currentPlan,
  user,
  planEmoji,
  planName,
  onRenew,
  onCancelAutoRenew,
  onBackToProfile
}: CurrentSubscriptionProps) {
  return (
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
                {planEmoji} {planName}
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
              onClick={onRenew}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90"
            >
              <Icon name="RefreshCcw" className="mr-2" size={18} />
              Продлить подписку
            </Button>
            
            <Button
              onClick={onCancelAutoRenew}
              variant="outline"
              className="w-full"
            >
              <Icon name="XCircle" className="mr-2" size={18} />
              Отменить автопродление
            </Button>
            
            <Button
              onClick={onBackToProfile}
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
  );
}
