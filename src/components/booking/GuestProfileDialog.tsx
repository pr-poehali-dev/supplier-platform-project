import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';

interface GuestAnalysis {
  character: string;
  purpose: string;
  special_requests: string[];
  important_notes: string[];
  mood: 'позитивный' | 'нейтральный' | 'негативный';
  summary: string;
}

interface ChatMessage {
  id?: number;
  sender: string;
  message: string;
  timestamp: string;
}

interface GuestProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guestName: string;
  analysis: GuestAnalysis | null;
  loading: boolean;
  messagesCount: number;
  messages: ChatMessage[];
}

export default function GuestProfileDialog({
  open,
  onOpenChange,
  guestName,
  analysis,
  loading,
  messagesCount,
  messages
}: GuestProfileDialogProps) {
  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'позитивный':
        return 'bg-green-500';
      case 'негативный':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'позитивный':
        return 'SmilePlus';
      case 'негативный':
        return 'Frown';
      default:
        return 'Minus';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="UserSearch" size={20} />
            О госте: {guestName}
          </DialogTitle>
          <DialogDescription>
            Анализ характера гостя на основе переписки в Telegram
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Icon name="Loader2" className="animate-spin" size={32} />
              <p className="mt-4 text-gray-500">Анализирую переписку...</p>
            </div>
          ) : !analysis ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Icon name="UserX" size={48} />
              <p className="mt-4">Не удалось провести анализ</p>
            </div>
          ) : (
            <>
              {/* Messages count */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <Icon name="MessageCircle" size={16} className="inline mr-2" />
                  Проанализировано сообщений: <strong>{messagesCount}</strong>
                </p>
              </div>

              {/* Mood Badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Настроение:</span>
                <Badge className={getMoodColor(analysis.mood)}>
                  <Icon name={getMoodIcon(analysis.mood)} size={14} className="mr-1" />
                  {analysis.mood.charAt(0).toUpperCase() + analysis.mood.slice(1)}
                </Badge>
              </div>

              {/* Character */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Icon name="User" size={16} />
                  Характер
                </h4>
                <p className="text-sm bg-gray-50 border rounded-lg p-3">
                  {analysis.character}
                </p>
              </div>

              {/* Purpose */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Icon name="Target" size={16} />
                  Цель визита
                </h4>
                <p className="text-sm bg-gray-50 border rounded-lg p-3">
                  {analysis.purpose}
                </p>
              </div>

              {/* Special Requests */}
              {analysis.special_requests.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Icon name="Star" size={16} />
                    Особые пожелания
                  </h4>
                  <ul className="space-y-2">
                    {analysis.special_requests.map((request, index) => (
                      <li key={index} className="text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                        <Icon name="CheckCircle2" size={16} className="mt-0.5 text-amber-600 flex-shrink-0" />
                        <span>{request}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Important Notes */}
              {analysis.important_notes.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Icon name="AlertCircle" size={16} />
                    Важные заметки
                  </h4>
                  <ul className="space-y-2">
                    {analysis.important_notes.map((note, index) => (
                      <li key={index} className="text-sm bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                        <Icon name="AlertTriangle" size={16} className="mt-0.5 text-red-600 flex-shrink-0" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-900">
                  <Icon name="FileText" size={16} />
                  Общая характеристика
                </h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                  {analysis.summary}
                </p>
              </div>

              {/* Chat History */}
              {messages && messages.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Icon name="MessageSquare" size={16} />
                    История переписки
                  </h4>
                  <ScrollArea className="h-64 border rounded-lg p-3 bg-gray-50">
                    <div className="space-y-3">
                      {messages.map((msg, index) => (
                        <div
                          key={msg.id || index}
                          className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              msg.sender === 'user'
                                ? 'bg-blue-500 text-white'
                                : 'bg-white border border-gray-200'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                            <p className={`text-xs mt-1 ${
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
                </div>
              )}
            </>
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