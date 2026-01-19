import { Booking } from './CalendarView';

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

interface CalendarGridProps {
  currentDate: Date;
  bookings: Booking[];
  pendingBookings?: PendingBooking[];
  selectedUnitId: number;
  selectedUnitName: string;
  dynamicPrices: Record<string, { price: number; appliedRules: any[] }>;
  showPrices: boolean;
  loadingPrices: boolean;
  onBookingClick: (booking: Booking) => void;
}

export default function CalendarGrid({
  currentDate,
  bookings,
  pendingBookings = [],
  selectedUnitId,
  selectedUnitName,
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

  const getPendingForDate = (day: number) => {
    const { year, month } = getDaysInMonth(currentDate);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return pendingBookings.find(pending => {
      if (pending.unit_name !== selectedUnitName) return false;
      return dateStr >= pending.check_in && dateStr < pending.check_out;
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
      days.push(<div key={`empty-${i}`} className="h-20 border border-gray-100 bg-gray-50/50"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const booking = getBookingForDate(day);
      const pendingBooking = getPendingForDate(day);
      const isBooked = booking !== null;
      const isPending = pendingBooking !== null;
      const isToday = new Date().getDate() === day && 
                      new Date().getMonth() === currentDate.getMonth() &&
                      new Date().getFullYear() === currentDate.getFullYear();
      
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const priceData = dynamicPrices[dateStr];
      const showPrice = showPrices && !isBooked && !isPending;
      const showPriceLoading = showPrices && loadingPrices && !isBooked && !isPending;
      const priceColor = getPriceColor(priceData);

      const getCellColor = () => {
        if (isPending) return 'bg-gradient-to-br from-yellow-100 to-amber-100 cursor-pointer hover:from-yellow-200 hover:to-amber-200 shadow-lg animate-pulse border-2 border-yellow-300';
        if (!isBooked) return 'bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 cursor-default';
        if (booking?.is_pending_confirmation) return 'bg-gradient-to-br from-yellow-100 to-amber-100 cursor-pointer hover:from-yellow-200 hover:to-amber-200 shadow-lg animate-pulse';
        if (booking?.payment_status === 'pending' && !booking?.is_pending_confirmation) return 'bg-gradient-to-br from-orange-100 to-red-100 cursor-pointer hover:from-orange-200 hover:to-red-200 shadow-md';
        return 'bg-gradient-to-br from-red-100 to-pink-100 cursor-pointer hover:from-red-200 hover:to-pink-200 shadow-md';
      };

      days.push(
        <div
          key={day}
          onClick={() => {
            if (booking) onBookingClick(booking);
          }}
          className={`h-20 border border-gray-200 p-2.5 transition-all duration-200 relative group rounded-lg ${getCellColor()} ${isToday ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
        >
          <div className={`text-sm font-bold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>{day}</div>
          {isPending && (
            <div className="text-xs font-bold text-yellow-700 mt-0.5 truncate">
              📋 {pendingBooking.guest_name}
            </div>
          )}
          {showPrice && loadingPrices && (
            <div className="text-xs mt-1 px-2 py-1 rounded-md bg-gray-200 animate-pulse inline-block">
              <div className="h-3 w-14 bg-gray-300 rounded"></div>
            </div>
          )}
          {showPrice && !loadingPrices && (
            <div className={`text-xs font-bold mt-1 px-2 py-1 rounded-md inline-block shadow-sm ${
              priceData ? (
                priceColor === 'green' ? 'text-green-700 bg-gradient-to-r from-green-100 to-emerald-100' :
                priceColor === 'red' ? 'text-red-700 bg-gradient-to-r from-red-100 to-orange-100' :
                priceColor === 'purple' ? 'text-purple-700 bg-gradient-to-r from-purple-100 to-pink-100' :
                'text-emerald-700 bg-gradient-to-r from-emerald-100 to-teal-100'
              ) : 'text-gray-500 bg-gray-100'
            }`}>
              {priceData ? `${Math.round(priceData.price)} ₽` : '—'}
            </div>
          )}
          {isBooked && booking && (
            <div className="text-xs mt-1.5 font-medium text-gray-700 truncate">{booking.guest_name}</div>
          )}
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="grid grid-cols-7 gap-2">
      {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map((day, idx) => (
        <div key={day} className={`text-center font-bold py-3 bg-gradient-to-br rounded-lg shadow-sm ${
          idx === 0 || idx === 6 
            ? 'from-purple-100 to-pink-100 text-purple-700' 
            : 'from-blue-50 to-cyan-50 text-blue-700'
        }`}>
          {day}
        </div>
      ))}
      {renderCalendar()}
    </div>
  );
}