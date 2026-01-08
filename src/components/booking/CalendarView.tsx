import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Unit } from './UnitsManagement';

export interface Booking {
  id: number;
  unit_id: number;
  unit_name: string;
  check_in: string;
  check_out: string;
  guest_name: string;
  guest_phone: string;
  total_price: number;
  status: string;
}

interface CalendarViewProps {
  selectedUnit: Unit | null;
  currentDate: Date;
  bookings: Booking[];
  onChangeMonth: (delta: number) => void;
  onDeleteBooking?: (bookingId: number) => Promise<void>;
  renderBookingButton?: React.ReactNode;
}

export default function CalendarView({
  selectedUnit,
  currentDate,
  bookings,
  onChangeMonth,
  onDeleteBooking,
  renderBookingButton
}: CalendarViewProps) {
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getBookingForDate = (day: number) => {
    if (!selectedUnit) return null;
    
    const { year, month } = getDaysInMonth(currentDate);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    return bookings.find(booking => {
      if (booking.unit_id !== selectedUnit.id) return false;
      return dateStr >= booking.check_in && dateStr < booking.check_out;
    }) || null;
  };

  const isDateBooked = (day: number) => {
    return getBookingForDate(day) !== null;
  };

  const handleDeleteBooking = async (bookingId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDeleteBooking) return;
    if (!confirm('Удалить это бронирование?')) return;
    await onDeleteBooking(bookingId);
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-16 border border-gray-100"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const booking = getBookingForDate(day);
      const isBooked = booking !== null;
      const isToday = new Date().getDate() === day && 
                      new Date().getMonth() === currentDate.getMonth() &&
                      new Date().getFullYear() === currentDate.getFullYear();
      
      days.push(
        <div
          key={day}
          className={`h-16 border border-gray-200 p-2 transition-colors relative group ${
            isBooked 
              ? 'bg-red-100 cursor-pointer hover:bg-red-200' 
              : 'bg-white hover:bg-blue-50 cursor-pointer'
          } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
        >
          <div className="text-sm font-semibold">{day}</div>
          {isBooked && booking && (
            <>
              <Badge variant="destructive" className="text-xs mt-1">
                Занято
              </Badge>
              {onDeleteBooking && (
                <button
                  onClick={(e) => handleDeleteBooking(booking.id, e)}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                  title="Удалить бронирование"
                >
                  <Icon name="X" size={12} />
                </button>
              )}
            </>
          )}
        </div>
      );
    }
    
    return days;
  };

  if (!selectedUnit) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{selectedUnit.name}</CardTitle>
            <CardDescription>Календарь занятости</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            {renderBookingButton}
            <Button variant="outline" size="sm" onClick={() => onChangeMonth(-1)}>
              <Icon name="ChevronLeft" size={20} />
            </Button>
            <span className="font-semibold text-lg min-w-[200px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <Button variant="outline" size="sm" onClick={() => onChangeMonth(1)}>
              <Icon name="ChevronRight" size={20} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map((day) => (
            <div key={day} className="text-center font-semibold text-sm text-gray-600 p-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {renderCalendar()}
        </div>
        
        <div className="flex gap-4 mt-6 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border-2 border-gray-200 rounded"></div>
            <span className="text-sm">Свободно</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-200 rounded"></div>
            <span className="text-sm">Занято</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border-2 border-blue-500 rounded"></div>
            <span className="text-sm">Сегодня</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}