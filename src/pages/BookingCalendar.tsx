import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import UnitsManagement, { Unit } from '@/components/booking/UnitsManagement';
import CalendarView, { Booking } from '@/components/booking/CalendarView';
import BookingDialog from '@/components/booking/BookingDialog';
import TelegramBotCard from '@/components/booking/TelegramBotCard';

const API_URL = 'https://functions.poehali.dev/9f1887ba-ac1c-402a-be0d-4ae5c1a9175d';

export default function BookingCalendar() {
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
      setUnits(data.units || []);
      if (data.units?.length > 0 && !selectedUnit) {
        setSelectedUnit(data.units[0]);
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

  const deleteUnit = async (unitId: number) => {
    if (!confirm('Удалить этот объект? Все бронирования также будут удалены.')) return;
    
    try {
      const response = await fetch(`${API_URL}?action=delete-unit&unit_id=${unitId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        if (selectedUnit?.id === unitId) {
          setSelectedUnit(null);
        }
        await loadUnits();
        await loadBookings();
      }
    } catch (error) {
      console.error('Error deleting unit:', error);
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

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
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
          onDeleteUnit={deleteUnit}
        />

        <CalendarView
          selectedUnit={selectedUnit}
          currentDate={currentDate}
          bookings={bookings}
          onChangeMonth={changeMonth}
          renderBookingButton={
            <BookingDialog
              selectedUnit={selectedUnit}
              onCreateBooking={createBooking}
            />
          }
        />

        <TelegramBotCard botLink={botLink} />
      </div>
    </div>
  );
}
