import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface Block {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface DiagnosticsIntroProps {
  diagnosticsBlocks: Block[];
  onStart: () => void;
}

const DiagnosticsIntro = ({ diagnosticsBlocks, onStart }: DiagnosticsIntroProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
            <Icon name="ArrowLeft" className="group-hover:-translate-x-1 transition-transform" size={20} />
            <h1 className="text-2xl font-bold font-heading bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              TourConnect
            </h1>
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Icon name="Sparkles" size={16} />
            Бесплатная диагностика
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 font-heading">
            Диагностика туристического бизнеса
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Найдите точки потери и роста выручки за 10 минут
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Что вы получите:</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Icon name="CheckCircle" className="text-green-500 flex-shrink-0" size={24} />
              <div>
                <p className="font-medium">Карта рисков и точек роста</p>
                <p className="text-sm text-gray-600">Структурированный анализ по 6 блокам</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Icon name="Target" className="text-blue-500 flex-shrink-0" size={24} />
              <div>
                <p className="font-medium">3 ключевые проблемы</p>
                <p className="text-sm text-gray-600">То, что тормозит развитие прямо сейчас</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Icon name="TrendingUp" className="text-purple-500 flex-shrink-0" size={24} />
              <div>
                <p className="font-medium">3 точки роста</p>
                <p className="text-sm text-gray-600">Приоритетные направления для увеличения выручки</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Icon name="MessageSquare" className="text-orange-500 flex-shrink-0" size={24} />
              <div>
                <p className="font-medium">Экспертные комментарии</p>
                <p className="text-sm text-gray-600">Профессиональная оценка без мотивационного мусора</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>6 блоков диагностики:</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {diagnosticsBlocks.map(block => (
                <div key={block.id} className="flex gap-3 p-3 rounded-lg bg-gray-50">
                  <Icon name={block.icon as any} className="text-primary flex-shrink-0" size={24} />
                  <div>
                    <p className="font-medium text-sm">{block.title}</p>
                    <p className="text-xs text-gray-600">{block.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
          <div className="flex gap-3">
            <Icon name="AlertTriangle" className="text-amber-600 flex-shrink-0" size={24} />
            <div className="text-sm text-amber-900">
              <p className="font-medium mb-2">Дисклеймер:</p>
              <p>
                Диагностика носит ознакомительный характер и не является аудитом, бизнес-планом или консультацией.
                Результаты предназначены для понимания текущего состояния проекта.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={onStart}
          className="w-full bg-gradient-to-r from-primary to-secondary text-white text-lg py-6"
          size="lg"
        >
          Начать диагностику
          <Icon name="ArrowRight" className="ml-2" size={20} />
        </Button>
      </div>
    </div>
  );
};

export default DiagnosticsIntro;
