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

  const advantages = [
    {
      icon: 'Users',
      title: 'Проверенная сеть',
      description: '500+ надежных партнеров со всего мира',
      gradient: 'from-primary to-secondary',
    },
    {
      icon: 'Zap',
      title: 'Автоматизация',
      description: 'Технологии, которые экономят время и ресурсы',
      gradient: 'from-secondary to-accent',
    },
    {
      icon: 'TrendingUp',
      title: 'Рост бизнеса',
      description: 'Инструменты для масштабирования вашей компании',
      gradient: 'from-accent to-primary',
    },
    {
      icon: 'Shield',
      title: 'Надежность',
      description: 'Защита данных и прозрачные условия сотрудничества',
      gradient: 'from-primary/80 to-secondary/80',
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
              Платформа для{' '}
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                профессионалов
              </span>{' '}
              туризма
            </h2>
            <p className="text-xl text-gray-600">
              Находим партнёров, автоматизируем процессы, растём вместе. Присоединяйтесь к экосистеме, где каждый находит своё место.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-lg"
                onClick={() => scrollToSection('contact')}
              >
                Стать поставщиком
                <Icon name="ArrowRight" className="ml-2" size={20} />
              </Button>
              <Button size="lg" variant="outline" className="text-lg" onClick={() => navigate('/simulator')}>
                Симулятор бизнеса
              </Button>
            </div>
          </div>
          <div className="relative animate-float">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-3xl"></div>
            <img
              src="https://cdn.poehali.dev/projects/e94f48a9-086e-4e6f-8437-08793577e935/files/d8dbc1da-916a-40f4-bf88-eb6eddb1fdf7.jpg"
              alt="Tourism platform"
              className="relative rounded-3xl shadow-2xl w-full"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          {advantages.map((advantage, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-none overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`h-2 bg-gradient-to-r ${advantage.gradient}`}></div>
              <CardContent className="pt-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${advantage.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon name={advantage.icon as any} className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold font-heading mb-2">{advantage.title}</h3>
                <p className="text-gray-600">{advantage.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
