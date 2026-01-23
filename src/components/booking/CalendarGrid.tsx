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
      days.push(<div key={`empty-${i}`} className="h-20 border border-border bg-muted/20 rounded-lg"></div>);
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
        if (isPending) return 'bg-warning/10 border-warning/40 cursor-pointer hover:bg-warning/20 shadow-lg animate-pulse border-2';
        if (!isBooked) return 'bg-card/30 border-border hover:bg-primary/5 hover:border-primary/30 cursor-default';
        if (booking?.is_pending_confirmation) return 'bg-warning/10 border-warning/40 cursor-pointer hover:bg-warning/20 shadow-lg animate-pulse border-2';
        if (booking?.payment_status === 'pending' && !booking?.is_pending_confirmation) return 'bg-warning/20 border-warning/50 cursor-pointer hover:bg-warning/30 shadow-md border-2';
        return 'bg-destructive/10 border-destructive/40 cursor-pointer hover:bg-destructive/20 shadow-md border-2';
      };

      days.push(
        <div
          key={day}
          onClick={() => {
            if (booking) onBookingClick(booking);
          }}
          className={`h-20 border p-2.5 transition-all duration-200 relative group rounded-lg backdrop-blur-sm ${getCellColor()} ${isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
        >
          <div className={`text-sm font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>{day}</div>
          {isPending && (
            <div className="text-xs font-bold text-warning mt-0.5 truncate">
              📋 {pendingBooking.guest_name}
            </div>
          )}
          {showPrice && loadingPrices && (
            <div className="text-xs mt-1 px-2 py-1 rounded-md bg-muted animate-pulse inline-block">
              <div className="h-3 w-14 bg-muted-foreground/30 rounded"></div>
            </div>
          )}
          {showPrice && !loadingPrices && (
            <div className={`text-xs font-bold mt-1 px-2 py-1 rounded-md inline-block shadow-sm ${
              priceData ? (
                priceColor === 'green' ? 'text-success bg-success/20 border border-success/30' :
                priceColor === 'red' ? 'text-destructive bg-destructive/20 border border-destructive/30' :
                priceColor === 'purple' ? 'text-primary bg-primary/20 border border-primary/30' :
                'text-success bg-success/20 border border-success/30'
              ) : 'text-muted-foreground bg-muted/50'
            }`}>
              {priceData ? `${Math.round(priceData.price)} ₽` : '—'}
            </div>
          )}
          {isBooked && booking && (
            <div className="text-xs mt-1.5 font-medium text-foreground truncate">{booking.guest_name}</div>
          )}
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="grid grid-cols-7 gap-2">
      {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map((day, idx) => (
        <div key={day} className={`text-center font-bold py-3 rounded-lg border ${
          idx === 0 || idx === 6 
            ? 'bg-primary/10 border-primary/30 text-primary' 
            : 'bg-muted/50 border-border text-foreground'
        }`}>
          {day}
        </div>
      ))}
      {renderCalendar()}
    </div>
  );
}