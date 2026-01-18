import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';

export const TelegramBotGuide = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="MessageCircle" size={24} />
          Как работает бот бронирования
        </CardTitle>
        <CardDescription>
          Инструкция для владельцев по обработке заявок через Telegram
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Icon name="Info" size={16} />
          <AlertDescription>
            Ваш бот автоматически общается с клиентами и собирает данные бронирований
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
              1
            </div>
            <div>
              <h4 className="font-semibold">Клиент пишет боту</h4>
              <p className="text-sm text-gray-600">
                Бот видит все ваши объекты, цены, допродажи и занятые даты. 
                Автоматически предлагает клиенту доступные варианты.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
              2
            </div>
            <div>
              <h4 className="font-semibold">Бот собирает данные</h4>
              <p className="text-sm text-gray-600">
                Имя, телефон, email, даты заезда-выезда, количество гостей.
                Всё в дружелюбной форме диалога.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
              3
            </div>
            <div>
              <h4 className="font-semibold">Отправка ссылки на оплату</h4>
              <p className="text-sm text-gray-600">
                Бот автоматически высылает клиенту вашу ссылку СБП (настраивается во вкладке СБП).
                Клиент оплачивает и отправляет скриншот в чат.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 font-bold">
              4
            </div>
            <div>
              <h4 className="font-semibold">Вам приходит уведомление</h4>
              <p className="text-sm text-gray-600">
                В Telegram вы получаете заявку с данными клиента и скриншот оплаты.
                Заявка также появляется в админке на вкладке "Брони".
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
              5
            </div>
            <div>
              <h4 className="font-semibold">Подтверждение оплаты</h4>
              <p className="text-sm text-gray-600">
                Проверяете оплату и нажимаете "Подтвердить" на сайте. 
                Бронирование автоматически добавляется в календарь, даты блокируются.
                Клиент получает подтверждение в Telegram.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Icon name="Sparkles" size={18} />
            Преимущества
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ Бот работает 24/7, даже когда вы спите</li>
            <li>✅ Автоматически проверяет занятость дат</li>
            <li>✅ Предлагает допродажи (завтраки, экскурсии)</li>
            <li>✅ Сохраняет всю историю общения</li>
            <li>✅ Клиент получает мгновенные ответы</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default TelegramBotGuide;
