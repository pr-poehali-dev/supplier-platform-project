import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { fetchWithAuth } from '@/lib/api';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import QuickQuestions from './QuickQuestions';

const AI_URL = 'https://functions.poehali.dev/f62c6672-5e97-4934-af5c-2f4fa9dca61a';
const BROADCAST_URL = 'https://functions.poehali.dev/6b801cd0-070e-4eb7-bc93-0d6dbdd90fc1';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface BroadcastIntent {
  intent: 'broadcast_message';
  original_request: string;
  suggested_text: string;
  audience: 'all' | 'with_bookings' | 'past_guests';
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [broadcastIntent, setBroadcastIntent] = useState<BroadcastIntent | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user?.id) return;

      const [settingsRes, chatRes] = await Promise.all([
        fetchWithAuth(`${AI_URL}?action=settings`),
        fetchWithAuth(`${AI_URL}?action=chat`)
      ]);
      
      const settingsData = await settingsRes.json();
      const chatData = await chatRes.json();
      
      if (chatData.messages && chatData.messages.length > 0) {
        setMessages(chatData.messages);
      } else {
        const greetingText = settingsData.settings?.greeting_message || 
          'Привет! Я ваш AI-помощник. Могу проанализировать загрузку, дать советы по ценам или помочь с настройкой бизнеса. Чем могу помочь?';
        
        setMessages([{
          role: 'assistant',
          content: greetingText,
          created_at: new Date().toISOString()
        }]);
      }
    } catch (error) {
      // Error loading settings
    }
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || loading) return;
    const userMessage: Message = {
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user?.id) throw new Error('User not logged in');

      const response = await fetchWithAuth(`${AI_URL}?action=chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          conversation_id: conversationId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Если AI распознал intent на рассылку
      if (data.intent) {
        setBroadcastIntent(data.intent);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Извините, произошла ошибка: ${errorMessage}. Попробуйте ещё раз.`,
        created_at: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastIntent) return;
    
    const audienceText = {
      all: 'всем клиентам',
      with_bookings: 'клиентам с активными бронированиями',
      past_guests: 'прошлым гостям'
    }[broadcastIntent.audience];
    
    if (!confirm(`Отправить сообщение ${audienceText}?\n\n"${broadcastIntent.suggested_text}"`)) {
      setBroadcastIntent(null);
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetchWithAuth(BROADCAST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: broadcastIntent.suggested_text,
          audience: broadcastIntent.audience
        })
      });
      
      if (!response.ok) {
        throw new Error('Ошибка отправки');
      }
      
      const result = await response.json();
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `✅ Рассылка завершена!\n\nОтправлено: ${result.sent}\nНе доставлено: ${result.failed}\nВсего клиентов: ${result.total}`,
        created_at: new Date().toISOString()
      }]);
      
      setBroadcastIntent(null);
    } catch (error) {
      alert('Не удалось выполнить рассылку');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          size="icon"
        >
          <Icon name="Bot" size={24} />
        </Button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 flex gap-3 z-50">
          <QuickQuestions onQuestionClick={(q) => sendMessage(q)} />
          
          <Card className="w-[420px] h-[680px] shadow-2xl flex flex-col border border-gray-200/80 bg-white">
          <CardHeader className="pb-3 px-5 pt-4 border-b border-gray-100 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Icon name="Bot" size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">AI Ассистент</h3>
                  <p className="text-xs text-gray-500">Онлайн</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    if (confirm('Очистить историю чата? Это действие необратимо.')) {
                      try {
                        await fetchWithAuth(`${AI_URL}?action=chat`, {
                          method: 'DELETE'
                        });
                        setMessages([]);
                        setConversationId(null);
                        loadSettings();
                      } catch (error) {
                        alert('Не удалось очистить историю');
                      }
                    }
                  }}
                  className="h-8 w-8 p-0 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                  title="Очистить историю чата"
                >
                  <Icon name="Trash2" size={15} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                >
                  <Icon name="X" size={15} />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col overflow-hidden relative">
            <ChatMessages 
              messages={messages} 
              loading={loading}
              scrollContainerRef={scrollContainerRef}
              onScrollChange={setShowScrollButton}
            />
            
            {showScrollButton && (
              <Button
                onClick={() => {
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTo({
                      top: scrollContainerRef.current.scrollHeight,
                      behavior: 'smooth'
                    });
                  }
                }}
                className="absolute bottom-24 right-4 h-10 w-10 rounded-full shadow-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 z-10 transition-all"
                size="icon"
              >
                <Icon name="ArrowDown" size={18} />
              </Button>
            )}
            
            {broadcastIntent && (
              <div className="absolute bottom-24 left-4 right-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-3 shadow-lg z-20">
                <div className="flex items-start gap-2 mb-2">
                  <Icon name="Send" size={16} className="text-indigo-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-indigo-900 mb-1">Готово к рассылке</p>
                    <p className="text-xs text-gray-700 mb-2">{broadcastIntent.suggested_text}</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleBroadcast}
                        size="sm"
                        className="h-7 px-3 text-xs bg-indigo-600 hover:bg-indigo-700"
                      >
                        Отправить
                      </Button>
                      <Button
                        onClick={() => setBroadcastIntent(null)}
                        size="sm"
                        variant="ghost"
                        className="h-7 px-3 text-xs text-gray-600 hover:bg-white"
                      >
                        Отмена
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <ChatInput
              input={input}
              loading={loading}
              onInputChange={setInput}
              onSend={sendMessage}
              onKeyPress={handleKeyPress}
            />
          </CardContent>
        </Card>
        </div>
      )}
    </>
  );
}