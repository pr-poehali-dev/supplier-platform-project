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

  return (
    <section id="home" className="pt-32 pb-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="https://cdn.poehali.dev/projects/e94f48a9-086e-4e6f-8437-08793577e935/bucket/0_Background_Abstract_1920x1080.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-white/85"></div>
      </div>
      
      <div className="container mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in">
            <Badge className="bg-primary/10 text-primary border-primary/20 backdrop-blur-sm">
              🚀 Платформа нового поколения
            </Badge>
            <h2 className="text-5xl lg:text-6xl font-bold font-heading leading-tight drop-shadow-sm">
              Инструменты для{' '}
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                бизнеса
              </span>{' '}
              в туризме
            </h2>
            <p className="text-xl text-gray-700 drop-shadow-sm">
              Помогаем предпринимателям открыть и развить бизнес в сфере туризма России. Инструменты, советы и сообщество единомышленников.
            </p>
          </div>
          <div className="relative animate-float">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white/40 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/60">
              <div className="text-center space-y-4">
                <div className="text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  2490₽
                </div>
                <p className="text-lg text-gray-700">Начните развивать бизнес уже сегодня</p>
                <Button 
                  size="lg" 
                  onClick={() => navigate('/pricing')}
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 w-full"
                >
                  Попробовать бесплатно
                </Button>
              </div>
            </div>
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