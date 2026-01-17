import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { fetchWithAuth } from '@/lib/api';
import BotSettingsForm from '@/components/bot/BotSettingsForm';
import HolidaysList from '@/components/bot/HolidaysList';

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
      const response = await fetchWithAuth(`${AI_URL}?action=settings`, {
        headers: { 'X-User-Id': userId.toString() }
      });
      const data = await response.json();
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      // Error loading settings
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

      const response = await fetchWithAuth(
        `${AI_URL}?action=holidays&start=${today}&end=${end}`,
        { headers: { 'X-User-Id': userId.toString() } }
      );
      const data = await response.json();
      setHolidays(data.holidays || []);
    } catch (error) {
      // Error loading holidays
    }
  };

  const saveSettings = async () => {
    const userId = getUserId();
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetchWithAuth(`${AI_URL}?action=settings`, {
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

        <BotSettingsForm settings={settings} onChange={setSettings} />
        
        <HolidaysList holidays={holidays} enabled={settings.production_calendar_enabled} />

        <div className="mt-6 flex justify-end">
          <Button onClick={saveSettings} disabled={loading} size="lg">
            {loading ? (
              <>
                <Icon name="Loader2" className="animate-spin mr-2" size={18} />
                Сохранение...
              </>
            ) : (
              <>
                <Icon name="Save" className="mr-2" size={18} />
                Сохранить настройки
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
