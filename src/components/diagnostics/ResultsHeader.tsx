import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';

interface ResultsHeaderProps {
  totalScore: number;
  totalMaxScore: number;
  totalPercentage: number;
}

export default function ResultsHeader({ totalScore, totalMaxScore, totalPercentage }: ResultsHeaderProps) {
  const navigate = useNavigate();

  const getOverallLevel = () => {
    if (totalPercentage < 40) return { text: 'Критический уровень', color: 'bg-red-100 text-red-800 border-red-300' };
    if (totalPercentage < 60) return { text: 'Требуется внимание', color: 'bg-orange-100 text-orange-800 border-orange-300' };
    if (totalPercentage < 75) return { text: 'Средний уровень', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    return { text: 'Отличное состояние', color: 'bg-green-100 text-green-800 border-green-300' };
  };

  const level = getOverallLevel();

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 gap-2 z-50"
      >
        <Icon name="Home" size={20} />
        На главную
      </Button>

      <div className="max-w-6xl mx-auto mb-12 text-center">
        <h1 className="text-4xl font-bold font-heading mb-4">
          Результаты диагностики
        </h1>
        
        <div className="inline-flex items-center gap-4 bg-white rounded-2xl p-6 shadow-xl">
          <div className="text-center">
            <div className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {totalScore}
            </div>
            <div className="text-sm text-gray-600 mt-1">из {totalMaxScore} баллов</div>
          </div>
          
          <div className="h-16 w-px bg-gray-200"></div>
          
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-800">
              {totalPercentage}%
            </div>
            <Badge className={level.color}>
              {level.text}
            </Badge>
          </div>
        </div>
      </div>
    </>
  );
}
