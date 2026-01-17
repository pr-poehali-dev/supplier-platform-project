import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface BlockScore {
  id: string;
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
  level: 'critical' | 'medium' | 'good';
  icon: string;
}

interface ScoreChartsProps {
  blockScores: BlockScore[];
}

export default function ScoreCharts({ blockScores }: ScoreChartsProps) {
  const getLevelColor = (level: 'critical' | 'medium' | 'good') => {
    if (level === 'critical') return 'bg-red-500';
    if (level === 'medium') return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getLevelBadge = (level: 'critical' | 'medium' | 'good') => {
    if (level === 'critical') return <Badge className="bg-red-100 text-red-800 border-red-300">Критично</Badge>;
    if (level === 'medium') return <Badge className="bg-orange-100 text-orange-800 border-orange-300">Средне</Badge>;
    return <Badge className="bg-green-100 text-green-800 border-green-300">Хорошо</Badge>;
  };

  return (
    <Card className="border-none shadow-2xl mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="BarChart" size={24} />
          Оценка по блокам
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {blockScores.map((block) => (
            <div key={block.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon name={block.icon as any} size={20} className="text-gray-600" />
                  <span className="font-medium">{block.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    {block.score} / {block.maxScore}
                  </span>
                  {getLevelBadge(block.level)}
                </div>
              </div>
              
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getLevelColor(block.level)} transition-all duration-500`}
                  style={{ width: `${block.percentage}%` }}
                />
              </div>
              
              <div className="text-right text-sm text-gray-500 mt-1">
                {Math.round(block.percentage)}%
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
