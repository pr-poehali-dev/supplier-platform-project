import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Booking } from './CalendarView';
import ChatViewerDialog from './ChatViewerDialog';
import GuestProfileDialog from './GuestProfileDialog';
import { fetchWithAuth } from '@/lib/api';

interface TelegramMessage {
  id: number;
  telegram_id: number;
  message_text: string;
  sender: 'user' | 'bot';
  created_at: string;
}

interface ChatMessage {
  id: number;
  sender: string;
  message: string;
  timestamp: string;
}

interface GuestAnalysis {
  character: string;
  purpose: string;
  special_requests: string[];
  important_notes: string[];
  mood: 'позитивный' | 'нейтральный' | 'негативный';
  summary: string;
}

interface BookingDialogProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: TelegramMessage[];
  loadingMessages: boolean;
  onDelete?: (bookingId: number, e: React.MouseEvent) => void;
}

const CHAT_HISTORY_URL = 'https://functions.poehali.dev/3fedee59-5e31-40c7-9469-3f308215b57e';
const AI_ASSISTANT_URL = 'https://functions.poehali.dev/f62c6672-5e97-4934-af5c-2f4fa9dca61a';

export default function BookingDialog({
  booking,
  open,
  onOpenChange,
  messages,
  loadingMessages,
  onDelete
}: BookingDialogProps) {
  const [showChatViewer, setShowChatViewer] = useState(false);
  const [showGuestProfile, setShowGuestProfile] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [guestAnalysis, setGuestAnalysis] = useState<GuestAnalysis | null>(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [messagesCount, setMessagesCount] = useState(0);

  if (!booking) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const loadChatHistory = async () => {
    setLoadingChat(true);
    try {
      const response = await fetchWithAuth(`${CHAT_HISTORY_URL}?booking_id=${booking.id}`);
      if (response.messages) {
        setChatMessages(response.messages);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setLoadingChat(false);
    }
  };

  const loadGuestAnalysis = async () => {
    setLoadingAnalysis(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const ownerId = user.id;
      
      const response = await fetchWithAuth(`${AI_ASSISTANT_URL}?action=analyze_guest`, {
        method: 'POST',
        headers: {
          'X-Owner-Id': String(ownerId)
        },
        body: JSON.stringify({
          booking_id: booking.id
        })
      });
      
      if (response.analysis) {
        setGuestAnalysis(response.analysis);
        setMessagesCount(response.messages_count || 0);
      }
    } catch (error) {
      console.error('Failed to analyze guest:', error);
      setGuestAnalysis({
        character: 'Ошибка анализа',
        purpose: 'Не определена',
        special_requests: [],
        important_notes: [],
        mood: 'нейтральный',
        summary: 'Не удалось провести анализ. Попробуйте позже.'
      });
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleOpenChat = () => {
    setShowChatViewer(true);
    loadChatHistory();
  };

  const handleOpenProfile = () => {
    setShowGuestProfile(true);
    loadGuestAnalysis();
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

        <div className="flex flex-col gap-3 pt-4 border-t">
          {/* New buttons for Chat and Guest Profile */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleOpenChat}
              className="flex-1 bg-blue-50 hover:bg-blue-100 border-blue-200"
            >
              <Icon name="MessageSquare" size={16} className="mr-2" />
              Чат
            </Button>
            <Button
              variant="outline"
              onClick={handleOpenProfile}
              className="flex-1 bg-purple-50 hover:bg-purple-100 border-purple-200"
            >
              <Icon name="UserSearch" size={16} className="mr-2" />
              О госте
            </Button>
          </div>

          {/* Original buttons */}
          <div className="flex justify-between">
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
        </div>
      </DialogContent>

      {/* Chat Viewer Dialog */}
      <ChatViewerDialog
        open={showChatViewer}
        onOpenChange={setShowChatViewer}
        messages={chatMessages}
        guestName={booking.guest_name}
        loading={loadingChat}
      />

      {/* Guest Profile Dialog */}
      <GuestProfileDialog
        open={showGuestProfile}
        onOpenChange={setShowGuestProfile}
        guestName={booking.guest_name}
        analysis={guestAnalysis}
        loading={loadingAnalysis}
        messagesCount={messagesCount}
      />
    </Dialog>
  );
}