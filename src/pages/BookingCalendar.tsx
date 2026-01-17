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
import SBPSettings from '@/components/payment/SBPSettings';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  const [showPendingRequests, setShowPendingRequests] = useState(false);

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

  const updateBookingStatus = async (bookingId: number, newStatus: string) => {
    try {
      const response = await fetchWithAuth(`${API_URL}?action=update-booking-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          status: newStatus,
          payment_status: newStatus === 'confirmed' ? 'paid' : 'pending',
          is_pending_confirmation: false
        })
      });

      if (response.ok) {
        await loadBookings();
        toast({
          title: 'Статус обновлен',
          description: newStatus === 'confirmed' ? 'Бронь подтверждена' : 'Статус изменен'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить статус',
        variant: 'destructive'
      });
    }
  };

  const scrollToBooking = (bookingDate: string) => {
    const date = new Date(bookingDate);
    setCurrentDate(date);
    setTimeout(() => {
      const element = document.getElementById('calendar-view');
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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
              {bookings.filter(b => b.is_pending_confirmation || b.payment_status === 'pending').length > 0 && (
                <Button
                  onClick={() => setShowPendingRequests(true)}
                  className="gap-2 bg-yellow-500 hover:bg-yellow-600 animate-pulse"
                >
                  <Icon name="AlertCircle" size={16} />
                  Заявки ({bookings.filter(b => b.is_pending_confirmation || b.payment_status === 'pending').length})
                </Button>
              )}
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

          <div id="calendar-view">
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
          </div>

          <div className="mt-6">
            <SBPSettings />
          </div>

          <IntegrationAccordion 
            botLink={botLink} 
            units={units}
          />
        </div>

        {/* Модальное окно со списком заявок */}
        <Dialog open={showPendingRequests} onOpenChange={setShowPendingRequests}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Icon name="AlertCircle" size={24} className="text-yellow-500" />
                Заявки на бронирование
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {bookings
                .filter(b => b.is_pending_confirmation || b.payment_status === 'pending')
                .map((booking) => {
                  const unit = units.find(u => u.id === booking.unit_id);
                  const isPending = booking.is_pending_confirmation;
                  const isWaitingPayment = booking.payment_status === 'pending' && !booking.is_pending_confirmation;
                  
                  return (
                    <Card key={booking.id} className="border-2 border-yellow-400">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">{booking.guest_name}</h3>
                              {isPending && (
                                <Badge className="bg-yellow-500 hover:bg-yellow-600">
                                  Новая заявка
                                </Badge>
                              )}
                              {isWaitingPayment && (
                                <Badge className="bg-orange-500 hover:bg-orange-600">
                                  Ждет оплаты
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                              <div className="flex items-center gap-1">
                                <Icon name="Home" size={14} />
                                {unit?.name}
                              </div>
                              <div className="flex items-center gap-1">
                                <Icon name="Phone" size={14} />
                                {booking.guest_phone}
                              </div>
                              <div className="flex items-center gap-1">
                                <Icon name="Calendar" size={14} />
                                {new Date(booking.check_in).toLocaleDateString('ru-RU')} - {new Date(booking.check_out).toLocaleDateString('ru-RU')}
                              </div>
                              <div className="flex items-center gap-1">
                                <Icon name="DollarSign" size={14} />
                                {booking.total_price}₽
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  scrollToBooking(booking.check_in);
                                  setShowPendingRequests(false);
                                }}
                              >
                                <Icon name="MapPin" size={14} className="mr-1" />
                                Показать в календаре
                              </Button>
                              {isPending && (
                                <Button
                                  size="sm"
                                  onClick={() => updateBookingStatus(booking.id, 'pending')}
                                  className="bg-blue-500 hover:bg-blue-600"
                                >
                                  <Icon name="Check" size={14} className="mr-1" />
                                  Подтвердить бронь
                                </Button>
                              )}
                              {isWaitingPayment && (
                                <Button
                                  size="sm"
                                  onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                  className="bg-green-500 hover:bg-green-600"
                                >
                                  <Icon name="DollarSign" size={14} className="mr-1" />
                                  Оплачено
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SubscriptionGuard>
  );
}