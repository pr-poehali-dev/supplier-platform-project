import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface Analysis {
  summary: string;
  problems: Array<{ title: string; description: string; icon: string }>;
  opportunities: Array<{ title: string; description: string; icon: string }>;
  expertComments: string[];
}

interface AnalysisSummaryProps {
  analysis: Analysis;
}

export default function AnalysisSummary({ analysis }: AnalysisSummaryProps) {
  return (
    <>
      <Card className="border-none shadow-2xl mb-8 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="FileText" size={24} />
            Общая оценка
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed">{analysis.summary}</p>
        </CardContent>
      </Card>

      {analysis.problems.length > 0 && (
        <Card className="border-none shadow-2xl mb-8 border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <Icon name="AlertCircle" size={24} />
              Критические проблемы ({analysis.problems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.problems.map((problem, idx) => (
                <div key={idx} className="flex gap-4 p-4 bg-red-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <Icon name={problem.icon as any} size={24} className="text-red-600" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">{problem.title}</h4>
                    <p className="text-gray-700">{problem.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {analysis.opportunities.length > 0 && (
        <Card className="border-none shadow-2xl mb-8 border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Icon name="TrendingUp" size={24} />
              Точки роста ({analysis.opportunities.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.opportunities.map((opportunity, idx) => (
                <div key={idx} className="flex gap-4 p-4 bg-green-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <Icon name={opportunity.icon as any} size={24} className="text-green-600" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">{opportunity.title}</h4>
                    <p className="text-gray-700">{opportunity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {analysis.expertComments.length > 0 && (
        <Card className="border-none shadow-2xl mb-8 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="MessageSquare" size={24} />
              Комментарии эксперта
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.expertComments.map((comment, idx) => (
                <div key={idx} className="flex gap-3 p-4 bg-white rounded-lg shadow">
                  <Icon name="Quote" size={20} className="text-purple-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-700 italic">{comment}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
