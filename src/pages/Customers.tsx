import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { fetchWithAuth } from '@/lib/api';
import CustomerStats from '@/components/customers/CustomerStats';
import CustomerTable from '@/components/customers/CustomerTable';

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
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);

  useEffect(() => {
    loadCustomers();
    loadPendingBookings();
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
        headers: { 'X-Owner-Id': userId.toString() }
      });
      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (error) {
      // Error loading customers
    } finally {
      setLoading(false);
    }
  };

  const loadPendingBookings = async () => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const response = await fetchWithAuth(`https://functions.poehali.dev/9f1887ba-ac1c-402a-be0d-4ae5c1a9175d?action=bookings`, {
        headers: { 'X-Owner-Id': userId.toString() }
      });
      const data = await response.json();
      const pending = (data.bookings || []).filter((b: any) => b.is_pending_confirmation);
      setPendingBookings(pending);
    } catch (error) {
      // Error loading bookings
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

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (showPendingOnly) {
      const hasPending = pendingBookings.some(b => b.guest_phone === c.phone || b.guest_name === c.name);
      return matchesSearch && hasPending;
    }
    
    return matchesSearch;
  });

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

        <CustomerStats {...stats} />

        <CustomerTable
          customers={filteredCustomers}
          totalCustomers={customers.length}
          searchQuery={searchQuery}
          showPendingOnly={showPendingOnly}
          pendingCount={pendingBookings.length}
          loading={loading}
          onSearchChange={setSearchQuery}
          onTogglePending={() => setShowPendingOnly(!showPendingOnly)}
          onSync={syncCustomers}
          onExport={exportToCSV}
        />
      </div>
    </div>
  );
}
