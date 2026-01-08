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
              База знаний для{' '}
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                бизнеса
              </span>{' '}
              в туризме
            </h2>
            <p className="text-xl text-gray-600">
              Помогаем предпринимателям открыть и развить бизнес в сфере туризма России. Инструменты, советы и сообщество единомышленников.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-lg"
                onClick={() => navigate('/diagnostics')}
              >
                Диагностика бизнеса
                <Icon name="ArrowRight" className="ml-2" size={20} />
              </Button>
              <Button size="lg" variant="outline" className="text-lg" onClick={() => navigate('/club')}>
                Клуб партнёров
              </Button>
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

        <div className="grid md:grid-cols-3 gap-6 mt-20">
          {tools.map((tool, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-none overflow-hidden cursor-pointer"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => navigate(tool.action)}
            >
              <div className={`h-2 bg-gradient-to-r ${tool.gradient}`}></div>
              <CardContent className="pt-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon name={tool.icon as any} className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold font-heading mb-2">{tool.title}</h3>
                <p className="text-gray-600">{tool.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;