import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Holiday {
  date: string;
  name: string;
}

interface HolidaysListProps {
  holidays: Holiday[];
  enabled: boolean;
}

export default function HolidaysList({ holidays, enabled }: HolidaysListProps) {
  if (!enabled) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Calendar" size={20} />
          Ближайшие праздники
        </CardTitle>
      </CardHeader>
      <CardContent>
        {holidays.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Нет данных о праздниках</p>
        ) : (
          <div className="space-y-2">
            {holidays.slice(0, 10).map((holiday, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="font-medium">{holiday.name}</span>
                <Badge variant="outline">
                  {new Date(holiday.date).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long'
                  })}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
