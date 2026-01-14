import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import TelegramBotCard from './TelegramBotCard';
import OwnerTelegramSetup from './OwnerTelegramSetup';
import CalendarSyncCard from './CalendarSyncCard';
import { Badge } from '@/components/ui/badge';
import { Unit } from './UnitsManagement';

interface IntegrationAccordionProps {
  botLink: string;
  units: Unit[];
}

export default function IntegrationAccordion({ botLink, units }: IntegrationAccordionProps) {
  return (
    <Card className="mt-8 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl">
          <Icon name="Plug" size={28} />
          Интеграции и автоматизация
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Подключите внешние сервисы для автоматизации бронирований
        </p>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="sync" className="border-b-2">
            <AccordionTrigger className="hover:no-underline group">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Icon name="RefreshCw" size={24} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Синхронизация календарей</h3>
                    <Badge variant="outline" className="bg-blue-50">
                      <Icon name="Zap" size={12} className="mr-1" />
                      Автообновление
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 font-normal">
                    Авито, Яндекс Путешествия и другие площадки
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pl-14 pr-4">
                <CalendarSyncCard units={units} />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="telegram" className="border-b-2">
            <AccordionTrigger className="hover:no-underline group">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Icon name="Send" size={24} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Telegram-бот</h3>
                    <Badge variant="outline" className="bg-green-50">
                      <Icon name="Bot" size={12} className="mr-1" />
                      AI-менеджер
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 font-normal">
                    Прием заявок и уведомления 24/7
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pl-14 pr-4 space-y-4">
                <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Icon name="Info" size={16} />
                    Что умеет бот:
                  </h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <Icon name="CheckCircle" size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Принимает заявки от клиентов автоматически</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="CheckCircle" size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Проверяет даты и свободные номера</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="CheckCircle" size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Отправляет вам уведомления о новых бронях</span>
                    </li>
                  </ul>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-gray-700">Для клиентов:</h4>
                    <TelegramBotCard botLink={botLink} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-gray-700">Для владельца:</h4>
                    <OwnerTelegramSetup />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="max" className="border-b-0">
            <AccordionTrigger className="hover:no-underline group">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Icon name="MessageSquare" size={24} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">MAX-бот</h3>
                    <Badge variant="outline" className="bg-purple-50">
                      <Icon name="Sparkles" size={12} className="mr-1" />
                      Скоро
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 font-normal">
                    Прием заявок через мессенджер Max
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pl-14 pr-4">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <Icon name="Rocket" size={32} className="text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Интеграция в разработке</h4>
                      <p className="text-gray-700 mb-4">
                        Мы работаем над подключением мессенджера Max для приема бронирований.
                        Скоро вы сможете принимать заявки через Max с теми же возможностями, что и в Telegram!
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Icon name="Clock" size={16} />
                        <span>Ожидаемый запуск: следующее обновление</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}