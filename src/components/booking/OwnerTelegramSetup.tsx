import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

export const OwnerTelegramSetup = () => {
  const { toast } = useToast();
  const [botUsername, setBotUsername] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBotInfo();
    loadUserId();
  }, []);

  const loadBotInfo = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/3c25846c-7f62-4ab4-a97d-8ace92b6ab9d');
      const data = await response.json();
      console.log('Bot info response:', data);
      if (data.bot_username) {
        setBotUsername(data.bot_username);
      } else {
        console.error('No bot_username in response:', data);
      }
    } catch (error) {
      console.error('Failed to load bot info:', error);
    }
  };

  const loadUserId = async () => {
    try {
      setLoading(true);
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserId(user.id);
      }
    } catch (error) {
      console.error('Failed to load user ID:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (botUsername && userId) {
      const link = `https://t.me/${botUsername}?start=owner_${userId}`;
      navigator.clipboard.writeText(link);
      toast({
        title: 'Скопировано!',
        description: 'Ссылка скопирована в буфер обмена'
      });
    }
  };

  const openBot = () => {
    if (botUsername && userId) {
      const url = `https://t.me/${botUsername}?start=owner_${userId}`;
      console.log('Opening bot URL:', url);
      window.open(url, '_blank');
    } else {
      console.error('Cannot open bot: botUsername=', botUsername, 'userId=', userId);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить информацию о боте. Обновите страницу.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <div className="text-center py-4">Загрузка...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Bell" size={24} />
          Уведомления владельца
        </CardTitle>
        <CardDescription>
          Получайте уведомления о новых бронях и оплатах в Telegram
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg space-y-3">
          <p className="text-sm text-gray-700">
            <strong>Как подключить уведомления:</strong>
          </p>
          <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
            <li>Нажмите кнопку "Открыть бота" ниже</li>
            <li>Бот отправит вам тестовое сообщение</li>
            <li>Готово! Теперь вы будете получать уведомления о:
              <ul className="ml-6 mt-1 space-y-1 list-disc">
                <li>Новых бронированиях</li>
                <li>Подтверждениях оплаты</li>
                <li>Скриншотах от клиентов</li>
              </ul>
            </li>
          </ol>
        </div>

        <div className="flex gap-2">
          <Button onClick={openBot} className="flex-1" disabled={!botUsername || !userId}>
            <Icon name="Send" size={16} className="mr-2" />
            {!botUsername ? 'Загрузка...' : 'Открыть бота'}
          </Button>
          <Button onClick={copyLink} variant="outline" disabled={!botUsername || !userId}>
            <Icon name="Copy" size={16} className="mr-2" />
            Копировать ссылку
          </Button>
        </div>

        {botUsername && (
          <p className="text-xs text-gray-500 text-center">
            Бот: @{botUsername}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default OwnerTelegramSetup;