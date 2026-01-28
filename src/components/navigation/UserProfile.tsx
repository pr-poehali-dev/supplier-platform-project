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
import { useSubscription } from '@/hooks/useSubscription';

interface UserProfileProps {
  user: any;
}

const getSubscriptionColor = (plan: string) => {
  switch (plan) {
    case 'start':
      return '#10b981';
    case 'pro':
      return '#3b82f6';
    case 'business':
      return '#a855f7';
    default:
      return '#9ca3af';
  }
};

const getSubscriptionName = (plan: string) => {
  switch (plan) {
    case 'start':
      return 'Старт';
    case 'pro':
      return 'Про';
    case 'business':
      return 'Бизнес';
    default:
      return 'Нет подписки';
  }
};

export default function UserProfile({ user }: UserProfileProps) {
  const navigate = useNavigate();
  const { subscription } = useSubscription();
  
  if (!user) {
    return (
      <Button onClick={() => navigate('/auth')} className="gap-2">
        <Icon name="LogIn" size={16} />
        Войти
      </Button>
    );
  }

  // Get subscription from API (not from user object in localStorage)
  const subscriptionPlan = subscription?.plan_code || 'none';
  const color = getSubscriptionColor(subscriptionPlan);
  const planName = getSubscriptionName(subscriptionPlan);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="gap-2 bg-white hover:bg-gray-50 shadow-md"
        >
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <Icon name="User" size={16} className="text-indigo-600" />
          <span className="text-sm font-medium text-gray-700">
            {user.full_name || user.email}
          </span>
          <Icon name="ChevronDown" size={16} className="text-gray-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div>
            <div className="text-sm font-medium">{user.full_name || user.email}</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-500">{planName}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <Icon name="User" className="mr-2" size={16} />
          Профиль
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/booking-calendar')}>
          <Icon name="Calendar" className="mr-2" size={16} />
          Календарь
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
  );
}