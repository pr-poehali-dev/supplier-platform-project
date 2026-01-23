import { useNavigate } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';
import JsonLd from '@/components/seo/JsonLd';
import { organizationSchema } from '@/utils/seo';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Card } from '@/components/ui/card';
import MainNav from '@/components/navigation/MainNav';
import { useState, useEffect } from 'react';

const Roadmap = () => {
  usePageMeta({
    title: 'Roadmap — Как развивается TourConnect',
    description: 'TourConnect развивается вместе с вами. Каждое обновление — это меньше рутины и больше контроля над вашим бизнесом.',
    keywords: 'roadmap, развитие сервиса, обновления, планы развития, турбизнес'
  });

  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('home');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const scrollToSection = (section: string) => {
    setActiveSection(section);
    const element = document.getElementById(section);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const roadmapStages = [
    {
      status: 'live',
      icon: 'CheckCircle2',
      statusText: 'Уже доступно',
      statusColor: 'text-emerald-500',
      bgColor: 'from-emerald-500/10 to-green-500/5',
      borderColor: 'border-emerald-500/20',
      title: 'Умное управление бронированиями',
      description: 'Вы видите всё. Система делает остальное.',
      features: [
        'Единый календарь для всех объектов',
        'Автоматическое общение с гостями через Telegram',
        'Приём заявок без маркетплейсов',
        'Доп. услуги и пересчёт стоимости'
      ]
    },
    {
      status: 'development',
      icon: 'Zap',
      statusText: 'В разработке',
      statusColor: 'text-amber-500',
      bgColor: 'from-amber-500/10 to-yellow-500/5',
      borderColor: 'border-amber-500/20',
      title: 'Прямые оплаты и автоматические расчёты',
      description: 'Бронирование → оплата → подтверждение. Без звонков и путаницы.',
      features: [
        'Гости оплачивают напрямую',
        'Деньги приходят без посредников',
        'Прозрачная история платежей',
        'Меньше ручной работы'
      ]
    },
    {
      status: 'planned',
      icon: 'Sparkles',
      statusText: 'В планах',
      statusColor: 'text-blue-500',
      bgColor: 'from-blue-500/10 to-cyan-500/5',
      borderColor: 'border-blue-500/20',
      title: 'Гости из других стран',
      description: 'Ваш бизнес становится заметным за пределами страны.',
      features: [
        'Ваш объект доступен иностранным гостям',
        'Автоматическое общение на нужном языке',
        'Приём оплат из-за рубежа',
        'Упрощённый процесс бронирования'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30">
      <JsonLd data={organizationSchema} />
      
      <MainNav
        activeSection={activeSection}
        user={user}
        onScrollToSection={scrollToSection}
        onNavigate={navigate}
      />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            TourConnect развивается
            <br />
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              вместе с вами
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
            Мы строим сервис для владельцев баз отдыха — шаг за шагом, без лишней сложности.
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Каждое обновление — это меньше рутины и больше контроля над вашим бизнесом.
          </p>
        </div>
      </section>

      {/* Roadmap Timeline */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-200 via-blue-200 to-transparent hidden md:block"></div>

            {/* Stages */}
            <div className="space-y-12">
              {roadmapStages.map((stage, index) => (
                <div 
                  key={index} 
                  className="relative animate-fade-in"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {/* Icon Badge */}
                  <div className="absolute left-0 top-6 hidden md:flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg border-4 border-white">
                    <Icon 
                      name={stage.icon as any} 
                      className={stage.statusColor}
                      size={28}
                    />
                  </div>

                  {/* Card */}
                  <div className="md:ml-24">
                    <Card className={`border-2 ${stage.borderColor} bg-gradient-to-br ${stage.bgColor} backdrop-blur-sm overflow-hidden`}>
                      <div className="p-8">
                        {/* Status Badge */}
                        <div className="flex items-center gap-2 mb-4">
                          <Icon name={stage.icon as any} className={stage.statusColor} size={20} />
                          <span className={`text-sm font-semibold ${stage.statusColor}`}>
                            {stage.statusText}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                          {stage.title}
                        </h3>

                        {/* Description */}
                        <p className="text-lg text-gray-700 mb-6 italic">
                          «{stage.description}»
                        </p>

                        {/* Features */}
                        <ul className="space-y-3">
                          {stage.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <Icon 
                                name="Check" 
                                className="text-gray-400 mt-0.5 flex-shrink-0"
                                size={18}
                              />
                              <span className="text-gray-600">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Engagement Block */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-white rounded-3xl shadow-2xl p-12 border border-purple-100">
            <Icon 
              name="MessageCircle" 
              className="text-purple-600 mx-auto mb-6"
              size={48}
            />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Вы влияете на развитие TourConnect
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
              Мы внимательно слушаем владельцев и развиваем сервис на основе реальных задач бизнеса.
            </p>
            <Button 
              size="lg"
              onClick={() => navigate('/#contact')}
              className="gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <Icon name="Lightbulb" size={20} />
              Предложить идею
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              Лучшие идеи попадают в Roadmap
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            TourConnect — сервис, который растёт
            <br />
            вместе с вашим бизнесом
          </h2>
          <Button 
            size="lg"
            variant="secondary"
            onClick={() => navigate('/pricing')}
            className="bg-white text-purple-600 hover:bg-gray-50 shadow-2xl gap-2"
          >
            Начать использовать
            <Icon name="ArrowRight" size={20} />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-white border-t">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          <p>© 2024 TourConnect. Сервис для владельцев турбаз и баз отдыха.</p>
        </div>
      </footer>
    </div>
  );
};

export default Roadmap;
