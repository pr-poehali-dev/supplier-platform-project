import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  last_booking_date: string;
  total_bookings: number;
  total_spent: number;
}

interface CustomerTableProps {
  customers: Customer[];
  totalCustomers: number;
  searchQuery: string;
  showPendingOnly: boolean;
  pendingCount: number;
  loading: boolean;
  onSearchChange: (query: string) => void;
  onTogglePending: () => void;
  onSync: () => void;
  onExport: () => void;
}

export default function CustomerTable({
  customers,
  totalCustomers,
  searchQuery,
  showPendingOnly,
  pendingCount,
  loading,
  onSearchChange,
  onTogglePending,
  onSync,
  onExport
}: CustomerTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle>Клиенты</CardTitle>
            <CardDescription>
              {customers.length} из {totalCustomers} клиентов
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={onTogglePending}
              variant={showPendingOnly ? "default" : "outline"}
              className={`gap-2 ${showPendingOnly ? 'animate-pulse' : ''}`}
            >
              <Icon name="AlertCircle" size={16} />
              Заявки {pendingCount > 0 && `(${pendingCount})`}
            </Button>
            <Input
              placeholder="Поиск по имени, телефону, email..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-80"
            />
            <Button onClick={onSync} variant="outline" disabled={loading}>
              <Icon name="RefreshCw" size={16} className={loading ? 'animate-spin' : ''} />
            </Button>
            <Button onClick={onExport} variant="outline">
              <Icon name="Download" size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Icon name="Loader2" className="animate-spin" size={32} />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Icon name="Users" size={48} className="mx-auto mb-2 text-gray-300" />
            <p>Клиенты не найдены</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Имя</th>
                  <th className="text-left p-3">Контакты</th>
                  <th className="text-left p-3">Последнее бронирование</th>
                  <th className="text-left p-3">Брони</th>
                  <th className="text-left p-3">Потрачено</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{customer.name}</td>
                    <td className="p-3">
                      <div className="space-y-1">
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Icon name="Phone" size={14} />
                            {customer.phone}
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Icon name="Mail" size={14} />
                            {customer.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {customer.last_booking_date
                        ? new Date(customer.last_booking_date).toLocaleDateString('ru-RU')
                        : 'Нет'}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">{customer.total_bookings}</Badge>
                    </td>
                    <td className="p-3 font-semibold text-green-600">
                      {customer.total_spent}₽
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
