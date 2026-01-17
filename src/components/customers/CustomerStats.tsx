import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CustomerStatsProps {
  total: number;
  totalRevenue: number;
  avgSpent: number;
  totalBookings: number;
}

export default function CustomerStats({ total, totalRevenue, avgSpent, totalBookings }: CustomerStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-600">Всего клиентов</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{total}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-600">Общая выручка</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-600">{totalRevenue.toFixed(0)}₽</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-600">Средний чек</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-blue-600">{avgSpent.toFixed(0)}₽</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-600">Всего броней</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-purple-600">{totalBookings}</p>
        </CardContent>
      </Card>
    </div>
  );
}
