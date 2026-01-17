import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
      
      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="fixed top-4 right-4 gap-2 z-50 bg-white hover:bg-gray-50 shadow-md"
            >
              <Icon name="User" size={16} className="text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">{user.full_name || user.email}</span>
              <Icon name="ChevronDown" size={16} className="text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <Icon name="User" className="mr-2" size={16} />
              Профиль
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/pricing')}>
              <Icon name="CreditCard" className="mr-2" size={16} />
              Подписка
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                localStorage.removeItem('user');
                navigate('/auth');
              }}
              className="text-red-600 focus:text-red-600"
            >
              <Icon name="LogOut" className="mr-2" size={16} />
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      
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
            {pendingCount > 0 && (
              <Button
                onClick={onShowPendingRequests}
                className="gap-2 bg-yellow-500 hover:bg-yellow-600 animate-pulse"
              >
                <Icon name="AlertCircle" size={16} />
                Заявки ({pendingCount})
              </Button>
            )}
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
