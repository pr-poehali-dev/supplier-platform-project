import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { fetchWithAuth } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  email: string;
  full_name: string;
  subscription_plan: string;
  subscription_expires_at?: string;
}

interface SubscriptionManagerProps {
  users: User[];
  onUpdate: () => void;
}

const SubscriptionManager = ({ users, onUpdate }: SubscriptionManagerProps) => {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('none');
  const [months, setMonths] = useState<number>(1);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const plans = [
    { id: 'none', name: 'Без подписки', emoji: '⚪', color: 'bg-gray-100 text-gray-700' },
    { id: 'start', name: 'START', emoji: '🟢', color: 'bg-green-100 text-green-700' },
    { id: 'pro', name: 'PRO', emoji: '🔵', color: 'bg-blue-100 text-blue-700' },
    { id: 'business', name: 'BUSINESS', emoji: '🟣', color: 'bg-purple-100 text-purple-700' },
    { id: 'enterprise', name: 'ENTERPRISE', emoji: '🔴', color: 'bg-red-100 text-red-700' },
  ];

  const handleOpenDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedPlan(user.subscription_plan || 'none');
    setIsOpen(true);
  };

  const handleUpdateSubscription = async () => {
    if (!selectedUser) return;

    setIsLoading(true);
    try {
      const response = await fetchWithAuth('https://functions.poehali.dev/a3b103f1-3e4d-4066-9bbe-f303bc55720a', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          plan: selectedPlan,
          months: selectedPlan === 'none' ? 0 : months,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: '✅ Подписка обновлена',
          description: `Пользователь ${selectedUser.full_name || selectedUser.email} получил план ${selectedPlan.toUpperCase()}`,
        });
        setIsOpen(false);
        onUpdate();
      } else {
        throw new Error(data.error || 'Ошибка обновления подписки');
      }
    } catch (error: any) {
      toast({
        title: '❌ Ошибка',
        description: error.message || 'Не удалось обновить подписку',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanBadge = (plan: string) => {
    const planData = plans.find(p => p.id === plan) || plans[0];
    return (
      <Badge className={planData.color}>
        {planData.emoji} {planData.name}
      </Badge>
    );
  };

  const formatExpiryDate = (date?: string) => {
    if (!date) return 'Не установлена';
    const d = new Date(date);
    if (d < new Date()) return <span className="text-red-600">Истекла</span>;
    return new Date(date).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Crown" size={24} />
          Управление подписками
        </CardTitle>
        <CardDescription>
          Назначайте и изменяйте подписки пользователей вручную
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <p className="font-semibold">{user.full_name || 'Без имени'}</p>
                  {getPlanBadge(user.subscription_plan)}
                </div>
                <p className="text-sm text-gray-600">{user.email}</p>
                {user.subscription_expires_at && user.subscription_plan !== 'none' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Истекает: {formatExpiryDate(user.subscription_expires_at)}
                  </p>
                )}
              </div>
              <Dialog open={isOpen && selectedUser?.id === user.id} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(user)}
                  >
                    <Icon name="Edit" size={16} className="mr-2" />
                    Изменить
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Изменить подписку</DialogTitle>
                    <DialogDescription>
                      {selectedUser?.full_name || selectedUser?.email}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="plan">Тарифный план</Label>
                      <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите план" />
                        </SelectTrigger>
                        <SelectContent>
                          {plans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              {plan.emoji} {plan.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedPlan !== 'none' && (
                      <div className="space-y-2">
                        <Label htmlFor="months">Количество месяцев</Label>
                        <Input
                          id="months"
                          type="number"
                          min="1"
                          max="120"
                          value={months}
                          onChange={(e) => setMonths(parseInt(e.target.value) || 1)}
                          placeholder="Введите количество месяцев"
                        />
                        <p className="text-sm text-gray-500">
                          Подписка будет действительна до:{' '}
                          {new Date(
                            Date.now() + months * 30 * 24 * 60 * 60 * 1000
                          ).toLocaleDateString('ru-RU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={handleUpdateSubscription}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Icon name="Loader2" className="mr-2 animate-spin" size={16} />
                          Обновление...
                        </>
                      ) : (
                        <>
                          <Icon name="Check" className="mr-2" size={16} />
                          Сохранить изменения
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionManager;