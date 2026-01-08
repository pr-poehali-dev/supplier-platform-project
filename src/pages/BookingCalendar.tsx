import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const API_URL = 'https://functions.poehali.dev/9f1887ba-ac1c-402a-be0d-4ae5c1a9175d';

interface Unit {
  id: number;
  name: string;
  type: string;
  description: string;
  base_price: number;
  max_guests: number;
}

interface Booking {
  id: number;
  unit_id: number;
  unit_name: string;
  check_in: string;
  check_out: string;
  guest_name: string;
  guest_phone: string;
  total_price: number;
  status: string;
}

export default function BookingCalendar() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [user, setUser] = useState<any>(null);
  const [botLink, setBotLink] = useState('');
  
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [newUnit, setNewUnit] = useState({
    name: '',
    type: 'house',
    description: '',
    base_price: '',
    max_guests: ''
  });

  const [showAddBooking, setShowAddBooking] = useState(false);
  const [newBooking, setNewBooking] = useState({
    check_in: '',
    check_out: '',
    guest_name: '',
    guest_phone: ''
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      setBotLink(`https://t.me/YOUR_BOT_USERNAME?start=${userData.id}`);
    }
    loadUnits();
    loadBookings();
  }, []);

  const loadUnits = async () => {
    try {
      const response = await fetch(`${API_URL}?action=units`);
      const data = await response.json();
      setUnits(data.units || []);
      if (data.units?.length > 0 && !selectedUnit) {
        setSelectedUnit(data.units[0]);
      }
    } catch (error) {
      console.error('Error loading units:', error);
    }
  };

  const loadBookings = async () => {
    try {
      const response = await fetch(`${API_URL}?action=bookings`);
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const addUnit = async () => {
    if (!newUnit.name || !newUnit.base_price || !newUnit.max_guests) {
      alert('Заполните все поля');
      return;
    }

    try {
      const response = await fetch(`${API_URL}?action=create-unit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUnit)
      });
      
      if (response.ok) {
        setShowAddUnit(false);
        setNewUnit({ name: '', type: 'house', description: '', base_price: '', max_guests: '' });
        await loadUnits();
      }
    } catch (error) {
      console.error('Error adding unit:', error);
    }
  };

  const deleteUnit = async (unitId: number) => {
    if (!confirm('Удалить этот объект? Все бронирования также будут удалены.')) return;
    
    try {
      const response = await fetch(`${API_URL}?action=delete-unit&unit_id=${unitId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        if (selectedUnit?.id === unitId) {
          setSelectedUnit(null);
        }
        await loadUnits();
        await loadBookings();
      }
    } catch (error) {
      console.error('Error deleting unit:', error);
    }
  };

  const createBooking = async () => {
    if (!selectedUnit || !newBooking.check_in || !newBooking.check_out || !newBooking.guest_name) {
      alert('Заполните все обязательные поля');
      return;
    }

    try {
      const response = await fetch(`${API_URL}?action=create-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: selectedUnit.id,
          ...newBooking
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setShowAddBooking(false);
        setNewBooking({ check_in: '', check_out: '', guest_name: '', guest_phone: '' });
        await loadBookings();
      } else {
        alert(data.error || 'Ошибка создания бронирования');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Ошибка создания бронирования');
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const isDateBooked = (day: number) => {
    if (!selectedUnit) return false;
    
    const { year, month } = getDaysInMonth(currentDate);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    return bookings.some(booking => {
      if (booking.unit_id !== selectedUnit.id) return false;
      return dateStr >= booking.check_in && dateStr < booking.check_out;
    });
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-16 border border-gray-100"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const isBooked = isDateBooked(day);
      const isToday = new Date().getDate() === day && 
                      new Date().getMonth() === currentDate.getMonth() &&
                      new Date().getFullYear() === currentDate.getFullYear();
      
      days.push(
        <div
          key={day}
          className={`h-16 border border-gray-200 p-2 transition-colors ${
            isBooked 
              ? 'bg-red-100 cursor-not-allowed' 
              : 'bg-white hover:bg-blue-50 cursor-pointer'
          } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
        >
          <div className="text-sm font-semibold">{day}</div>
          {isBooked && (
            <Badge variant="destructive" className="text-xs mt-1">
              Занято
            </Badge>
          )}
        </div>
      );
    }
    
    return days;
  };

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            <Icon name="Calendar" className="inline-block mr-2" size={36} />
            Календарь бронирования
          </h1>
          <p className="text-gray-600">
            Управляйте бронированиями для турбаз и гостевых домов
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Объекты для бронирования</span>
              <Dialog open={showAddUnit} onOpenChange={setShowAddUnit}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Icon name="Plus" className="mr-2" size={16} />
                    Добавить объект
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Добавить новый объект</DialogTitle>
                    <DialogDescription>
                      Создайте новый номер или домик для бронирования
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="unitName">Название *</Label>
                      <Input
                        id="unitName"
                        placeholder="Домик №1"
                        value={newUnit.name}
                        onChange={(e) => setNewUnit({...newUnit, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="unitType">Тип</Label>
                      <select
                        id="unitType"
                        className="w-full p-2 border rounded-md"
                        value={newUnit.type}
                        onChange={(e) => setNewUnit({...newUnit, type: e.target.value})}
                      >
                        <option value="house">Домик</option>
                        <option value="room">Номер</option>
                        <option value="bathhouse">Баня</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="unitDescription">Описание</Label>
                      <Input
                        id="unitDescription"
                        placeholder="2 спальни, кухня, терраса"
                        value={newUnit.description}
                        onChange={(e) => setNewUnit({...newUnit, description: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="unitPrice">Цена за ночь *</Label>
                        <Input
                          id="unitPrice"
                          type="number"
                          placeholder="5000"
                          value={newUnit.base_price}
                          onChange={(e) => setNewUnit({...newUnit, base_price: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="unitGuests">Макс. гостей *</Label>
                        <Input
                          id="unitGuests"
                          type="number"
                          placeholder="4"
                          value={newUnit.max_guests}
                          onChange={(e) => setNewUnit({...newUnit, max_guests: e.target.value})}
                        />
                      </div>
                    </div>
                    <Button onClick={addUnit} className="w-full">
                      Создать объект
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {units.map((unit) => (
                <div
                  key={unit.id}
                  className={`p-4 border-2 rounded-lg relative transition-all ${
                    selectedUnit?.id === unit.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <button
                    onClick={() => deleteUnit(unit.id)}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-100 text-red-600"
                  >
                    <Icon name="Trash2" size={16} />
                  </button>
                  <div onClick={() => setSelectedUnit(unit)} className="cursor-pointer">
                    <h3 className="font-semibold text-lg pr-8">{unit.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{unit.description}</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="flex items-center gap-1 text-sm">
                        <Icon name="Users" size={14} />
                        До {unit.max_guests} гостей
                      </span>
                      <span className="font-bold text-blue-600">
                        {unit.base_price.toLocaleString()} ₽
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedUnit && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{selectedUnit.name}</CardTitle>
                  <CardDescription>Календарь занятости</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Dialog open={showAddBooking} onOpenChange={setShowAddBooking}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Icon name="Plus" className="mr-2" size={16} />
                        Создать бронь
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Создать бронирование</DialogTitle>
                        <DialogDescription>
                          Добавить новое бронирование для {selectedUnit.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="checkIn">Заезд *</Label>
                            <Input
                              id="checkIn"
                              type="date"
                              value={newBooking.check_in}
                              onChange={(e) => setNewBooking({...newBooking, check_in: e.target.value})}
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          <div>
                            <Label htmlFor="checkOut">Выезд *</Label>
                            <Input
                              id="checkOut"
                              type="date"
                              value={newBooking.check_out}
                              onChange={(e) => setNewBooking({...newBooking, check_out: e.target.value})}
                              min={newBooking.check_in || new Date().toISOString().split('T')[0]}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="guestName">Имя гостя *</Label>
                          <Input
                            id="guestName"
                            placeholder="Иван Иванов"
                            value={newBooking.guest_name}
                            onChange={(e) => setNewBooking({...newBooking, guest_name: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="guestPhone">Телефон</Label>
                          <Input
                            id="guestPhone"
                            placeholder="+7 (999) 123-45-67"
                            value={newBooking.guest_phone}
                            onChange={(e) => setNewBooking({...newBooking, guest_phone: e.target.value})}
                          />
                        </div>
                        <Button onClick={createBooking} className="w-full">
                          Создать бронирование
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="sm" onClick={() => changeMonth(-1)}>
                    <Icon name="ChevronLeft" size={20} />
                  </Button>
                  <span className="font-semibold text-lg min-w-[200px] text-center">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => changeMonth(1)}>
                    <Icon name="ChevronRight" size={20} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map((day) => (
                  <div key={day} className="text-center font-semibold text-sm text-gray-600 p-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {renderCalendar()}
              </div>
              
              <div className="flex gap-4 mt-6 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white border-2 border-gray-200 rounded"></div>
                  <span className="text-sm">Свободно</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border-2 border-red-200 rounded"></div>
                  <span className="text-sm">Занято</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white border-2 border-blue-500 rounded"></div>
                  <span className="text-sm">Сегодня</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Icon name="MessageCircle" size={48} className="flex-shrink-0" />
              <div className="w-full">
                <h3 className="text-xl font-bold mb-2">🤖 AI-менеджер в Telegram</h3>
                <p className="text-blue-100 mb-4">
                  Ваш персональный бот принимает бронирования 24/7. Клиенты пишут боту, AI-ассистент отвечает на вопросы и автоматически создаёт бронирования.
                </p>
                
                {botLink && (
                  <div className="bg-white/90 rounded-lg p-4 mt-4">
                    <h4 className="font-semibold text-gray-900 mb-2">📱 Ваша ссылка для клиентов:</h4>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={botLink} 
                        readOnly 
                        className="bg-white text-gray-900 border-gray-300 font-mono text-sm"
                      />
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(botLink);
                          alert('Ссылка скопирована!');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                      >
                        <Icon name="Copy" size={16} />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Отправьте эту ссылку клиентам или разместите на сайте. Каждый клиент получит персонального AI-менеджера.
                    </p>
                  </div>
                )}

                <div className="bg-white/20 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold mb-2">⚙️ Настройка Telegram-бота:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Откройте @BotFather в Telegram</li>
                    <li>Отправьте команду /newbot</li>
                    <li>Укажите имя и username бота (например: tourconnect_bot)</li>
                    <li>Скопируйте токен и добавьте в секреты проекта выше ⬆️</li>
                    <li>Настройте webhook командой в @BotFather или я это сделаю автоматически</li>
                  </ol>
                </div>
                
                <div className="flex gap-3 mt-4">
                  <Badge className="bg-green-500 text-white">
                    <Icon name="Check" className="mr-1" size={14} />
                    Backend готов
                  </Badge>
                  <Badge className="bg-white text-blue-600">
                    <Icon name="Sparkles" className="mr-1" size={14} />
                    OpenAI подключен
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}