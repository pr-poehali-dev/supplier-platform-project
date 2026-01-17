import { Booking } from './CalendarView';

interface CalendarGridProps {
  currentDate: Date;
  bookings: Booking[];
  selectedUnitId: number;
  dynamicPrices: Record<string, { price: number; appliedRules: any[] }>;
  showPrices: boolean;
  loadingPrices: boolean;
  onBookingClick: (booking: Booking) => void;
}

export default function CalendarGrid({
  currentDate,
  bookings,
  selectedUnitId,
  dynamicPrices,
  showPrices,
  loadingPrices,
  onBookingClick
}: CalendarGridProps) {
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
    const { year, month } = getDaysInMonth(currentDate);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return bookings.find(booking => {
      if (booking.unit_id !== selectedUnitId) return false;
      return dateStr >= booking.check_in && dateStr < booking.check_out;
    }) || null;
  };

  const getPriceColor = (priceData: any) => {
    if (!priceData?.appliedRules || priceData.appliedRules.length === 0) return 'emerald';
    const ruleNames = priceData.appliedRules.map((r: any) => r.rule_name?.toLowerCase() || '');
    if (ruleNames.some((n: string) => n.includes('высокая загрузка') || n.includes('occupancy'))) return 'green';
    if (ruleNames.some((n: string) => n.includes('срочн') || n.includes('days_before'))) return 'red';
    if (ruleNames.some((n: string) => n.includes('выходн') || n.includes('weekend'))) return 'purple';
    return 'emerald';
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
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
      
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const priceData = dynamicPrices[dateStr];
      const showPrice = showPrices && !isBooked;
      const showPriceLoading = showPrices && loadingPrices && !isBooked && !priceData;
      const priceColor = getPriceColor(priceData);

      const getCellColor = () => {
        if (!isBooked) return 'bg-white hover:bg-blue-50 cursor-pointer';
        if (booking?.is_pending_confirmation) return 'bg-yellow-100 cursor-pointer hover:bg-yellow-200 animate-pulse';
        if (booking?.payment_status === 'pending' && !booking?.is_pending_confirmation) return 'bg-orange-100 cursor-pointer hover:bg-orange-200';
        return 'bg-red-100 cursor-pointer hover:bg-red-200';
      };

      days.push(
        <div
          key={day}
          onClick={() => booking && onBookingClick(booking)}
          className={`h-16 border border-gray-200 p-2 transition-colors relative group ${getCellColor()} ${isToday ? 'ring-2 ring-blue-500' : ''}`}
        >
          <div className="text-sm font-semibold">{day}</div>
          {showPriceLoading && (
            <div className="text-xs mt-0.5 px-1.5 py-0.5 rounded bg-gray-200 animate-pulse">
              <div className="h-3 w-12 bg-gray-300 rounded"></div>
            </div>
          )}
          {showPrice && !loadingPrices && (
            <div className={`text-xs font-bold mt-0.5 px-1.5 py-0.5 rounded ${
              priceData ? (
                priceColor === 'green' ? 'text-green-700 bg-green-100' :
                priceColor === 'red' ? 'text-red-700 bg-red-100' :
                priceColor === 'purple' ? 'text-purple-700 bg-purple-100' :
                'text-emerald-700 bg-emerald-100'
              ) : 'text-gray-500 bg-gray-100'
            }`}>
              {priceData ? `${Math.round(priceData.price)} ₽` : 'N/A'}
            </div>
          )}
          {isBooked && booking && (
            <div className="text-xs mt-1 truncate">{booking.guest_name}</div>
          )}
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="grid grid-cols-7 gap-0">
      {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map(day => (
        <div key={day} className="text-center font-semibold py-2 bg-gray-50 border border-gray-200">
          {day}
        </div>
      ))}
      {renderCalendar()}
    </div>
  );
}
