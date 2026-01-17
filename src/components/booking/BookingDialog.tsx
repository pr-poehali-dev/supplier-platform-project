import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Booking } from './CalendarView';

interface TelegramMessage {
  id: number;
  telegram_id: number;
  message_text: string;
  sender: 'user' | 'bot';
  created_at: string;
}

interface BookingDialogProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: TelegramMessage[];
  loadingMessages: boolean;
  onDelete?: (bookingId: number, e: React.MouseEvent) => void;
}

export default function BookingDialog({
  booking,
  open,
  onOpenChange,
  messages,
  loadingMessages,
  onDelete
}: BookingDialogProps) {
  if (!booking) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Бронирование #{booking.id}
            {booking.is_pending_confirmation && (
              <Badge className="bg-yellow-500">Ожидает подтверждения</Badge>
            )}
            {booking.payment_status === 'pending' && !booking.is_pending_confirmation && (
              <Badge className="bg-orange-500">Ожидает оплаты</Badge>
            )}
            {booking.payment_status === 'paid' && (
              <Badge className="bg-green-500">Оплачено</Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Гость</p>
              <p className="font-semibold">{booking.guest_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Телефон</p>
              <p className="font-semibold">{booking.guest_phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Заезд</p>
              <p className="font-semibold">{formatDate(booking.check_in)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Выезд</p>
              <p className="font-semibold">{formatDate(booking.check_out)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Номер</p>
              <p className="font-semibold">{booking.unit_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Сумма</p>
              <p className="font-semibold">{booking.total_price.toLocaleString('ru-RU')} ₽</p>
            </div>
            {booking.source && (
              <div>
                <p className="text-sm text-gray-500">Источник</p>
                <p className="font-semibold">{booking.source}</p>
              </div>
            )}
          </div>

          {messages.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Icon name="MessageSquare" size={18} />
                Переписка с гостем
              </h4>
              <ScrollArea className="h-64 border rounded-lg p-3 bg-gray-50">
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          msg.sender === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.message_text}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender === 'user' ? 'text-blue-100' : 'text-gray-400'
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {loadingMessages && (
            <div className="flex items-center justify-center py-8">
              <Icon name="Loader2" className="animate-spin" size={24} />
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
          {onDelete && (
            <Button
              variant="destructive"
              onClick={(e) => {
                onDelete(booking.id, e);
                onOpenChange(false);
              }}
            >
              <Icon name="Trash2" size={16} className="mr-2" />
              Удалить
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
