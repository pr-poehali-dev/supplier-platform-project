import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { fetchWithAuth } from '@/lib/api';

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

export const PendingBookingsManager = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<PendingBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingBookings();
  }, []);

  const loadPendingBookings = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('https://functions.poehali.dev/9f1887ba-ac1c-402a-be0d-4ae5c1a9175d?action=get_pending_bookings');
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить ожидающие брони',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const approveBooking = async (bookingId: number) => {
    try {
      const response = await fetchWithAuth('https://functions.poehali.dev/9f1887ba-ac1c-402a-be0d-4ae5c1a9175d', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'approve_booking',
          booking_id: bookingId
        })
      });

      if (response.ok) {
        toast({
          title: 'Бронь подтверждена!',
          description: 'Бронирование добавлено в календарь'
        });
        loadPendingBookings();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подтвердить бронирование',
        variant: 'destructive'
      });
    }
  };

  const rejectBooking = async (bookingId: number) => {
    try {
      const response = await fetchWithAuth('https://functions.poehali.dev/9f1887ba-ac1c-402a-be0d-4ae5c1a9175d', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'reject_booking',
          booking_id: bookingId
        })
      });

      if (response.ok) {
        toast({
          title: 'Бронь отклонена',
          description: 'Бронирование отклонено'
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

  if (loading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Clock" size={24} />
          Ожидают оплаты ({bookings.length})
        </CardTitle>
        <CardDescription>
          Брони, которые ждут подтверждения оплаты
        </CardDescription>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Нет ожидающих броней</p>
        ) : (
          <div className="space-y-4">
            {bookings.map(booking => (
              <div key={booking.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{booking.unit_name}</h3>
                    <p className="text-sm text-gray-600">
                      {booking.check_in} — {booking.check_out}
                    </p>
                  </div>
                  <Badge variant={booking.verification_status === 'verified' ? 'default' : booking.verification_status === 'rejected' ? 'destructive' : 'secondary'}>
                    {booking.verification_status === 'pending' && '⏳ Ожидает'}
                    {booking.verification_status === 'verified' && '✅ AI проверено'}
                    {booking.verification_status === 'rejected' && '❌ Отклонено'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Гость:</span>
                    <p className="font-medium">{booking.guest_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Контакт:</span>
                    <p className="font-medium">{booking.guest_contact}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Сумма:</span>
                    <p className="font-medium">{booking.amount} ₽</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Создано:</span>
                    <p className="font-medium">{new Date(booking.created_at).toLocaleString('ru')}</p>
                  </div>
                </div>

                {booking.payment_screenshot_url && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Скриншот оплаты:</p>
                    <a 
                      href={booking.payment_screenshot_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <img 
                        src={booking.payment_screenshot_url} 
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
                    onClick={() => approveBooking(booking.id)}
                    disabled={booking.verification_status === 'verified'}
                    className="flex-1"
                  >
                    <Icon name="Check" size={16} className="mr-2" />
                    Подтвердить
                  </Button>
                  <Button
                    onClick={() => rejectBooking(booking.id)}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Icon name="X" size={16} className="mr-2" />
                    Отклонить
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingBookingsManager;