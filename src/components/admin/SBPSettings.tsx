import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { fetchWithAuth } from '@/lib/api';

export const SBPSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sbpLink, setSbpLink] = useState('');
  const [recipientName, setRecipientName] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('https://functions.poehali.dev/admin-users');
      const data = await response.json();
      
      const currentUser = data.users?.find((u: any) => u.is_admin);
      if (currentUser) {
        setSbpLink(currentUser.sbp_payment_link || '');
        setRecipientName(currentUser.sbp_recipient_name || '');
      }
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить настройки СБП',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetchWithAuth('https://functions.poehali.dev/admin-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'update_sbp_settings',
          sbp_payment_link: sbpLink,
          sbp_recipient_name: recipientName
        })
      });

      if (response.ok) {
        toast({
          title: 'Сохранено!',
          description: 'Настройки СБП обновлены'
        });
      } else {
        throw new Error('Ошибка сохранения');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройки',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Wallet" size={24} />
          Настройка оплаты СБП
        </CardTitle>
        <CardDescription>
          Укажите ссылку на оплату через СБП — она будет автоматически отправляться клиентам при бронировании через бота
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sbp-link">Ссылка на оплату СБП</Label>
          <Input
            id="sbp-link"
            type="url"
            placeholder="https://pay.bank.ru/..."
            value={sbpLink}
            onChange={(e) => setSbpLink(e.target.value)}
          />
          <p className="text-sm text-gray-500">
            Эту ссылку получат клиенты для оплаты бронирования
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipient-name">Имя получателя</Label>
          <Input
            id="recipient-name"
            placeholder="Романцов Максим"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />
          <p className="text-sm text-gray-500">
            Это имя увидит клиент при оплате
          </p>
        </div>

        <Button
          onClick={saveSettings}
          disabled={saving || !sbpLink.trim()}
          className="w-full"
        >
          {saving ? (
            <>
              <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
              Сохранение...
            </>
          ) : (
            <>
              <Icon name="Save" size={16} className="mr-2" />
              Сохранить настройки
            </>
          )}
        </Button>

        {sbpLink && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800">
              ✅ Клиенты будут получать эту ссылку автоматически после заполнения данных бронирования в боте
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SBPSettings;
