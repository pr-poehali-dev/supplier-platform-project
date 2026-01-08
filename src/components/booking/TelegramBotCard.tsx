import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface TelegramBotCardProps {
  botLink: string;
}

export default function TelegramBotCard({ botLink }: TelegramBotCardProps) {
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
            
            {botLink && (
              <div className="bg-white/90 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-gray-900 mb-2">📱 Ваша ссылка для клиентов:</h4>
                <div className="flex items-center gap-2">
                  <Input 
                    value={botLink} 
                    readOnly 
                    className="bg-white text-gray-900 border-gray-300 font-mono text-sm"
                  />
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(botLink);
                      alert('Ссылка скопирована!');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                  >
                    <Icon name="Copy" size={16} />
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Отправьте эту ссылку клиентам или разместите на сайте. Каждый клиент получит персонального AI-менеджера.
                </p>
              </div>
            )}

            <div className="bg-white/20 rounded-lg p-4 mt-4">
              <h4 className="font-semibold mb-2">⚙️ Настройка Telegram-бота:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Откройте @BotFather в Telegram</li>
                <li>Отправьте команду /newbot</li>
                <li>Укажите имя и username бота (например: tourconnect_bot)</li>
                <li>Скопируйте токен и добавьте в секреты проекта выше ⬆️</li>
                <li>Настройте webhook командой в @BotFather или я это сделаю автоматически</li>
              </ol>
            </div>
            
            <div className="flex gap-3 mt-4">
              <Badge className="bg-green-500 text-white">
                <Icon name="Check" className="mr-1" size={14} />
                Backend готов
              </Badge>
              <Badge className="bg-white text-blue-600">
                <Icon name="Sparkles" className="mr-1" size={14} />
                OpenAI подключен
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
