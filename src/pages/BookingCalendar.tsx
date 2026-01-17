import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import UnitsManagement, { Unit } from '@/components/booking/UnitsManagement';
import CalendarView, { Booking } from '@/components/booking/CalendarView';
import BookingDialog from '@/components/booking/BookingDialog';
import IntegrationAccordion from '@/components/booking/IntegrationAccordion';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import DynamicPricing from '@/components/pricing/DynamicPricing';
import { canAddUnit, getSubscriptionLimits } from '@/utils/subscription';
import { useToast } from '@/hooks/use-toast';
import { usePageMeta } from '@/hooks/usePageMeta';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema } from '@/utils/seo';
import { fetchWithAuth, getUser } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const API_URL = 'https://functions.poehali.dev/9f1887ba-ac1c-402a-be0d-4ae5c1a9175d';
const CUSTOMER_SYNC_URL = 'https://functions.poehali.dev/4ead0222-a7b6-4305-b43d-20c7df4920ce';

export default function BookingCalendar() {
  usePageMeta({
    title: 'Календарь бронирований',
    description: 'Управление бронированиями объектов размещения: календарь загрузки, цены, автоматизация через Telegram',
    keywords: 'календарь бронирований, управление объектами, турбаза, глэмпинг, бронирование онлайн'
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const [units, setUnits] = useState<Unit[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const user = getUser();
  const [botLink, setBotLink] = useState('');

  useEffect(() => {
    if (!user) {
      toast({
        title: 'Требуется авторизация',
        description: 'Войдите в систему для доступа к календарю',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }
    
    setBotLink(`https://t.me/YOUR_BOT_USERNAME?start=${user.id}`);
    
    loadUnits();
    loadBookings();
  }, [navigate, toast]);

  const loadUnits = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}?action=units`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Фоллбэк: если бэкенд не вернул dynamic_pricing_enabled, добавляем по умолчанию
      const unitsWithDefaults = (data.units || []).map((unit: Unit) => ({
        ...unit,
        dynamic_pricing_enabled: unit.dynamic_pricing_enabled ?? false,
        pricing_profile_id: unit.pricing_profile_id ?? 1
      }));
      
      setUnits(unitsWithDefaults);
      if (unitsWithDefaults.length > 0 && !selectedUnit) {
        setSelectedUnit(unitsWithDefaults[0]);
      }
    } catch (error) {
      console.error('Error loading units:', error);
      toast({
        title: 'Ошибка загрузки объектов',
        description: error instanceof Error ? error.message : 'Проверьте авторизацию',
        variant: 'destructive',
      });
    }
  };

  const loadBookings = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}?action=bookings`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast({
        title: 'Ошибка загрузки броней',
        description: error instanceof Error ? error.message : 'Проверьте авторизацию',
        variant: 'destructive',
      });
    }
  };

  const addUnit = async (newUnit: {
    name: string;
    type: string;
    description: string;
    base_price: string;
    max_guests: string;
  }) => {
    if (!newUnit.name || !newUnit.base_price || !newUnit.max_guests) {
      alert('Заполните все поля');
      return;
    }

    if (!canAddUnit(units.length)) {
      const limits = getSubscriptionLimits();
      toast({
        title: 'Достигнут лимит номеров',
        description: `Ваш тариф позволяет создать до ${limits.maxUnits} номеров. Обновите подписку для добавления новых.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetchWithAuth(`${API_URL}?action=create-unit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUnit)
      });
      
      if (response.ok) {
        await loadUnits();
      }
    } catch (error) {
      // Error adding unit
    }
  };

  const updateUnit = async (unitId: number, updatedUnit: {
    name: string;
    type: string;
    description: string;
    base_price: string;
    max_guests: string;
  }) => {
    if (!updatedUnit.name || !updatedUnit.base_price || !updatedUnit.max_guests) {
      alert('Заполните все поля');
      return;
    }

    try {
      const response = await fetchWithAuth(`${API_URL}?action=update-unit&unit_id=${unitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUnit)
      });
      
      if (response.ok) {
        await loadUnits();
        toast({
          title: 'Успешно',
          description: 'Объект обновлён',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить объект',
        variant: 'destructive',
      });
    }
  };

  const deleteUnit = async (unitId: number) => {
    try {
      const response = await fetchWithAuth(`${API_URL}?action=delete-unit&unit_id=${unitId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        if (selectedUnit?.id === unitId) {
          setSelectedUnit(null);
        }
        await loadUnits();
        await loadBookings();
        toast({
          title: 'Объект удалён',
          description: 'Объект успешно удалён из системы',
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Ошибка',
          description: errorData.error || 'Не удалось удалить объект',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при удалении объекта',
        variant: 'destructive',
      });
    }
  };

  const createBooking = async (newBooking: {
    check_in: string;
    check_out: string;
    guest_name: string;
    guest_phone: string;
  }) => {
    if (!selectedUnit || !newBooking.check_in || !newBooking.check_out || !newBooking.guest_name) {
      alert('Заполните все обязательные поля');
      return;
    }

    try {
      const response = await fetchWithAuth(`${API_URL}?action=create-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: selectedUnit.id,
          ...newBooking
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        await loadBookings();
        
        // Синхронизируем базу клиентов
        try {
          await fetchWithAuth(CUSTOMER_SYNC_URL, { method: 'POST' });
        } catch (err) {
          // Customer sync failed
        }
      } else {
        alert(data.error || 'Ошибка создания бронирования');
      }
    } catch (error) {
      alert('Ошибка создания бронирования');
    }
  };

  const deleteBooking = async (bookingId: number) => {
    try {
      const response = await fetchWithAuth(`${API_URL}?action=delete-booking&booking_id=${bookingId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadBookings();
      }
    } catch (error) {
      // Error deleting booking
    }
  };

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  const breadcrumbs = breadcrumbSchema([
    { name: 'Главная', url: '/' },
    { name: 'Календарь бронирований', url: '/booking-calendar' }
  ]);

  return (
    <SubscriptionGuard feature="hasCalendar" featureName="календаря бронирования">
      <JsonLd data={breadcrumbs} />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="fixed top-4 left-4 gap-2 z-50"
        >
          <Icon name="Home" size={20} />
          На главную
        </Button>
        
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="fixed top-4 right-4 gap-2 z-50 bg-white hover:bg-gray-50 shadow-md"
              >
                <Icon name="User" size={16} className="text-indigo-600" />
                <span className="text-sm font-medium text-gray-700">{user.full_name || user.email}</span>
                <Icon name="ChevronDown" size={16} className="text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <Icon name="User" className="mr-2" size={16} />
                Профиль
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/pricing')}>
                <Icon name="CreditCard" className="mr-2" size={16} />
                Подписка
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  localStorage.removeItem('user');
                  navigate('/auth');
                }}
                className="text-red-600 focus:text-red-600"
              >
                <Icon name="LogOut" className="mr-2" size={16} />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              <Icon name="Calendar" className="inline-block mr-2" size={36} />
              Календарь бронирования
            </h1>
            <p className="text-gray-600 mb-4">
              Управляйте бронированиями для турбаз и гостевых домов
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button
                variant="outline"
                onClick={() => navigate('/additional-services')}
                className="gap-2"
              >
                <Icon name="Plus" size={16} />
                Допродажи
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/customers')}
                className="gap-2"
              >
                <Icon name="Users" size={16} />
                База клиентов
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/bot-settings')}
                className="gap-2"
              >
                <Icon name="Bot" size={16} />
                Настройки AI
              </Button>
            </div>
          </div>

          <UnitsManagement
            units={units}
            selectedUnit={selectedUnit}
            onSelectUnit={setSelectedUnit}
            onAddUnit={addUnit}
            onUpdateUnit={updateUnit}
            onDeleteUnit={deleteUnit}
          />

          <DynamicPricing 
            selectedUnit={selectedUnit}
            onUnitUpdate={loadUnits}
          />

          <CalendarView
            selectedUnit={selectedUnit}
            currentDate={currentDate}
            bookings={bookings}
            onChangeMonth={changeMonth}
            onDeleteBooking={deleteBooking}
            renderBookingButton={
              <BookingDialog
                selectedUnit={selectedUnit}
                onCreateBooking={createBooking}
              />
            }
          />

          <IntegrationAccordion 
            botLink={botLink} 
            units={units}
          />
        </div>
      </div>
    </SubscriptionGuard>
  );
}