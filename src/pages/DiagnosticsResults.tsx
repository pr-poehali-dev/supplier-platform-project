import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useEffect, useState } from 'react';
import { saveDiagnosticsResult } from '@/utils/diagnosticsStorage';

interface BlockScore {
  id: string;
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
  level: 'critical' | 'medium' | 'good';
  icon: string;
}

interface Analysis {
  summary: string;
  problems: Array<{ title: string; description: string; icon: string }>;
  opportunities: Array<{ title: string; description: string; icon: string }>;
  expertComments: string[];
}

const DiagnosticsResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [blockScores, setBlockScores] = useState<BlockScore[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const answers = location.state?.answers as Record<string, number> | undefined;
  const savedResult = location.state?.savedResult as boolean | undefined;

  useEffect(() => {
    if (!answers) {
      navigate('/diagnostics');
      return;
    }

    const blocks = [
      { id: 'positioning', title: 'Формат и позиционирование', icon: 'Target', questions: 5 },
      { id: 'pricing', title: 'Цена и загрузка', icon: 'DollarSign', questions: 5 },
      { id: 'seasonality', title: 'Сезонность', icon: 'Calendar', questions: 5 },
      { id: 'upsells', title: 'Допродажи', icon: 'ShoppingBag', questions: 5 },
      { id: 'service', title: 'Персонал и сервис', icon: 'Users', questions: 5 },
      { id: 'management', title: 'Управление', icon: 'BarChart', questions: 5 }
    ];

    const scores: BlockScore[] = blocks.map((block, blockIndex) => {
      let score = 0;
      const maxScore = block.questions * 2;

      for (let i = 1; i <= block.questions; i++) {
        const questionId = `q${blockIndex + 1}_${i}`;
        score += answers[questionId] || 0;
      }

      const percentage = (score / maxScore) * 100;
      let level: 'critical' | 'medium' | 'good' = 'good';
      if (percentage < 40) level = 'critical';
      else if (percentage < 70) level = 'medium';

      return {
        id: block.id,
        title: block.title,
        score,
        maxScore,
        percentage,
        level,
        icon: block.icon
      };
    });

    setBlockScores(scores);
    generateAnalysis(scores);

    if (!savedResult && !isSaved) {
      const totalScore = scores.reduce((sum, b) => sum + b.score, 0);
      const totalMaxScore = scores.reduce((sum, b) => sum + b.maxScore, 0);
      const totalPercentage = Math.round((totalScore / totalMaxScore) * 100);

      saveDiagnosticsResult({
        answers,
        totalScore,
        totalPercentage,
        blockScores: scores
      });
      setIsSaved(true);
    }
  }, [answers, navigate, savedResult, isSaved]);

  const generateAnalysis = (scores: BlockScore[]) => {
    const criticalBlocks = scores.filter(s => s.level === 'critical');
    const mediumBlocks = scores.filter(s => s.level === 'medium');
    const goodBlocks = scores.filter(s => s.level === 'good');

    let summary = '';
    if (criticalBlocks.length >= 3) {
      summary = 'Бизнес находится в зоне высокого риска. Требуется системная работа по нескольким направлениям.';
    } else if (criticalBlocks.length > 0) {
      summary = `Основные потери выручки находятся в блоках: ${criticalBlocks.map(b => b.title.toLowerCase()).join(', ')}.`;
    } else if (mediumBlocks.length > 3) {
      summary = 'Бизнес стабилен, но есть существенные точки роста, которые не используются.';
    } else {
      summary = 'Бизнес находится в хорошем состоянии. Фокус — на масштабировании и оптимизации.';
    }

    const problems: Array<{ title: string; description: string; icon: string }> = [];
    const opportunities: Array<{ title: string; description: string; icon: string }> = [];
    const expertComments: string[] = [];

    scores.forEach(block => {
      if (block.level === 'critical') {
        switch (block.id) {
          case 'positioning':
            problems.push({
              title: 'Размытое позиционирование',
              description: 'Без чёткой концепции сложно выделиться на рынке и обосновать цену.',
              icon: 'AlertCircle'
            });
            expertComments.push('Позиционирование — фундамент ценообразования. Если гость не понимает, за что платит, он выбирает по цене.');
            break;
          case 'pricing':
            problems.push({
              title: 'Потери на ценообразовании',
              description: 'Цена формируется интуитивно, без учёта структуры спроса и экономики.',
              icon: 'TrendingDown'
            });
            expertComments.push('Цена — основной рычаг выручки. Гибкое ценообразование может дать +20-30% к выручке без роста затрат.');
            break;
          case 'seasonality':
            problems.push({
              title: 'Критическая зависимость от сезона',
              description: 'Бизнес зарабатывает 3-4 месяца, остальное время — простой или убытки.',
              icon: 'AlertTriangle'
            });
            expertComments.push('Экономика проекта сильно зависит от высокого сезона — это риск. Один плохой сезон может обнулить год.');
            break;
          case 'upsells':
            problems.push({
              title: 'Допродажи отсутствуют',
              description: 'Потенциал дополнительной выручки не используется совсем.',
              icon: 'XCircle'
            });
            expertComments.push('Допродажи — самый быстрый способ роста. Средний чек может вырасти на 15-25% без роста трафика.');
            break;
          case 'service':
            problems.push({
              title: 'Риск сервисного провала',
              description: 'Нет стандартов, проблемы с персоналом, контроль качества отсутствует.',
              icon: 'Users'
            });
            expertComments.push('Сервис — то, за что платят в туризме. Без стандартов качество случайно, а репутация — под угрозой.');
            break;
          case 'management':
            problems.push({
              title: 'Управление на интуиции',
              description: 'Решения принимаются без цифр, точка безубыточности неизвестна.',
              icon: 'AlertCircle'
            });
            expertComments.push('Управление опирается на интуицию, а не на цифры. Это работает до первого кризиса.');
            break;
        }
      } else if (block.level === 'medium') {
        switch (block.id) {
          case 'seasonality':
            opportunities.push({
              title: 'Межсезонье недоиспользовано',
              description: 'Можно добавить продукты под будни и межсезонье.',
              icon: 'Calendar'
            });
            break;
          case 'upsells':
            opportunities.push({
              title: 'Потенциал допродаж',
              description: 'Есть базовые услуги, но можно создать пакеты и программы.',
              icon: 'ShoppingBag'
            });
            break;
          case 'pricing':
            opportunities.push({
              title: 'Оптимизация ценообразования',
              description: 'Внедрить гибкое ценообразование по сезонам и срокам.',
              icon: 'DollarSign'
            });
            break;
        }
      }
    });

    if (problems.length > 3) {
      problems.splice(3);
    }

    if (opportunities.length === 0) {
      if (goodBlocks.some(b => b.id === 'positioning')) {
        opportunities.push({
          title: 'Масштабирование',
          description: 'При сильном позиционировании можно тиражировать модель.',
          icon: 'Zap'
        });
      }
      if (goodBlocks.some(b => b.id === 'management')) {
        opportunities.push({
          title: 'Автоматизация',
          description: 'Настроить автоматические воронки и аналитику.',
          icon: 'Settings'
        });
      }
      if (goodBlocks.some(b => b.id === 'upsells')) {
        opportunities.push({
          title: 'Премиум-сегмент',
          description: 'Создать VIP-предложения с высокой маржой.',
          icon: 'Crown'
        });
      }
    }

    if (opportunities.length > 3) {
      opportunities.splice(3);
    }

    if (expertComments.length > 3) {
      expertComments.splice(3);
    }

    setAnalysis({
      summary,
      problems,
      opportunities,
      expertComments
    });
  };

  if (!answers || !analysis) {
    return null;
  }

  const totalScore = blockScores.reduce((sum, b) => sum + b.score, 0);
  const totalMaxScore = blockScores.reduce((sum, b) => sum + b.maxScore, 0);
  const totalPercentage = Math.round((totalScore / totalMaxScore) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 gap-2 z-50"
      >
        <Icon name="Home" size={20} />
        На главную
      </Button>
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

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Icon name="CheckCircle" size={16} />
            Диагностика завершена
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 font-heading">Результаты диагностики</h1>
          <p className="text-xl text-gray-600">{analysis.summary}</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Icon name="BarChart" size={28} />
              Общая оценка: {totalPercentage}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {blockScores.map(block => (
                <div
                  key={block.id}
                  className={`p-4 rounded-lg border-2 ${
                    block.level === 'critical'
                      ? 'border-red-200 bg-red-50'
                      : block.level === 'medium'
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-green-200 bg-green-50'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <Icon
                      name={block.icon as any}
                      className={
                        block.level === 'critical'
                          ? 'text-red-500'
                          : block.level === 'medium'
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }
                      size={24}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{block.title}</p>
                      <p className="text-2xl font-bold mt-1">
                        {block.score}/{block.maxScore}
                      </p>
                    </div>
                  </div>
                  <div className="h-2 bg-white rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        block.level === 'critical'
                          ? 'bg-red-500'
                          : block.level === 'medium'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${block.percentage}%` }}
                    />
                  </div>
                  <Badge
                    className={`mt-2 ${
                      block.level === 'critical'
                        ? 'bg-red-500'
                        : block.level === 'medium'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                  >
                    {block.level === 'critical'
                      ? 'Критично'
                      : block.level === 'medium'
                      ? 'Средне'
                      : 'Хорошо'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {analysis.problems.length > 0 && (
          <Card className="mb-8 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-red-700">
                <Icon name="AlertTriangle" size={28} />
                Ключевые проблемы
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.problems.map((problem, index) => (
                  <div key={index} className="flex gap-4 p-4 bg-red-50 rounded-lg">
                    <Icon name={problem.icon as any} className="text-red-500 flex-shrink-0" size={24} />
                    <div>
                      <p className="font-semibold text-red-900 mb-1">{problem.title}</p>
                      <p className="text-sm text-red-800">{problem.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {analysis.opportunities.length > 0 && (
          <Card className="mb-8 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-green-700">
                <Icon name="TrendingUp" size={28} />
                Точки роста
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.opportunities.map((opportunity, index) => (
                  <div key={index} className="flex gap-4 p-4 bg-green-50 rounded-lg">
                    <Icon name={opportunity.icon as any} className="text-green-600 flex-shrink-0" size={24} />
                    <div>
                      <p className="font-semibold text-green-900 mb-1">{opportunity.title}</p>
                      <p className="text-sm text-green-800">{opportunity.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {analysis.expertComments.length > 0 && (
          <Card className="mb-8 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-blue-700">
                <Icon name="MessageSquare" size={28} />
                Экспертные комментарии
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.expertComments.map((comment, index) => (
                  <div key={index} className="flex gap-3 p-4 bg-blue-50 rounded-lg">
                    <Icon name="Quote" className="text-blue-500 flex-shrink-0" size={20} />
                    <p className="text-sm text-blue-900">{comment}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
          <div className="flex gap-3">
            <Icon name="Info" className="text-amber-600 flex-shrink-0" size={24} />
            <div className="text-sm text-amber-900">
              <p className="font-medium mb-2">Дисклеймер:</p>
              <p>
                Диагностика носит ознакомительный характер и не является аудитом, бизнес-планом или консультацией.
                Результаты предназначены для понимания текущего состояния проекта.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={() => navigate('/profile')} variant="outline" size="lg" className="flex-1">
            <Icon name="History" className="mr-2" size={20} />
            История диагностик
          </Button>
          <Button onClick={() => navigate('/diagnostics')} variant="outline" size="lg" className="flex-1">
            <Icon name="RotateCcw" className="mr-2" size={20} />
            Пройти заново
          </Button>
          <Button onClick={() => navigate('/club')} className="flex-1 bg-gradient-to-r from-primary to-secondary" size="lg">
            <Icon name="Sparkles" className="mr-2" size={20} />
            Присоединиться к клубу
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticsResults;