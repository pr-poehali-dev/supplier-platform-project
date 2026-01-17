import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { usePageMeta } from '@/hooks/usePageMeta';
import PlatformGuide from '@/components/pages/PlatformGuide';

export default function SyncGuide() {
  usePageMeta({
    title: 'Инструкция по синхронизации календарей',
    description: 'Пошаговое руководство по подключению синхронизации с Авито и Яндекс Путешествиями',
    keywords: 'синхронизация календарей, авито, яндекс путешествия, ical'
  });

  const navigate = useNavigate();

  const avitoSteps = [
    {
      number: 1,
      title: 'Войдите в личный кабинет Авито',
      description: (
        <>
          Перейдите на <a href="https://www.avito.ru/profile" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">avito.ru/profile</a> и откройте раздел "Мои объявления"
        </>
      ),
      image: 'https://cdn.poehali.dev/projects/e94f48a9-086e-4e6f-8437-08793577e935/files/2b931891-e7bb-4f0f-82da-b3bee4944dd5.jpg'
    },
    {
      number: 2,
      title: 'Найдите настройки календаря',
      description: 'В объявлении вашего объекта размещения:',
      details: (
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
      )
    },
    {
      number: 3,
      title: 'Скопируйте iCal ссылку',
      description: 'После нажатия на "Экспорт календаря" появится ссылка вида:',
      details: (
        <>
          <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-300 font-mono text-sm break-all">
            https://www.avito.ru/calendar/export/...
          </div>
          <p className="text-gray-600 text-sm mt-2">📋 Скопируйте эту ссылку полностью</p>
        </>
      )
    },
    {
      number: 4,
      title: 'Добавьте в TOURCONNECT',
      description: 'В календаре бронирований:',
      details: (
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
      ),
      image: 'https://cdn.poehali.dev/projects/e94f48a9-086e-4e6f-8437-08793577e935/files/2be05b47-bbf2-4c8e-9113-dbc55ee6464c.jpg'
    }
  ];

  const yandexSteps = [
    {
      number: 1,
      title: 'Откройте личный кабинет',
      description: (
        <>
          Перейдите на <a href="https://travel.yandex.ru/business/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">travel.yandex.ru/business</a> и войдите в личный кабинет партнёра
        </>
      )
    },
    {
      number: 2,
      title: 'Настройки объекта',
      description: 'Выберите нужный объект размещения и перейдите в его настройки',
      details: (
        <ul className="space-y-2 text-gray-700 mb-4">
          <li className="flex items-start gap-2">
            <Icon name="CheckCircle" size={18} className="text-green-600 mt-1 flex-shrink-0" />
            <span>Откройте раздел "Управление" → "Календарь"</span>
          </li>
          <li className="flex items-start gap-2">
            <Icon name="CheckCircle" size={18} className="text-green-600 mt-1 flex-shrink-0" />
            <span>Найдите блок "Синхронизация с другими сервисами"</span>
          </li>
        </ul>
      )
    },
    {
      number: 3,
      title: 'Получите ссылку экспорта',
      description: 'В разделе синхронизации найдите опцию "Экспорт календаря" и скопируйте ссылку формата:',
      details: (
        <>
          <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-300 font-mono text-sm break-all">
            https://travel.yandex.ru/api/ical/...
          </div>
          <p className="text-gray-600 text-sm mt-2">📋 Сохраните эту ссылку</p>
        </>
      )
    },
    {
      number: 4,
      title: 'Подключите в TOURCONNECT',
      description: 'В разделе "Синхронизация календарей":',
      details: (
        <ul className="space-y-2 text-gray-700 mb-4">
          <li className="flex items-start gap-2">
            <Icon name="CheckCircle" size={18} className="text-green-600 mt-1 flex-shrink-0" />
            <span>Выберите нужный объект</span>
          </li>
          <li className="flex items-start gap-2">
            <Icon name="CheckCircle" size={18} className="text-green-600 mt-1 flex-shrink-0" />
            <span>Выберите источник "Яндекс Путешествия"</span>
          </li>
          <li className="flex items-start gap-2">
            <Icon name="CheckCircle" size={18} className="text-green-600 mt-1 flex-shrink-0" />
            <span>Вставьте скопированную ссылку</span>
          </li>
          <li className="flex items-start gap-2">
            <Icon name="CheckCircle" size={18} className="text-green-600 mt-1 flex-shrink-0" />
            <span>Сохраните настройки</span>
          </li>
        </ul>
      )
    }
  ];

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

        <PlatformGuide
          title="Синхронизация с Авито"
          icon="🟠"
          color="border-orange-300"
          steps={avitoSteps}
        />

        <PlatformGuide
          title="Синхронизация с Яндекс Путешествиями"
          icon="🔵"
          color="border-blue-300"
          steps={yandexSteps}
        />

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4">
            <Icon name="CheckCircle" size={40} className="text-white" />
          </div>
          <h3 className="text-3xl font-bold mb-4">Готово!</h3>
          <p className="text-xl text-gray-700 mb-6">
            Теперь все брони с Авито и Яндекс Путешествий будут автоматически синхронизироваться с вашим календарём. 
            Проверяйте статус синхронизации в разделе "Синхронизация календарей".
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/booking-calendar')}
            className="bg-gradient-to-r from-green-600 to-emerald-600"
          >
            Перейти к календарю
            <Icon name="ArrowRight" size={20} className="ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
