import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const API_URL = 'https://functions.poehali.dev/9f1887ba-ac1c-402a-be0d-4ae5c1a9175d';

interface Unit {
  id: number;
  name: string;
  type: string;
  description: string;
  base_price: number;
  max_guests: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function BookingCalendar() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [availability, setAvailability] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // AI Chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      const response = await fetch(`${API_URL}?action=units`);
      const data = await response.json();
      setUnits(data.units || []);
    } catch (error) {
      console.error('Error loading units:', error);
    }
  };

  const checkAvailability = async () => {
    if (!selectedUnit || !checkIn || !checkOut) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}?action=availability&unit_id=${selectedUnit.id}&check_in=${checkIn}&check_out=${checkOut}`
      );
      const data = await response.json();
      setAvailability(data);
    } catch (error) {
      console.error('Error checking availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = { role: 'user', content: inputMessage };
    setMessages([...messages, userMessage]);
    setInputMessage('');
    setChatLoading(true);

    try {
      const response = await fetch(`${API_URL}?action=ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          conversation_id: conversationId
        })
      });

      const data = await response.json();

      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
      }

      const assistantMessage: Message = { role: 'assistant', content: data.message };
      setMessages([...messages, userMessage, assistantMessage]);

      if (data.booking_created) {
        loadUnits();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Произошла ошибка. Попробуйте ещё раз.'
      };
      setMessages([...messages, userMessage, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            <Icon name="Calendar" className="inline-block mr-2" size={36} />
            TourConnect - Система бронирования
          </h1>
          <p className="text-gray-600">
            Календарь с AI-менеджером для турбаз и гостевых домов
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Левая колонка - Календарь и проверка доступности */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Доступные объекты</CardTitle>
                <CardDescription>Выберите домик или баню для бронирования</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {units.map((unit) => (
                  <div
                    key={unit.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedUnit?.id === unit.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedUnit(unit)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{unit.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{unit.description}</p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1">
                            <Icon name="Users" size={16} />
                            До {unit.max_guests} гостей
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon name="Home" size={16} />
                            {unit.type === 'house' ? 'Домик' : 'Баня'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          {unit.base_price.toLocaleString()} ₽
                        </p>
                        <p className="text-xs text-gray-500">за ночь</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Проверка доступности</CardTitle>
                <CardDescription>Выберите даты для бронирования</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="checkIn">Заезд</Label>
                    <Input
                      id="checkIn"
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkOut">Выезд</Label>
                    <Input
                      id="checkOut"
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      min={checkIn || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <Button
                  onClick={checkAvailability}
                  disabled={!selectedUnit || !checkIn || !checkOut || loading}
                  className="w-full"
                >
                  {loading ? 'Проверка...' : 'Проверить доступность'}
                </Button>

                {availability && (
                  <div
                    className={`p-4 rounded-lg ${
                      availability.available
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    {availability.available ? (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon name="CheckCircle" className="text-green-600" size={24} />
                          <h4 className="font-semibold text-green-900">Доступно для бронирования</h4>
                        </div>
                        <p className="text-green-800">
                          <strong>{availability.nights}</strong> ночей
                        </p>
                        <p className="text-2xl font-bold text-green-900 mt-2">
                          {availability.total_price.toLocaleString()} ₽
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Icon name="XCircle" className="text-red-600" size={24} />
                        <h4 className="font-semibold text-red-900">Даты заняты</h4>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Правая колонка - AI Чат */}
          <Card className="flex flex-col h-[700px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Bot" size={24} />
                AI-Менеджер бронирования
              </CardTitle>
              <CardDescription>
                Задайте вопросы или забронируйте объект через чат
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto mb-4 space-y-4 border rounded-lg p-4 bg-gray-50">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 py-12">
                    <Icon name="MessageCircle" size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Начните диалог с AI-менеджером</p>
                    <p className="text-sm mt-2">Например: "Хочу забронировать домик на выходные"</p>
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 p-3 rounded-lg">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Напишите сообщение..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !chatLoading && sendMessage()}
                  disabled={chatLoading}
                />
                <Button onClick={sendMessage} disabled={chatLoading || !inputMessage.trim()}>
                  <Icon name="Send" size={20} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
