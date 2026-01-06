import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';

const FeaturesSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="border-none shadow-2xl overflow-hidden group hover:shadow-3xl transition-all duration-300">
            <div className="h-3 bg-gradient-to-r from-blue-500 to-cyan-600"></div>
            <CardContent className="pt-8">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Icon name="Calculator" className="text-white" size={32} />
                </div>
                <div className="flex-1">
                  <Badge className="mb-3 bg-blue-50 text-blue-700 border-blue-200">
                    📊 Бесплатный инструмент
                  </Badge>
                  <h3 className="text-2xl font-bold font-heading mb-3">
                    Симулятор отельера
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Рассчитайте потенциальную прибыль вашего глемпинга, арт-отеля или базы отдыха. 
                    Узнайте, сколько сможете зарабатывать и получите персональные рекомендации.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <Badge variant="outline" className="text-xs">Расчёт прибыли</Badge>
                    <Badge variant="outline" className="text-xs">Прогноз загрузки</Badge>
                    <Badge variant="outline" className="text-xs">Рекомендации</Badge>
                  </div>
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/simulator')}
                    className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:opacity-90 w-full"
                  >
                    Попробовать симулятор
                    <Icon name="ArrowRight" className="ml-2" size={20} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl overflow-hidden group hover:shadow-3xl transition-all duration-300">
            <div className="h-3 bg-gradient-to-r from-purple-500 to-pink-600"></div>
            <CardContent className="pt-8">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Icon name="Crown" className="text-white" size={32} />
                </div>
                <div className="flex-1">
                  <Badge className="mb-3 bg-purple-50 text-purple-700 border-purple-200">
                    👑 Премиум доступ
                  </Badge>
                  <h3 className="text-2xl font-bold font-heading mb-3">
                    Закрытый клуб партнёров
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Вступите в элитное сообщество профессионалов туризма. 500+ проверенных партнёров, 
                    закрытые мероприятия и рост прибыли до 40%.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <Badge variant="outline" className="text-xs">Сеть партнёров</Badge>
                    <Badge variant="outline" className="text-xs">Мероприятия</Badge>
                    <Badge variant="outline" className="text-xs">Менеджер 24/7</Badge>
                  </div>
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/club')}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:opacity-90 w-full"
                  >
                    Узнать о клубе
                    <Icon name="Sparkles" className="ml-2" size={20} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
