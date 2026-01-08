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
  
  // Форма добавления объекта
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [newUnit, setNewUnit] = useState({
    name: '',
    type: 'house',
    description: '',
    base_price: '',
    max_guests: ''
  });

  useEffect(() => {
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
    try {
      const response = await fetch(`${API_URL}?action=create-unit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUnit)
      });
      
      if (response.ok) {
        setShowAddUnit(false);
        setNewUnit({ name: '', type: 'house', description: '', base_price: '', max_guests: '' });
        loadUnits();
      }
    } catch (error) {
      console.error('Error adding unit:', error);
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

        {/* Выбор объекта */}
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
                      <Label htmlFor="unitName">Название</Label>
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
                        <Label htmlFor="unitPrice">Цена за ночь</Label>
                        <Input
                          id="unitPrice"
                          type="number"
                          placeholder="5000"
                          value={newUnit.base_price}
                          onChange={(e) => setNewUnit({...newUnit, base_price: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="unitGuests">Макс. гостей</Label>
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
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedUnit?.id === unit.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedUnit(unit)}
                >
                  <h3 className="font-semibold text-lg">{unit.name}</h3>
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
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Календарь */}
        {selectedUnit && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{selectedUnit.name}</CardTitle>
                  <CardDescription>Календарь занятости</CardDescription>
                </div>
                <div className="flex items-center gap-4">
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

        {/* Информация о Telegram боте */}
        <Card className="mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Icon name="MessageCircle" size={48} className="flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold mb-2">AI-менеджер в Telegram</h3>
                <p className="text-blue-100 mb-4">
                  Клиенты могут бронировать номера через чат-бота в Telegram или WhatsApp. 
                  AI-ассистент проверит доступность, рассчитает цену и создаст бронирование автоматически.
                </p>
                <Badge className="bg-white text-blue-600">
                  <Icon name="Sparkles" className="mr-1" size={14} />
                  Скоро доступно
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
