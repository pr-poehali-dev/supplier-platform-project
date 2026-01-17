import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { fetchWithAuth } from '@/lib/api';

const AI_URL = 'https://functions.poehali.dev/f62c6672-5e97-4934-af5c-2f4fa9dca61a';

interface SBPSettings {
  phone: string;
  recipient_name: string;
}

export default function SBPSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SBPSettings>({ phone: '', recipient_name: '' });
  const [loading, setLoading] = useState(false);

  const getUserId = () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    return user?.id;
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const response = await fetchWithAuth(`${AI_URL}?action=settings`, {
        headers: { 'X-Owner-Id': userId.toString() }
      });
      const data = await response.json();
      
      if (data.settings?.sbp_phone || data.settings?.sbp_recipient_name) {
        setSettings({
          phone: data.settings.sbp_phone || '',
          recipient_name: data.settings.sbp_recipient_name || ''
        });
      }
    } catch (error) {
      // Settings not configured yet
    }
  };

  const saveSettings = async () => {
    const userId = getUserId();
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetchWithAuth(`${AI_URL}?action=settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Owner-Id': userId.toString()
        },
        body: JSON.stringify({
          sbp_phone: settings.phone,
          sbp_recipient_name: settings.recipient_name
        })
      });

      if (response.ok) {
        toast({
          title: 'Сохранено',
          description: 'Настройки СБП обновлены'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройки',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Smartphone" size={24} />
          Подключение оплаты СБП
        </CardTitle>
        <CardDescription>
          Настройте данные для приема переводов через СБП. Бот будет отправлять эти данные клиентам для оплаты.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="phone">Номер телефона для СБП *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+7 (999) 123-45-67"
            value={settings.phone}
            onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">
            На этот номер клиенты будут отправлять оплату
          </p>
        </div>

        <div>
          <Label htmlFor="recipient_name">Имя получателя *</Label>
          <Input
            id="recipient_name"
            placeholder="Иван И."
            value={settings.recipient_name}
            onChange={(e) => setSettings({ ...settings, recipient_name: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">
            Имя, которое отобразится при переводе
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-2">
            <Icon name="AlertCircle" size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Как это работает:</p>
              <ol className="list-decimal ml-4 space-y-1">
                <li>Клиент бронирует через бота</li>
                <li>Бот отправляет данные для перевода (телефон и имя)</li>
                <li>После перевода бронь появляется как "Заявка" с мигающей анимацией</li>
                <li>Вы получаете уведомление в Telegram</li>
                <li>Подтверждаете оплату вручную</li>
              </ol>
            </div>
          </div>
        </div>

        <Button onClick={saveSettings} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Icon name="Loader2" size={16} className="animate-spin mr-2" />
              Сохранение...
            </>
          ) : (
            <>
              <Icon name="Save" size={16} className="mr-2" />
              Сохранить настройки
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
