import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const AI_URL = 'https://functions.poehali.dev/f62c6672-5e97-4934-af5c-2f4fa9dca61a';

interface BotSettings {
  bot_name: string;
  greeting_message: string;
  communication_style: string;
  reminder_enabled: boolean;
  reminder_days: number;
  production_calendar_enabled: boolean;
}

export default function BotSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<BotSettings>({
    bot_name: 'Ассистент',
    greeting_message: 'Привет! Я ваш AI-помощник. Чем могу помочь?',
    communication_style: 'Дружелюбный и профессиональный',
    reminder_enabled: true,
    reminder_days: 30,
    production_calendar_enabled: true
  });
  const [loading, setLoading] = useState(false);
  const [holidays, setHolidays] = useState<Array<{ date: string; name: string }>>([]);

  useEffect(() => {
    loadSettings();
    loadHolidays();
  }, []);

  const getUserId = () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    return user?.id;
  };

  const loadSettings = async () => {
    const userId = getUserId();
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch(`${AI_URL}?action=settings`, {
        headers: { 'X-User-Id': userId.toString() }
      });
      const data = await response.json();
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHolidays = async () => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      const end = nextYear.toISOString().split('T')[0];

      const response = await fetch(
        `${AI_URL}?action=holidays&start=${today}&end=${end}`,
        {
          headers: { 'X-User-Id': userId.toString() }
        }
      );
      const data = await response.json();
      setHolidays(data.holidays || []);
    } catch (error) {
      console.error('Error loading holidays:', error);
    }
  };

  const saveSettings = async () => {
    const userId = getUserId();
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch(`${AI_URL}?action=settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Настройки бота сохранены'
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/booking-calendar')}
        className="fixed top-4 left-4 gap-2 z-50"
      >
        <Icon name="ArrowLeft" size={20} />
        Назад
      </Button>

      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            <Icon name="Settings" className="inline-block mr-2" size={36} />
            Настройки AI-бота
          </h1>
          <p className="text-gray-600">
            Персонализируйте поведение вашего AI-помощника
          </p>
        </div>

        {/* Основные настройки */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Основные настройки</CardTitle>
            <CardDescription>
              Настройте имя и стиль общения бота
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Имя бота</Label>
              <Input
                value={settings.bot_name}
                onChange={(e) => setSettings({ ...settings, bot_name: e.target.value })}
                placeholder="Ассистент"
              />
            </div>

            <div>
              <Label>Приветственное сообщение</Label>
              <Textarea
                value={settings.greeting_message}
                onChange={(e) => setSettings({ ...settings, greeting_message: e.target.value })}
                placeholder="Привет! Я ваш AI-помощник. Чем могу помочь?"
                rows={3}
              />
            </div>

            <div>
              <Label>Стиль общения</Label>
              <Textarea
                value={settings.communication_style}
                onChange={(e) => setSettings({ ...settings, communication_style: e.target.value })}
                placeholder="Дружелюбный и профессиональный"
                rows={2}
              />
              <p className="text-xs text-gray-500 mt-1">
                Например: "Деловой и краткий" или "Дружелюбный с юмором"
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Напоминания */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Напоминания клиентам</CardTitle>
            <CardDescription>
              Автоматические напоминания о возможности повторного бронирования
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label>Включить напоминания</Label>
                <p className="text-sm text-gray-500">
                  Бот будет напоминать клиентам о возможности отдохнуть снова
                </p>
              </div>
              <Switch
                checked={settings.reminder_enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, reminder_enabled: checked })
                }
              />
            </div>

            {settings.reminder_enabled && (
              <div>
                <Label>Через сколько дней напоминать</Label>
                <Input
                  type="number"
                  value={settings.reminder_days}
                  onChange={(e) =>
                    setSettings({ ...settings, reminder_days: parseInt(e.target.value) || 30 })
                  }
                  min={7}
                  max={365}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Бот отправит напоминание через {settings.reminder_days} дней после последнего визита
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Производственный календарь */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Производственный календарь</CardTitle>
            <CardDescription>
              Учёт государственных праздников России
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label>Учитывать праздники</Label>
                <p className="text-sm text-gray-500">
                  Бот будет предлагать акции и напоминать о праздничных периодах
                </p>
              </div>
              <Switch
                checked={settings.production_calendar_enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, production_calendar_enabled: checked })
                }
              />
            </div>

            {settings.production_calendar_enabled && holidays.length > 0 && (
              <div className="border-t pt-4">
                <Label className="mb-3 block">Ближайшие праздники:</Label>
                <div className="space-y-2">
                  {holidays.slice(0, 10).map((holiday, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-blue-50 rounded"
                    >
                      <span className="text-sm font-medium">{holiday.name}</span>
                      <span className="text-sm text-gray-600">
                        {new Date(holiday.date).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long'
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Примеры команд */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Примеры команд для бота</CardTitle>
            <CardDescription>
              Что вы можете попросить бота сделать
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-sm mb-1">💬 "Отправь всем клиентам скидку 20% к 8 марта"</p>
                <p className="text-xs text-gray-600">
                  Бот разошлёт сообщение всем клиентам в Telegram
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-sm mb-1">📊 "Покажи загрузку на следующий месяц"</p>
                <p className="text-xs text-gray-600">
                  Бот проанализирует бронирования и даст прогноз
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-sm mb-1">💡 "Дай совет как увеличить выручку"</p>
                <p className="text-xs text-gray-600">
                  Бот предложит стратегии на основе ваших данных
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-sm mb-1">🎉 "Какие праздники в феврале?"</p>
                <p className="text-xs text-gray-600">
                  Бот покажет праздничные дни и предложит акции
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Кнопка сохранения */}
        <div className="flex justify-end">
          <Button
            onClick={saveSettings}
            disabled={loading}
            size="lg"
            className="gap-2"
          >
            {loading ? (
              <>
                <Icon name="Loader2" size={16} className="animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Icon name="Save" size={16} />
                Сохранить настройки
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
