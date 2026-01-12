import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import { usePageMeta } from '@/hooks/usePageMeta';

const Club = () => {
  usePageMeta({
    title: 'Клуб предпринимателей',
    description: 'Закрытое сообщество владельцев туристических объектов: нетворкинг, обмен опытом, обучающие материалы',
    keywords: 'клуб предпринимателей, сообщество турбизнеса, нетворкинг туризм, обучение владельцев'
  });
  const navigate = useNavigate();

  const benefits = [
    {
      icon: 'Users',
      title: 'Нетворкинг с профессионалами',
      description: 'Общайтесь с владельцами турбаз, глэмпингов и баз отдыха по всей России',
      color: 'from-blue-500 to-cyan-600',
    },
    {
      icon: 'Handshake',
      title: 'Партнёрские программы',
      description: 'Создавайте взаимовыгодные партнёрства и увеличивайте поток клиентов',
      color: 'from-purple-500 to-pink-600',
    },
    {
      icon: 'TrendingUp',
      title: 'Обмен опытом',
      description: 'Учитесь на успехах других и делитесь своими находками',
      color: 'from-orange-500 to-red-600',
    },
    {
      icon: 'Lightbulb',
      title: 'Эксклюзивные мероприятия',
      description: 'Участвуйте в закрытых вебинарах, конференциях и встречах',
      color: 'from-green-500 to-emerald-600',
    },
    {
      icon: 'Target',
      title: 'Маркетинговая поддержка',
      description: 'Получайте советы экспертов по продвижению вашего объекта',
      color: 'from-pink-500 to-rose-600',
    },
    {
      icon: 'Trophy',
      title: 'Приоритет в рейтинге',
      description: 'Ваш объект будет отображаться выше в списках и рекомендациях',
      color: 'from-amber-500 to-yellow-600',
    },
  ];

  const communityFeatures = [
    'Доступ к закрытому Telegram-чату с владельцами объектов',
    'База проверенных поставщиков и подрядчиков',
    'Скидки до 20% от партнёров платформы',
    'Ежемесячные онлайн-встречи с экспертами',
    'Библиотека кейсов и гайдов по развитию бизнеса',
    'Совместные маркетинговые акции',
  ];

  return (
    <SubscriptionGuard feature="hasClub" featureName="закрытого клуба">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="fixed top-4 left-4 gap-2 z-50"
        >
          <Icon name="Home" size={20} />
          На главную
        </Button>

        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-4 bg-gradient-to-r from-primary to-secondary text-white border-none">
              👑 Закрытое сообщество
            </Badge>
            <h1 className="text-5xl lg:text-6xl font-bold font-heading mb-4">
              Клуб партнёров TourConnect
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Присоединяйтесь к сообществу профессионалов туристического бизнеса. 
              Нетворкинг, партнёрства и эксклюзивные возможности для развития.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 group">
                <div className={`h-2 bg-gradient-to-r ${benefit.color}`}></div>
                <CardContent className="pt-8 pb-8">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon name={benefit.icon as any} className="text-white" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold font-heading mb-3">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-none shadow-2xl mb-12 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-secondary p-8 text-white">
              <h2 className="text-3xl font-bold font-heading mb-4">Что входит в клуб</h2>
              <p className="text-lg opacity-90">
                Полный пакет инструментов и возможностей для роста вашего бизнеса
              </p>
            </div>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-6">
                {communityFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Icon name="CheckCircle2" className="text-green-600" size={20} />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6">
                <Icon name="Crown" className="text-white" size={40} />
              </div>
              <h2 className="text-3xl font-bold font-heading mb-4">
                Готовы присоединиться?
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Доступ к закрытому клубу открывается с тарифами <strong>PRO</strong>, <strong>BUSINESS</strong> и <strong>ENTERPRISE</strong>
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button
                  size="lg"
                  onClick={() => navigate('/pricing')}
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                >
                  Выбрать тариф
                  <Icon name="ArrowRight" className="ml-2" size={20} />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/#contact')}
                >
                  Задать вопрос
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-6">
                Уже есть подписка? <a href="https://t.me/YOUR_COMMUNITY_LINK" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Перейти в Telegram-чат →</a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </SubscriptionGuard>
  );
};

export default Club;