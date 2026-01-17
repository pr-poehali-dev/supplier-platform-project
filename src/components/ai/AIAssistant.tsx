import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { fetchWithAuth } from '@/lib/api';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

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
            <ChatMessages messages={messages} loading={loading} />
            <ChatInput
              input={input}
              loading={loading}
              messagesCount={messages.length}
              onInputChange={setInput}
              onSend={sendMessage}
              onKeyPress={handleKeyPress}
            />
          </CardContent>
        </Card>
      )}
    </>
  );
}
