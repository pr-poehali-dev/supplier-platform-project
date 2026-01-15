import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { fetchWithAuth } from '@/lib/api';

const AI_URL = 'https://functions.poehali.dev/f62c6672-5e97-4934-af5c-2f4fa9dca61a';
const CUSTOMER_SYNC_URL = 'https://functions.poehali.dev/4ead0222-a7b6-4305-b43d-20c7df4920ce';

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  telegram_id: number;
  last_booking_date: string;
  total_bookings: number;
  total_spent: number;
  notes: string;
  created_at: string;
}

export default function Customers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const getUserId = () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    return user?.id;
  };

  const loadCustomers = async () => {
    const userId = getUserId();
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetchWithAuth(`${AI_URL}?action=customers`, {
        headers: { 'X-User-Id': userId.toString() }
      });
      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (error) {
      // Error loading customers
    } finally {
      setLoading(false);
    }
  };

  const syncCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(CUSTOMER_SYNC_URL, { method: 'POST' });
      const data = await response.json();
      
      toast({
        title: 'Синхронизация завершена',
        description: `Обновлено: ${data.synced || 0}, Создано: ${data.created || 0}`,
      });
      
      await loadCustomers();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка синхронизации',
        description: 'Не удалось синхронизировать клиентов',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Имя', 'Телефон', 'Email', 'Последнее бронирование', 'Всего броней', 'Сумма покупок'];
    const rows = filteredCustomers.map(c => [
      c.name,
      c.phone || '',
      c.email || '',
      c.last_booking_date ? new Date(c.last_booking_date).toLocaleDateString('ru-RU') : 'Нет',
      c.total_bookings.toString(),
      `${c.total_spent}₽`
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: 'Экспорт выполнен',
      description: `Выгружено ${filteredCustomers.length} клиентов`
    });
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: customers.length,
    totalRevenue: customers.reduce((sum, c) => sum + c.total_spent, 0),
    avgSpent: customers.length > 0
      ? customers.reduce((sum, c) => sum + c.total_spent, 0) / customers.length
      : 0,
    totalBookings: customers.reduce((sum, c) => sum + c.total_bookings, 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 p-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/booking-calendar')}
        className="fixed top-4 left-4 gap-2 z-50"
      >
        <Icon name="ArrowLeft" size={20} />
        Назад
      </Button>

      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            <Icon name="Users" className="inline-block mr-2" size={36} />
            База клиентов
          </h1>
          <p className="text-gray-600">
            Полная информация о ваших гостях и их бронированиях
          </p>
        </div>

        {/* Статистика */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Всего клиентов</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Общая выручка</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.totalRevenue.toFixed(0)}₽</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Средний чек</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{stats.avgSpent.toFixed(0)}₽</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Всего броней</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{stats.totalBookings}</p>
            </CardContent>
          </Card>
        </div>

        {/* Список клиентов */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle>Клиенты</CardTitle>
                <CardDescription>
                  {filteredCustomers.length} из {customers.length} клиентов
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Поиск по имени, телефону, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80"
                />
                <Button 
                  onClick={syncCustomers} 
                  variant="outline" 
                  disabled={loading}
                  className="gap-2"
                  title="Синхронизировать клиентов из бронирований"
                >
                  <Icon name={loading ? "Loader2" : "RefreshCw"} size={16} className={loading ? "animate-spin" : ""} />
                  Синхронизация
                </Button>
                <Button onClick={exportToCSV} variant="outline" className="gap-2">
                  <Icon name="Download" size={16} />
                  Экспорт CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Icon name="Loader2" size={32} className="animate-spin mx-auto" />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Icon name="Users" size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg mb-2">
                  {searchQuery ? 'Клиенты не найдены' : 'База клиентов пока пуста'}
                </p>
                <p className="text-sm">
                  {searchQuery
                    ? 'Попробуйте изменить поисковый запрос'
                    : 'Клиенты появятся автоматически после первых бронирований'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCustomers.map((customer) => (
                  <Card key={customer.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{customer.name}</h3>
                            {customer.telegram_id && (
                              <Badge variant="outline" className="gap-1">
                                <Icon name="MessageCircle" size={12} />
                                Telegram
                              </Badge>
                            )}
                          </div>
                          <div className="grid md:grid-cols-3 gap-3 text-sm text-gray-600">
                            {customer.phone && (
                              <div className="flex items-center gap-2">
                                <Icon name="Phone" size={14} />
                                {customer.phone}
                              </div>
                            )}
                            {customer.email && (
                              <div className="flex items-center gap-2">
                                <Icon name="Mail" size={14} />
                                {customer.email}
                              </div>
                            )}
                            {customer.last_booking_date && (
                              <div className="flex items-center gap-2">
                                <Icon name="Calendar" size={14} />
                                Последнее: {new Date(customer.last_booking_date).toLocaleDateString('ru-RU')}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-2xl font-bold text-green-600">
                            {customer.total_spent}₽
                          </p>
                          <p className="text-sm text-gray-500">
                            {customer.total_bookings} {customer.total_bookings === 1 ? 'бронь' : 'броней'}
                          </p>
                        </div>
                      </div>
                      {customer.notes && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-gray-600">
                            <Icon name="FileText" size={14} className="inline mr-1" />
                            {customer.notes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}