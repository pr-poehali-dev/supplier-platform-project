import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import UserProfile from '@/components/navigation/UserProfile';
import type { Booking } from '@/components/booking/CalendarView';

interface CalendarHeaderProps {
  user: any;
  bookings: Booking[];
  onShowPendingRequests: () => void;
}

export default function CalendarHeader({ user, bookings, onShowPendingRequests }: CalendarHeaderProps) {
  const navigate = useNavigate();

  const pendingCount = bookings.filter(b => b.is_pending_confirmation || b.payment_status === 'pending').length;

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 gap-2 z-50"
      >
        <Icon name="Home" size={20} />
        На главную
      </Button>
      
      <div className="fixed top-4 right-4 z-50">
        <UserProfile user={user} />
      </div>
      
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            <Icon name="Calendar" className="inline-block mr-2" size={36} />
            Календарь бронирования
          </h1>
          <p className="text-gray-600 mb-4">
            Управляйте бронированиями для турбаз и гостевых домов
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button
              onClick={onShowPendingRequests}
              className={`gap-2 ${pendingCount > 0 ? 'bg-yellow-500 hover:bg-yellow-600 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              <Icon name="AlertCircle" size={16} />
              Заявки {pendingCount > 0 && `(${pendingCount})`}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/additional-services')}
              className="gap-2"
            >
              <Icon name="Plus" size={16} />
              Допродажи
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/customers')}
              className="gap-2"
            >
              <Icon name="Users" size={16} />
              База клиентов
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/bot-settings')}
              className="gap-2"
            >
              <Icon name="Bot" size={16} />
              Настройки AI
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}