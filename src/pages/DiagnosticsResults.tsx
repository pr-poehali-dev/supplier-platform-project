import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { saveDiagnosticsResult } from '@/utils/diagnosticsStorage';
import ResultsHeader from '@/components/diagnostics/ResultsHeader';
import ScoreCharts from '@/components/diagnostics/ScoreCharts';
import AnalysisSummary from '@/components/diagnostics/AnalysisSummary';
import BlockDetails from '@/components/diagnostics/BlockDetails';

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

    setAnalysis({ summary, problems, opportunities, expertComments });
  };

  if (!answers || !analysis) {
    return null;
  }

  const totalScore = blockScores.reduce((sum, b) => sum + b.score, 0);
  const totalMaxScore = blockScores.reduce((sum, b) => sum + b.maxScore, 0);
  const totalPercentage = Math.round((totalScore / totalMaxScore) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 p-6">
      <ResultsHeader 
        totalScore={totalScore}
        totalMaxScore={totalMaxScore}
        totalPercentage={totalPercentage}
      />

      <div className="max-w-4xl mx-auto">
        <ScoreCharts blockScores={blockScores} />
        <AnalysisSummary analysis={analysis} />
        <BlockDetails blockScores={blockScores} />

        <div className="flex gap-4 justify-center mt-8">
          <Button
            size="lg"
            onClick={() => navigate('/diagnostics')}
            variant="outline"
          >
            Пройти заново
          </Button>
          <Button
            size="lg"
            onClick={() => navigate('/pricing')}
            className="bg-gradient-to-r from-primary to-secondary"
          >
            Выбрать тариф
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticsResults;
