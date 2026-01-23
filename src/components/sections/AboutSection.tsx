import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

const AboutSection = () => {

  return (
    <section id="about" className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center animate-fade-in">
          <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
            🎯 Наша миссия
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold font-heading mb-8">
            О проекте TourConnect
          </h2>
          <div className="space-y-6 text-lg text-gray-600 text-left">
            <p>
              TourConnect — это сервис для владельцев баз отдыха, глэмпингов и домов, который берёт на себя рутину бронирований и общения с гостями.
            </p>
            <p>
              Мы объединяем календарь, заявки, оплаты и сообщения в одну систему — чтобы вы видели всю картину сразу и не тратили время на переписки, таблицы и ручные подтверждения.
            </p>
            <p>
              TourConnect помогает принимать гостей напрямую, управлять загрузкой объектов и сохранять контроль над бизнесом — без маркетплейсов, лишних звонков и хаоса в бронированиях.
            </p>
            <p className="font-bold text-xl text-gray-900 text-center pt-4">
              Вы управляете. Система работает.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;