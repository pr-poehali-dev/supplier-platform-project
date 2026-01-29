import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface ChatMessage {
  id: number;
  sender: string;
  message: string;
  timestamp: string;
}

interface ChatViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: ChatMessage[];
  guestName: string;
  loading: boolean;
}

export default function ChatViewerDialog({
  open,
  onOpenChange,
  messages,
  guestName,
  loading
}: ChatViewerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="MessageSquare" size={20} />
            Чат с {guestName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Icon name="Loader2" className="animate-spin" size={32} />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Icon name="MessageSquareOff" size={48} />
              <p className="mt-4">История переписки отсутствует</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] border rounded-lg p-4 bg-gray-50">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg px-4 py-3 ${
                        msg.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white border border-gray-200 shadow-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.message}
                      </p>
                      <p className={`text-xs mt-2 ${
                        msg.sender === 'user' ? 'text-blue-100' : 'text-gray-400'
                      }`}>
                        {new Date(msg.timestamp).toLocaleString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
