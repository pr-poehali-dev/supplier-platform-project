import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { usePageMeta } from '@/hooks/usePageMeta';

export default function SyncGuide() {
  usePageMeta({
    title: 'Инструкция по синхронизации календарей',
    description: 'Пошаговое руководство по подключению синхронизации с Авито и Яндекс Путешествиями',
    keywords: 'синхронизация календарей, авито, яндекс путешествия, ical'
  });

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50/30 to-pink-50/30 p-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/booking-calendar')}
        className="fixed top-4 left-4 gap-2 z-50"
      >
        <Icon name="ArrowLeft" size={20} />
        Назад к календарю
      </Button>

      <div className="max-w-5xl mx-auto pt-16">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <Icon name="Book" size={16} className="mr-2" />
            Пошаговая инструкция
          </Badge>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Как подключить синхронизацию календарей
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Автоматически синхронизируйте брони с Авито и Яндекс Путешествиями через iCal. 
            Никаких двойных бронирований!
          </p>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-6 mb-12">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
              <Icon name="Lightbulb" size={32} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Что такое синхронизация календарей?</h3>
              <p className="text-gray-700 text-lg leading-relaxed">
                iCal (iCalendar) — это стандартный формат календарей, который поддерживают все площадки. 
                Вы получаете ссылку от Авито или Яндекса, вставляете её к нам — и календари синхронизируются 
                автоматически каждые 30 минут. Брони с площадок сразу блокируют даты у вас!
              </p>
            </div>
          </div>
        </div>

        <Card className="mb-12 border-2 border-orange-300 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                🟠
              </div>
              Синхронизация с Авито
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 text-white text-xl font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold mb-3">Войдите в личный кабинет Авито</h4>
                  <p className="text-gray-700 mb-4">
                    Перейдите на <a href="https://www.avito.ru/profile" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">avito.ru/profile</a> и откройте раздел "Мои объявления"
                  </p>
                  <img 
                    src="https://cdn.poehali.dev/projects/e94f48a9-086e-4e6f-8437-08793577e935/files/2b931891-e7bb-4f0f-82da-b3bee4944dd5.jpg"
                    alt="Авито - шаг 1"
                    className="rounded-lg border-2 border-gray-200 w-full shadow-md"
                  />
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 text-white text-xl font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold mb-3">Найдите настройки календаря</h4>
                  <p className="text-gray-700 mb-2">
                    В объявлении вашего объекта размещения:
                  </p>
                  <ul className="space-y-2 text-gray-700 mb-4">
                    <li className="flex items-start gap-2">
                      <Icon name="CheckCircle" size={18} className="text-green-600 mt-1 flex-shrink-0" />
                      <span>Нажмите "Редактировать"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="CheckCircle" size={18} className="text-green-600 mt-1 flex-shrink-0" />
                      <span>Прокрутите до раздела "Календарь"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="CheckCircle" size={18} className="text-green-600 mt-1 flex-shrink-0" />
                      <span>Найдите кнопку "Экспорт календаря" или "Получить ссылку iCal"</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 text-white text-xl font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold mb-3">Скопируйте iCal ссылку</h4>
                  <p className="text-gray-700 mb-4">
                    После нажатия на "Экспорт календаря" появится ссылка вида:
                  </p>
                  <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-300 font-mono text-sm break-all">
                    https://www.avito.ru/calendar/export/...
                  </div>
                  <p className="text-gray-600 text-sm mt-2">
                    📋 Скопируйте эту ссылку полностью
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 text-white text-xl font-bold">
                  4
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold mb-3">Добавьте в TOURCONNECT</h4>
                  <p className="text-gray-700 mb-4">
                    В календаре бронирований:
                  </p>
                  <ul className="space-y-2 text-gray-700 mb-4">
                    <li className="flex items-start gap-2">
                      <Icon name="CheckCircle" size={18} className="text-green-600 mt-1 flex-shrink-0" />
                      <span>Откройте раздел "Синхронизация календарей"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="CheckCircle" size={18} className="text-green-600 mt-1 flex-shrink-0" />
                      <span>Нажмите "Добавить синхронизацию"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="CheckCircle" size={18} className="text-green-600 mt-1 flex-shrink-0" />
                      <span>Выберите объект и "Авито"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="CheckCircle" size={18} className="text-green-600 mt-1 flex-shrink-0" />
                      <span>Вставьте скопированную ссылку</span>
                    </li>
                  </ul>
                  <img 
                    src="https://cdn.poehali.dev/projects/e94f48a9-086e-4e6f-8437-08793577e935/files/2be05b47-bbf2-4c8e-9113-dbc55ee6464c.jpg"
                    alt="TOURCONNECT - добавление синхронизации"
                    className="rounded-lg border-2 border-gray-200 w-full shadow-md"
                  />
                </div>
              </div>

              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <Icon name="CheckCircle" size={32} className="text-green-600 flex-shrink-0" />
                  <div>
                    <h4 className="text-xl font-bold text-green-900 mb-2">Готово!</h4>
                    <p className="text-green-800 text-lg">
                      Теперь брони с Авито будут автоматически появляться в вашем календаре каждые 30 минут. 
                      Даты заблокируются, и вы не получите двойное бронирование!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-12 border-2 border-yellow-300 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                🟡
              </div>
              Синхронизация с Яндекс Путешествиями
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0 text-white text-xl font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold mb-3">Станьте партнером Яндекс Путешествий</h4>
                  <p className="text-gray-700 mb-4">
                    Перейдите на <a href="https://travel.yandex.ru/partners" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">travel.yandex.ru/partners</a> и зарегистрируйтесь как партнер
                  </p>
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <p className="text-sm text-gray-700">
                      <strong>Важно:</strong> Регистрация в партнерской программе занимает 1-3 дня. После одобрения получите доступ к личному кабинету.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0 text-white text-xl font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold mb-3">Откройте настройки объекта</h4>
                  <p className="text-gray-700 mb-4">
                    В личном кабинете партнера:
                  </p>
                  <ul className="space-y-2 text-gray-700 mb-4">
                    <li className="flex items-start gap-2">
                      <Icon name="CheckCircle" size={18} className="text-green-600 mt-1 flex-shrink-0" />
                      <span>Выберите ваш объект размещения</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="CheckCircle" size={18} className="text-green-600 mt-1 flex-shrink-0" />
                      <span>Перейдите в раздел "Календарь и цены"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="CheckCircle" size={18} className="text-green-600 mt-1 flex-shrink-0" />
                      <span>Найдите "Экспорт календаря" или "Настройки синхронизации"</span>
                    </li>
                  </ul>
                  <img 
                    src="https://cdn.poehali.dev/projects/e94f48a9-086e-4e6f-8437-08793577e935/files/82b5a26a-604d-4555-8143-b3ccd33ea41a.jpg"
                    alt="Яндекс Путешествия - шаг 2"
                    className="rounded-lg border-2 border-gray-200 w-full shadow-md"
                  />
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0 text-white text-xl font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold mb-3">Получите iCal ссылку</h4>
                  <p className="text-gray-700 mb-4">
                    Нажмите "Экспорт календаря" и скопируйте ссылку:
                  </p>
                  <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-300 font-mono text-sm break-all">
                    https://travel.yandex.ru/api/calendar/...
                  </div>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0 text-white text-xl font-bold">
                  4
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold mb-3">Добавьте в TOURCONNECT</h4>
                  <p className="text-gray-700 mb-4">
                    Аналогично Авито: откройте "Синхронизация календарей", нажмите "Добавить", 
                    выберите "Яндекс Путешествия" и вставьте ссылку.
                  </p>
                </div>
              </div>

              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <Icon name="CheckCircle" size={32} className="text-green-600 flex-shrink-0" />
                  <div>
                    <h4 className="text-xl font-bold text-green-900 mb-2">Синхронизация настроена!</h4>
                    <p className="text-green-800 text-lg">
                      Брони из Яндекс Путешествий автоматически блокируют даты в вашем календаре.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-12 border-2 border-purple-300 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Icon name="HelpCircle" size={28} />
              Частые вопросы
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Icon name="Clock" size={20} className="text-purple-600" />
                  Как часто обновляются календари?
                </h4>
                <p className="text-gray-700 pl-7">
                  Автоматически каждые 30 минут. Вы также можете нажать "Синхронизировать" вручную в любой момент.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Icon name="Shield" size={20} className="text-purple-600" />
                  Это безопасно?
                </h4>
                <p className="text-gray-700 pl-7">
                  Да! iCal — стандартный протокол, который используют все календари мира. 
                  Ссылка позволяет только читать занятые даты, но не изменять их.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Icon name="Zap" size={20} className="text-purple-600" />
                  Что если бронь отменят на площадке?
                </h4>
                <p className="text-gray-700 pl-7">
                  При следующей синхронизации (через 30 минут) даты автоматически освободятся в вашем календаре.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Icon name="Link" size={20} className="text-purple-600" />
                  Можно подключить несколько площадок?
                </h4>
                <p className="text-gray-700 pl-7">
                  Да! Добавьте синхронизацию для каждой площадки отдельно. Все брони будут собираться в один календарь.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center pb-12">
          <Button
            onClick={() => navigate('/booking-calendar')}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-lg px-8 py-6"
          >
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Вернуться к календарю
          </Button>
        </div>
      </div>
    </div>
  );
}
