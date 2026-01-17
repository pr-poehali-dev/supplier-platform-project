import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { Booking } from '@/components/booking/CalendarView';
import type { Unit } from '@/components/booking/UnitsManagement';

interface PendingRequestsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookings: Booking[];
  units: Unit[];
  onScrollToBooking: (bookingDate: string) => void;
  onUpdateBookingStatus: (bookingId: number, status: string) => void;
}

export default function PendingRequestsDialog({
  open,
  onOpenChange,
  bookings,
  units,
  onScrollToBooking,
  onUpdateBookingStatus
}: PendingRequestsDialogProps) {
  const pendingBookings = bookings.filter(b => b.is_pending_confirmation || b.payment_status === 'pending');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="AlertCircle" size={24} className="text-yellow-500" />
            Заявки на бронирование
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {pendingBookings.map((booking) => {
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
                            onScrollToBooking(booking.check_in);
                            onOpenChange(false);
                          }}
                        >
                          <Icon name="MapPin" size={14} className="mr-1" />
                          Показать в календаре
                        </Button>
                        {isPending && (
                          <Button
                            size="sm"
                            onClick={() => onUpdateBookingStatus(booking.id, 'pending')}
                            className="bg-blue-500 hover:bg-blue-600"
                          >
                            <Icon name="Check" size={14} className="mr-1" />
                            Подтвердить бронь
                          </Button>
                        )}
                        {isWaitingPayment && (
                          <Button
                            size="sm"
                            onClick={() => onUpdateBookingStatus(booking.id, 'confirmed')}
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
  );
}
