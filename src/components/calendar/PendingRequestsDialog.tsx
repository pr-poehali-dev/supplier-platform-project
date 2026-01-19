import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { fetchWithAuth } from '@/lib/api';
import type { Unit } from '@/components/booking/UnitsManagement';

interface PendingBooking {
  id: number;
  unit_name: string;
  check_in: string;
  check_out: string;
  guest_name: string;
  guest_contact: string;
  amount: number;
  payment_screenshot_url: string | null;
  verification_status: string;
  verification_notes: string | null;
  created_at: string;
}

interface PendingRequestsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  units: Unit[];
  onScrollToBooking: (bookingDate: string) => void;
  onUpdateBookingStatus: (bookingId: number, status: string) => void;
}

export default function PendingRequestsDialog({
  open,
  onOpenChange,
  units,
  onScrollToBooking,
  onUpdateBookingStatus
}: PendingRequestsDialogProps) {
  const { toast } = useToast();
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadPendingBookings();
      
      // Автообновление каждые 30 секунд
      const interval = setInterval(() => {
        loadPendingBookings();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [open]);

  const loadPendingBookings = async () => {
    try {
      setLoading(true);
      console.log('🔍 [Dialog] Loading pending bookings...');
      const response = await fetchWithAuth('https://functions.poehali.dev/9f1887ba-ac1c-402a-be0d-4ae5c1a9175d?action=get_pending_bookings');
      console.log('🔍 [Dialog] Response status:', response.status);
      const data = await response.json();
      console.log('🔍 [Dialog] Data:', data);
      setPendingBookings(data.bookings || []);
      console.log('🔍 [Dialog] Set bookings count:', data.bookings?.length || 0);
    } catch (error) {
      console.error('Failed to load pending bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveBooking = async (bookingId: number) => {
    try {
      console.log('🔍 [Dialog] Approving booking:', bookingId);
      const response = await fetchWithAuth('https://functions.poehali.dev/aa2efe43-c732-4850-8c2e-06d0db752fef', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pending_id: bookingId,
          action: 'confirm'
        })
      });

      console.log('🔍 [Dialog] Approve response status:', response.status);
      const data = await response.json();
      console.log('🔍 [Dialog] Approve response data:', data);

      if (response.ok) {
        toast({
          title: 'Бронь подтверждена!',
          description: 'Бронирование добавлено в календарь'
        });
        loadPendingBookings();
        // Обновляем основной календарь
        window.location.reload();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось подтвердить бронирование',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('🔍 [Dialog] Approve error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось подтвердить бронирование',
        variant: 'destructive'
      });
    }
  };

  const rejectBooking = async (bookingId: number) => {
    try {
      const response = await fetchWithAuth('https://functions.poehali.dev/aa2efe43-c732-4850-8c2e-06d0db752fef', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pending_id: bookingId,
          action: 'reject'
        })
      });

      if (response.ok) {
        toast({
          title: 'Бронь отклонена',
          description: 'Клиент уведомлён об отказе'
        });
        loadPendingBookings();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отклонить бронирование',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="AlertCircle" size={24} className="text-yellow-500" />
            Заявки на бронирование ({pendingBookings.length})
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {loading && pendingBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Загрузка...</div>
          ) : pendingBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Нет новых заявок</div>
          ) : (
            pendingBookings.map((booking) => {
              const isVerified = booking.verification_status === 'verified';
              const hasScreenshot = !!booking.payment_screenshot_url;
              
              return (
                <Card key={booking.id} className="border-2 border-yellow-400 animate-pulse">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{booking.guest_name}</h3>
                            <Badge className="bg-yellow-500 hover:bg-yellow-600">
                              {booking.verification_status === 'pending' ? 'Ожидает оплаты' : 
                               booking.verification_status === 'awaiting_verification' ? 'Проверка скриншота' : 
                               'AI проверено'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Icon name="Home" size={14} />
                              {booking.unit_name}
                            </div>
                            <div className="flex items-center gap-1">
                              <Icon name="Phone" size={14} />
                              {booking.guest_contact}
                            </div>
                            <div className="flex items-center gap-1">
                              <Icon name="Calendar" size={14} />
                              {new Date(booking.check_in).toLocaleDateString('ru-RU')} - {new Date(booking.check_out).toLocaleDateString('ru-RU')}
                            </div>
                            <div className="flex items-center gap-1">
                              <Icon name="DollarSign" size={14} />
                              {booking.amount}₽
                            </div>
                          </div>
                        </div>
                      </div>

                      {hasScreenshot && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Скриншот оплаты:</p>
                          <a 
                            href={booking.payment_screenshot_url!} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-block"
                          >
                            <img 
                              src={booking.payment_screenshot_url!} 
                              alt="Скриншот оплаты" 
                              className="max-w-xs rounded border cursor-pointer hover:opacity-80 transition"
                            />
                          </a>
                        </div>
                      )}

                      {booking.verification_notes && (
                        <div className="bg-blue-50 p-3 rounded text-sm">
                          <p className="font-medium text-blue-900 mb-1">AI проверка:</p>
                          <p className="text-blue-700">{booking.verification_notes}</p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => approveBooking(booking.id)}
                          className={isVerified ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-500 hover:bg-blue-600'}
                        >
                          <Icon name="Check" size={14} className="mr-1" />
                          {isVerified ? 'Создать бронь' : 'Подтвердить оплату'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectBooking(booking.id)}
                        >
                          <Icon name="X" size={14} className="mr-1" />
                          Отклонить
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}