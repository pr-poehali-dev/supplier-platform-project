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

const API_URL = 'https://functions.poehali.dev/9f1887ba-ac1c-402a-be0d-4ae5c1a9175d';
const DELETE_UNIT_URL = 'https://functions.poehali.dev/99916984-c945-4b8d-9af9-fc88342eb58a';

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
  const [user, setUser] = useState<any>(null);
  const [botLink, setBotLink] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      setBotLink(`https://t.me/YOUR_BOT_USERNAME?start=${userData.id}`);
    }
    loadUnits();
    loadBookings();
  }, []);

  const loadUnits = async () => {
    try {
      const response = await fetch(`${API_URL}?action=units`);
      const data = await response.json();
      console.log('📦 Units loaded from API:', data.units);
      
      // Временное решение: добавляем dynamic_pricing_enabled если его нет
      const unitsWithDynamic = (data.units || []).map((unit: Unit) => ({
        ...unit,
        dynamic_pricing_enabled: unit.dynamic_pricing_enabled ?? true, // Временно true для тестирования
        pricing_profile_id: unit.pricing_profile_id ?? 1
      }));
      
      console.log('✅ Units with dynamic pricing:', unitsWithDynamic);
      setUnits(unitsWithDynamic);
      if (unitsWithDynamic.length > 0 && !selectedUnit) {
        console.log('✅ Selected unit:', unitsWithDynamic[0]);
        setSelectedUnit(unitsWithDynamic[0]);
      }
    } catch (error) {
      console.error('Error loading units:', error);
    }
  };

  const loadBookings = async () => {
    try {
      const response = await fetch(`${API_URL}?action=bookings`);
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
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
      const response = await fetch(`${API_URL}?action=create-unit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUnit)
      });
      
      if (response.ok) {
        await loadUnits();
      }
    } catch (error) {
      console.error('Error adding unit:', error);
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
      const response = await fetch(`${API_URL}?action=update-unit&unit_id=${unitId}`, {
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
      console.error('Error updating unit:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить объект',
        variant: 'destructive',
      });
    }
  };

  const deleteUnit = async (unitId: number) => {
    try {
      const response = await fetch(`${DELETE_UNIT_URL}?unit_id=${unitId}`, {
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
      console.error('Error deleting unit:', error);
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
      const response = await fetch(`${API_URL}?action=create-booking`, {
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
      } else {
        alert(data.error || 'Ошибка создания бронирования');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Ошибка создания бронирования');
    }
  };

  const deleteBooking = async (bookingId: number) => {
    try {
      const response = await fetch(`${API_URL}?action=delete-booking&booking_id=${bookingId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadBookings();
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
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
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              <Icon name="Calendar" className="inline-block mr-2" size={36} />
              Календарь бронирования
            </h1>
            <p className="text-gray-600">
              Управляйте бронированиями для турбаз и гостевых домов
            </p>
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