import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { fetchWithAuth } from '@/lib/api';
import Icon from '@/components/ui/icon';

const API_URL = 'https://functions.poehali.dev/9f1887ba-ac1c-402a-be0d-4ae5c1a9175d';

export default function BaseInfoSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    base_name: '',
    admin_phone: '',
    admin_name: '',
    work_hours: '',
    extra_notes: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}?action=bot_settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`${API_URL}?action=bot_settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast({
          title: 'Настройки сохранены',
          description: 'Бот будет использовать эти данные при общении с клиентами'
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
          <Icon name="Building2" size={20} />
          Информация о базе
        </CardTitle>
        <CardDescription>
          Эти данные использует бот для поддержки клиентов (не для продажи)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="base_name">Название базы *</Label>
          <Input
            id="base_name"
            placeholder="Турбаза «Лесная сказка»"
            value={settings.base_name}
            onChange={(e) => setSettings({ ...settings, base_name: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="admin_phone">Телефон администратора *</Label>
          <Input
            id="admin_phone"
            placeholder="+7 900 123-45-67"
            value={settings.admin_phone}
            onChange={(e) => setSettings({ ...settings, admin_phone: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">
            Бот покажет клиентам этот номер, если им нужна помощь администратора
          </p>
        </div>

        <div>
          <Label htmlFor="admin_name">Имя администратора</Label>
          <Input
            id="admin_name"
            placeholder="Мария Ивановна"
            value={settings.admin_name}
            onChange={(e) => setSettings({ ...settings, admin_name: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="work_hours">Время работы</Label>
          <Input
            id="work_hours"
            placeholder="Ежедневно с 9:00 до 21:00"
            value={settings.work_hours}
            onChange={(e) => setSettings({ ...settings, work_hours: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="extra_notes">Дополнительная информация</Label>
          <Textarea
            id="extra_notes"
            placeholder="Особые условия заезда, правила базы..."
            value={settings.extra_notes}
            onChange={(e) => setSettings({ ...settings, extra_notes: e.target.value })}
            rows={3}
          />
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? 'Сохранение...' : 'Сохранить настройки'}
        </Button>
      </CardContent>
    </Card>
  );
}
