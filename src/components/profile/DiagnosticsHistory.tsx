import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface DiagnosticsResult {
  id: string;
  date: string;
  answers: any;
}

interface DiagnosticsHistoryProps {
  results: DiagnosticsResult[];
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (date: string) => string;
}

export default function DiagnosticsHistory({ results, onView, onDelete, formatDate }: DiagnosticsHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="FileText" size={24} />
          История диагностики
        </CardTitle>
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Нет сохранённых результатов</p>
        ) : (
          <div className="space-y-3">
            {results.map((result) => (
              <div key={result.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Диагностика от {formatDate(result.date)}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onView(result.id)}
                  >
                    <Icon name="Eye" size={16} className="mr-2" />
                    Открыть
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(result.id)}
                  >
                    <Icon name="Trash2" size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
