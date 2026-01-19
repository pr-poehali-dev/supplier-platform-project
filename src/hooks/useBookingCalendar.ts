import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { fetchWithAuth, getUser } from '@/lib/api';
import { canAddUnit, getSubscriptionLimits } from '@/utils/subscription';
import type { Unit } from '@/components/booking/UnitsManagement';
import type { Booking } from '@/components/booking/CalendarView';

const API_URL = 'https://functions.poehali.dev/9f1887ba-ac1c-402a-be0d-4ae5c1a9175d';
const CUSTOMER_SYNC_URL = 'https://functions.poehali.dev/4ead0222-a7b6-4305-b43d-20c7df4920ce';

interface PendingBooking {
  id: number;
  unit_name: string;
  check_in: string;
  check_out: string;
  guest_name: string;
  guest_contact: string;
  amount: number;
  verification_status: string;
}

export function useBookingCalendar() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [units, setUnits] = useState<Unit[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const user = getUser();
  const [botLink, setBotLink] = useState('');
  const [showPendingRequests, setShowPendingRequests] = useState(false);
  const [notificationAudio] = useState(() => {
    const audio = new Audio('https://cdn.poehali.dev/projects/e94f48a9-086e-4e6f-8437-08793577e935/bucket/sound-effect-676.mp3');
    audio.volume = 0.7;
    return audio;
  });

  useEffect(() => {
    const isEditorMode = window.location.hostname.includes('poehali.dev') || window.location.hostname === 'localhost';
    
    if (!user && !isEditorMode) {
      toast({
        title: 'Требуется авторизация',
        description: 'Войдите в систему для доступа к календарю',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }
    
    if (user) {
      setBotLink(`https://t.me/YOUR_BOT_USERNAME?start=${user.id}`);
    }
    
    loadUnits();
    loadBookings();
    loadPendingBookings();

    const interval = setInterval(() => {
      loadBookings();
      loadPendingBookings();
    }, 30000);

    return () => clearInterval(interval);
  }, [navigate, toast]);

  const loadUnits = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}?action=units`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
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
      const newBookings = data.bookings || [];
      
      if (bookings.length > 0 && newBookings.length > bookings.length) {
        const hasPendingBooking = newBookings.some(
          (b: Booking) => b.is_pending_confirmation && 
            !bookings.find(old => old.id === b.id)
        );
        
        if (hasPendingBooking) {
          notificationAudio.play().catch(() => {});
          toast({
            title: 'Новая заявка!',
            description: 'Поступила новая заявка на бронирование',
            duration: 5000,
          });
        }
      }
      
      setBookings(newBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast({
        title: 'Ошибка загрузки броней',
        description: error instanceof Error ? error.message : 'Проверьте авторизацию',
        variant: 'destructive',
      });
    }
  };

  const loadPendingBookings = async () => {
    try {
      console.log('🔍 Loading pending bookings...');
      const response = await fetchWithAuth(`${API_URL}?action=get_pending_bookings`);
      console.log('🔍 Response status:', response.status);
      const data = await response.json();
      console.log('🔍 Pending bookings data:', data);
      const newPending = data.bookings || [];
      console.log('🔍 New pending count:', newPending.length);
      
      // Проверяем новые заявки
      if (pendingBookings.length > 0 && newPending.length > pendingBookings.length) {
        notificationAudio.play().catch(() => {});
        toast({
          title: 'Новая заявка!',
          description: 'Поступила заявка на бронирование через бота',
          duration: 5000,
        });
      }
      
      setPendingBookings(newPending);
    } catch (error) {
      console.error('Error loading pending bookings:', error);
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

  return {
    units,
    bookings,
    pendingBookings,
    currentDate,
    selectedUnit,
    user,
    botLink,
    showPendingRequests,
    setSelectedUnit,
    setShowPendingRequests,
    loadUnits,
    loadBookings,
    addUnit,
    updateUnit,
    deleteUnit,
    createBooking,
    updateBookingStatus,
    scrollToBooking,
    deleteBooking,
    changeMonth,
  };
}