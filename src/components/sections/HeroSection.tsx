import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';

interface HeroSectionProps {
  scrollToSection: (section: string) => void;
}

const HeroSection = ({ scrollToSection }: HeroSectionProps) => {
  const navigate = useNavigate();

  const tools = [
    {
      icon: 'Calculator',
      title: 'Симулятор бизнеса',
      description: 'Рассчитайте экономику вашего проекта',
      gradient: 'from-primary to-secondary',
      action: '/simulator',
    },
    {
      icon: 'Users',
      title: 'Закрытый клуб',
      description: 'Комьюнити предпринимателей в туризме',
      gradient: 'from-secondary to-accent',
      action: '/club',
    },
    {
      icon: 'Target',
      title: 'Диагностика бизнеса',
      description: 'Найдите точки роста за 10 минут',
      gradient: 'from-accent to-primary',
      action: '/diagnostics',
    },
  ];

  return (
    <section id="home" className="pt-32 pb-20 px-4">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in">
            <Badge className="bg-primary/10 text-primary border-primary/20">
              🚀 Платформа нового поколения
            </Badge>
            <h2 className="text-5xl lg:text-6xl font-bold font-heading leading-tight">
              Инструменты для{' '}
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                бизнеса
              </span>{' '}
              в туризме
            </h2>
            <p className="text-xl text-gray-600">
              Помогаем предпринимателям открыть и развить бизнес в сфере туризма России. Инструменты, советы и сообщество единомышленников.
            </p>
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/30 rounded-2xl p-6 mt-6">
              <p className="text-lg font-semibold text-primary">
                🎁 Первые 20 пользователей получают премиум функции бесплатно
              </p>
            </div>
          </div>
          <div className="relative animate-float">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-3xl"></div>
            <img
              src="https://cdn.poehali.dev/projects/e94f48a9-086e-4e6f-8437-08793577e935/files/96e9855f-23d1-41b1-86bd-6f53191ad56d.jpg"
              alt="Современная база отдыха"
              className="relative rounded-3xl shadow-2xl w-full"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          <Card className="border-none shadow-2xl overflow-hidden group hover:shadow-3xl transition-all duration-300 cursor-pointer" onClick={() => navigate('/simulator')}>
            <div className="h-3 bg-gradient-to-r from-blue-500 to-cyan-600"></div>
            <CardContent className="pt-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Icon name="Calculator" className="text-white" size={32} />
              </div>
              <Badge className="mb-3 bg-blue-50 text-blue-700 border-blue-200">
                📊 Бесплатный инструмент
              </Badge>
              <h3 className="text-2xl font-bold font-heading mb-3">Симулятор отельера</h3>
              <p className="text-gray-600 mb-4">
                Рассчитайте потенциальную прибыль вашего глемпинга или базы отдыха
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">Расчёт прибыли</Badge>
                <Badge variant="outline" className="text-xs">Прогноз загрузки</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl overflow-hidden group hover:shadow-3xl transition-all duration-300 cursor-pointer" onClick={() => navigate('/pricing')}>
            <div className="h-3 bg-gradient-to-r from-purple-500 to-pink-600"></div>
            <CardContent className="pt-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Icon name="Crown" className="text-white" size={32} />
              </div>
              <Badge className="mb-3 bg-purple-50 text-purple-700 border-purple-200">
                👥 Нетворкинг
              </Badge>
              <h3 className="text-2xl font-bold font-heading mb-3">Закрытый клуб</h3>
              <p className="text-gray-600 mb-4">
                Сообщество, партнёрства и доступ к инструментам
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">Нетворкинг</Badge>
                <Badge variant="outline" className="text-xs">От 2490₽/мес</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl overflow-hidden group hover:shadow-3xl transition-all duration-300 cursor-pointer" onClick={() => navigate('/booking-calendar')}>
            <div className="h-3 bg-gradient-to-r from-emerald-500 to-teal-600"></div>
            <CardContent className="pt-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Icon name="Calendar" className="text-white" size={32} />
              </div>
              <Badge className="mb-3 bg-emerald-50 text-emerald-700 border-emerald-200">
                🤖 AI-менеджер
              </Badge>
              <h3 className="text-2xl font-bold font-heading mb-3">Календарь бронирования</h3>
              <p className="text-gray-600 mb-4">
                Система бронирования с AI-помощником для турбаз и отелей
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">AI-ассистент</Badge>
                <Badge variant="outline" className="text-xs">Автобронирование</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl overflow-hidden group hover:shadow-3xl transition-all duration-300 cursor-pointer" onClick={() => navigate('/diagnostics')}>
            <div className="h-3 bg-gradient-to-r from-orange-500 to-red-600"></div>
            <CardContent className="pt-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Icon name="Target" className="text-white" size={32} />
              </div>
              <Badge className="mb-3 bg-orange-50 text-orange-700 border-orange-200">
                ✨ Бесплатно
              </Badge>
              <h3 className="text-2xl font-bold font-heading mb-3">Диагностика бизнеса</h3>
              <p className="text-gray-600 mb-4">
                Найдите точки роста и риски вашего проекта за 10 минут
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">Анализ 6 блоков</Badge>
                <Badge variant="outline" className="text-xs">Рекомендации</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;