import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';

const AI_URL = 'https://functions.poehali.dev/f62c6672-5e97-4934-af5c-2f4fa9dca61a';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [greeting, setGreeting] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadSettings();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadSettings = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user?.id) return;

      // Загружаем настройки и историю чата параллельно
      const [settingsRes, chatRes] = await Promise.all([
        fetch(`${AI_URL}?action=settings`, {
          headers: { 'X-User-Id': user.id.toString() }
        }),
        fetch(`${AI_URL}?action=chat`, {
          headers: { 'X-User-Id': user.id.toString() }
        })
      ]);
      
      const settingsData = await settingsRes.json();
      const chatData = await chatRes.json();
      
      // Если есть история - показываем её
      if (chatData.messages && chatData.messages.length > 0) {
        setMessages(chatData.messages);
      } else {
        // Иначе показываем приветствие
        const greetingText = settingsData.settings?.greeting_message || 
          'Привет! Я ваш AI-помощник. Могу проанализировать загрузку, дать советы по ценам или помочь с настройкой бизнеса. Чем могу помочь?';
        
        setGreeting(greetingText);
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

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const messageText = input;
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
      
      if (!user?.id) {
        throw new Error('User not logged in');
      }

      const response = await fetch(`${AI_URL}?action=chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
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
    } catch (error) {
      console.error('Error sending message:', error);
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

  return (
    <>
      {/* Кнопка открытия чата */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          size="icon"
        >
          <Icon name="Bot" size={24} />
        </Button>
      )}

      {/* Окно чата */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col border-2 border-blue-500">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon name="Bot" size={20} />
                AI-Ассистент
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMessages([]);
                    setConversationId(null);
                    loadSettings();
                  }}
                  className="h-8 w-8 p-0 hover:bg-white/20 text-white"
                >
                  <Icon name="RefreshCw" size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0 hover:bg-white/20 text-white"
                >
                  <Icon name="X" size={16} />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
            {/* Сообщения */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-2 ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-3 border border-gray-200">
                      <Icon name="Loader2" size={16} className="animate-spin text-gray-600" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Подсказки */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInput('Какая загрузка на ближайший месяц?');
                    }}
                    className="text-xs"
                  >
                    📊 Загрузка
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInput('Дай совет как увеличить выручку');
                    }}
                    className="text-xs"
                  >
                    💡 Советы
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInput('Какие праздники скоро?');
                    }}
                    className="text-xs"
                  >
                    🎉 Праздники
                  </Button>
                </div>
              </div>
            )}

            {/* Поле ввода */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Напишите сообщение..."
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  size="icon"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Icon name="Send" size={16} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}