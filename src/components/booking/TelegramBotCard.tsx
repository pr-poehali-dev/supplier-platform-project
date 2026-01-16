import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { fetchWithAuth } from '@/lib/api';

interface TelegramBotCardProps {
  botLink: string;
}

export default function TelegramBotCard({ botLink }: TelegramBotCardProps) {
  const [webhookStatus, setWebhookStatus] = useState<string>('');
  const [realBotLink, setRealBotLink] = useState<string>(botLink);
  const [isSettingUp, setIsSettingUp] = useState(false);

  const setupWebhook = async () => {
    setIsSettingUp(true);
    setWebhookStatus('⏳ Настраиваю webhook...');
    
    try {
      const response = await fetchWithAuth('https://functions.poehali.dev/3c25846c-7f62-4ab4-a97d-8ace92b6ab9d', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success && data.bot_username) {
        const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : '1';
        setRealBotLink(`https://t.me/${data.bot_username}?start=${userId}`);
        setWebhookStatus('✅ Webhook настроен! Бот готов к работе.');
      } else {
        setWebhookStatus('❌ Добавьте токен бота в секреты выше ⬆️');
      }
    } catch (error) {
      setWebhookStatus('❌ Добавьте токен бота в секреты');
    } finally {
      setIsSettingUp(false);
    }
  };

  return (
    <Card className="mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Icon name="MessageCircle" size={48} className="flex-shrink-0" />
          <div className="w-full">
            <h3 className="text-xl font-bold mb-2">🤖 AI-менеджер в Telegram</h3>
            <p className="text-blue-100 mb-4">
              Ваш персональный бот принимает бронирования 24/7. Клиенты пишут боту, AI-ассистент отвечает на вопросы и автоматически создаёт бронирования.
            </p>
            
            <div className="bg-white/90 rounded-lg p-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">⚙️ Быстрая настройка</h4>
                <Button
                  onClick={setupWebhook}
                  disabled={isSettingUp}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  {isSettingUp ? (
                    <>
                      <Icon name="Loader" className="mr-2 animate-spin" size={14} />
                      Настраиваю...
                    </>
                  ) : (
                    <>
                      <Icon name="Zap" className="mr-2" size={14} />
                      Автонастройка
                    </>
                  )}
                </Button>
              </div>
              
              {webhookStatus && (
                <div className={`text-sm p-2 rounded mb-2 ${
                  webhookStatus.includes('✅') 
                    ? 'bg-green-100 text-green-800' 
                    : webhookStatus.includes('⏳')
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {webhookStatus}
                </div>
              )}
              
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                <li>Создайте бота через @BotFather в Telegram</li>
                <li>Добавьте токен бота в секреты выше ⬆️</li>
                <li>Нажмите "Автонастройка" — всё готово! 🎉</li>
              </ol>
            </div>

            {realBotLink && !realBotLink.includes('YOUR_BOT_USERNAME') && (
              <div className="bg-white/90 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-gray-900 mb-2">📱 Ваша ссылка для клиентов:</h4>
                <div className="flex items-center gap-2">
                  <Input 
                    value={realBotLink} 
                    readOnly 
                    className="bg-white text-gray-900 border-gray-300 font-mono text-sm"
                  />
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(realBotLink);
                      alert('Ссылка скопирована!');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                  >
                    <Icon name="Copy" size={16} />
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  📤 Отправьте эту ссылку клиентам или разместите на сайте
                </p>
              </div>
            )}
            
            <div className="flex gap-3 mt-4">
              <Badge className="bg-green-500 text-white">
                <Icon name="Check" className="mr-1" size={14} />
                Backend готов
              </Badge>
              <Badge className="bg-white text-blue-600">
                <Icon name="Sparkles" className="mr-1" size={14} />
                OpenAI + Оплата
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}