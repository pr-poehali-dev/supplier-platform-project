import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { fetchWithAuth } from '@/lib/api';

interface PaymentLink {
  id: number;
  plan_type: string;
  payment_url: string;
  description: string;
}

const planNames = {
  start: { name: 'START 🟢', price: '1 990₽', color: 'bg-green-100 border-green-300' },
  pro: { name: 'PRO 🔵', price: '3 990₽', color: 'bg-blue-100 border-blue-300' },
  business: { name: 'BUSINESS 🟣', price: '6 990₽', color: 'bg-purple-100 border-purple-300' },
  enterprise: { name: 'ENTERPRISE ⭐', price: 'По запросу', color: 'bg-yellow-100 border-yellow-300' }
};

export const SubscriptionPaymentLinks = () => {
  const { toast } = useToast();
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('https://functions.poehali.dev/9f1887ba-ac1c-402a-be0d-4ae5c1a9175d?action=get_subscription_payment_links');
      const data = await response.json();
      setLinks(data.links || []);
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить платежные ссылки',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveLink = async (planType: string) => {
    if (!editUrl.trim() && planType !== 'enterprise') {
      toast({
        title: 'Ошибка',
        description: 'Введите URL для оплаты',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetchWithAuth('https://functions.poehali.dev/9f1887ba-ac1c-402a-be0d-4ae5c1a9175d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_subscription_payment_link',
          plan_type: planType,
          payment_url: editUrl
        })
      });

      if (response.ok) {
        toast({
          title: 'Сохранено!',
          description: `Ссылка для тарифа ${planNames[planType as keyof typeof planNames].name} обновлена`
        });
        setEditingPlan(null);
        setEditUrl('');
        loadLinks();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить ссылку',
        variant: 'destructive'
      });
    }
  };

  const startEdit = (planType: string) => {
    const link = links.find(l => l.plan_type === planType);
    setEditUrl(link?.payment_url || '');
    setEditingPlan(planType);
  };

  if (loading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Link" size={24} />
          Ссылки на оплату подписок
        </CardTitle>
        <CardDescription>
          Управление платежными ссылками для каждого тарифа. Клиент будет перенаправлен на эту ссылку при выборе подписки.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(planNames).map(([planType, planInfo]) => {
            const link = links.find(l => l.plan_type === planType);
            const isEditing = editingPlan === planType;

            return (
              <div
                key={planType}
                className={`border-2 rounded-lg p-4 space-y-3 ${planInfo.color}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{planInfo.name}</h3>
                    <p className="text-sm text-gray-600">{planInfo.price} / месяц</p>
                  </div>
                  {!isEditing && (
                    <Button
                      onClick={() => startEdit(planType)}
                      variant="outline"
                      size="sm"
                    >
                      <Icon name="Pencil" size={16} className="mr-2" />
                      Изменить
                    </Button>
                  )}
                </div>

                {link && !isEditing && (
                  <div className="bg-white/70 rounded p-3 text-sm">
                    {link.payment_url ? (
                      <>
                        <p className="font-semibold mb-1">Текущая ссылка:</p>
                        <a
                          href={link.payment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {link.payment_url}
                        </a>
                      </>
                    ) : (
                      <p className="text-gray-500 italic">Ссылка не установлена</p>
                    )}
                  </div>
                )}

                {isEditing && (
                  <div className="space-y-3 bg-white/70 p-4 rounded">
                    <div>
                      <Label>URL для оплаты</Label>
                      <Input
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        placeholder={
                          planType === 'enterprise'
                            ? 'https://t.me/your_username'
                            : 'https://checkout.tochka.com/...'
                        }
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {planType === 'enterprise'
                          ? 'Ссылка на Telegram для связи'
                          : 'Ссылка на платежную систему (Tochka, ЮKassa и т.д.)'}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={() => saveLink(planType)} className="flex-1">
                        <Icon name="Check" size={16} className="mr-2" />
                        Сохранить
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingPlan(null);
                          setEditUrl('');
                        }}
                        variant="outline"
                      >
                        Отмена
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex gap-2 text-blue-800">
            <Icon name="Info" size={20} className="flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold mb-1">Как это работает:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Владелец выбирает тариф на странице /pricing</li>
                <li>При нажатии "Перейти к оплате" открывается ваша платежная ссылка</li>
                <li>После оплаты владелец должен подтвердить платеж через форму</li>
                <li>Вы проверяете оплату и активируете подписку вручную</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionPaymentLinks;
