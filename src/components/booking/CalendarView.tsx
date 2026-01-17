import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { Unit } from './UnitsManagement';
import { fetchWithAuth } from '@/lib/api';
import CalendarGrid from './CalendarGrid';
import BookingDialog from './BookingDialog';

const PRICING_ENGINE_URL = 'https://functions.poehali.dev/a4b5c99d-6289-44f5-835f-c865029c71e4';

interface TelegramMessage {
  id: number;
  telegram_id: number;
  message_text: string;
  sender: 'user' | 'bot';
  created_at: string;
}

export interface Booking {
  id: number;
  unit_id: number;
  unit_name: string;
  check_in: string;
  check_out: string;
  guest_name: string;
  guest_phone: string;
  total_price: number;
  status: string;
  source?: string;
  payment_status?: string;
  is_pending_confirmation?: boolean;
}

interface CalendarViewProps {
  selectedUnit: Unit | null;
  currentDate: Date;
  bookings: Booking[];
  onChangeMonth: (delta: number) => void;
  onDeleteBooking?: (bookingId: number) => Promise<void>;
  renderBookingButton?: React.ReactNode;
}

export default function CalendarView({
  selectedUnit,
  currentDate,
  bookings,
  onChangeMonth,
  onDeleteBooking,
  renderBookingButton
}: CalendarViewProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [telegramMessages, setTelegramMessages] = useState<TelegramMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [dynamicPrices, setDynamicPrices] = useState<Record<string, { price: number; appliedRules: any[] }>>({});
  const [showPrices, setShowPrices] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(false);
  
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  useEffect(() => {
    if (selectedBooking) {
      loadTelegramMessages(selectedBooking.id);
    } else {
      setTelegramMessages([]);
    }
  }, [selectedBooking]);

  useEffect(() => {
    if (selectedUnit && showPrices) {
      loadDynamicPrices();
    }
  }, [selectedUnit, currentDate, showPrices]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    return { daysInMonth, year, month };
  };

  const loadDynamicPrices = async () => {
    if (!selectedUnit) return;

    setLoadingPrices(true);
    setDynamicPrices({});
    const { year, month, daysInMonth } = getDaysInMonth(currentDate);

    try {
      const promises = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        promises.push(
          fetchWithAuth(`${PRICING_ENGINE_URL}?action=calculate_price&unit_id=${selectedUnit.id}&date=${dateStr}`)
            .then(res => res.json())
            .then(data => ({ dateStr, data }))
            .catch(() => null)
        );
      }

      const results = await Promise.all(promises);
      
      const prices: Record<string, { price: number; appliedRules: any[] }> = {};
      results.forEach(result => {
        if (result && result.data.price) {
          prices[result.dateStr] = {
            price: result.data.price,
            appliedRules: result.data.applied_rules || []
          };
        }
      });
      
      setDynamicPrices(prices);
    } catch (error) {
      // Failed to load dynamic prices
    } finally {
      setLoadingPrices(false);
    }
  };

  const loadTelegramMessages = async (bookingId: number) => {
    setLoadingMessages(true);
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user?.id) return;

      const response = await fetchWithAuth(
        `https://functions.poehali.dev/b08b50dd-ee0f-4534-9865-afdf3582a91b?booking_id=${bookingId}`
      );
      const data = await response.json();
      
      if (data.success) {
        setTelegramMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading telegram messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleDeleteBooking = async (bookingId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDeleteBooking) return;
    if (!confirm('Удалить это бронирование?')) return;
    await onDeleteBooking(bookingId);
  };

  if (!selectedUnit) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          <Icon name="Calendar" size={48} className="mx-auto mb-4 text-gray-300" />
          <p>Выберите номер для просмотра календаря</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChangeMonth(-1)}
              >
                <Icon name="ChevronLeft" size={16} />
              </Button>
              <h3 className="text-lg font-semibold">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChangeMonth(1)}
              >
                <Icon name="ChevronRight" size={16} />
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="show-prices"
                  checked={showPrices}
                  onCheckedChange={setShowPrices}
                />
                <Label htmlFor="show-prices" className="text-sm cursor-pointer">
                  Показать цены
                </Label>
              </div>
              {renderBookingButton}
            </div>
          </div>

          <CalendarGrid
            currentDate={currentDate}
            bookings={bookings}
            selectedUnitId={selectedUnit.id}
            dynamicPrices={dynamicPrices}
            showPrices={showPrices}
            loadingPrices={loadingPrices}
            onBookingClick={setSelectedBooking}
          />

          <div className="flex gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-gray-200"></div>
              <span>Забронировано</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border border-gray-200"></div>
              <span>Ожидает подтверждения</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-100 border border-gray-200"></div>
              <span>Ожидает оплаты</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <BookingDialog
        booking={selectedBooking}
        open={!!selectedBooking}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
        messages={telegramMessages}
        loadingMessages={loadingMessages}
        onDelete={onDeleteBooking ? handleDeleteBooking : undefined}
      />
    </div>
  );
}
