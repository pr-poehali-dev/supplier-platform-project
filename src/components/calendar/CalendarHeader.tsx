import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import UserProfile from '@/components/navigation/UserProfile';
import { fetchWithAuth } from '@/lib/api';

interface CalendarHeaderProps {
  user: any;
  onShowPendingRequests: () => void;
}

export default function CalendarHeader({ user, onShowPendingRequests }: CalendarHeaderProps) {
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    loadPendingCount();
    
    // Автообновление каждые 30 секунд
    const interval = setInterval(() => {
      loadPendingCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadPendingCount = async () => {
    try {
      const response = await fetchWithAuth('https://functions.poehali.dev/9f1887ba-ac1c-402a-be0d-4ae5c1a9175d?action=get_pending_bookings');
      const data = await response.json();
      setPendingCount(data.bookings?.length || 0);
    } catch (error) {
      console.error('Failed to load pending count:', error);
    }
  };

  return (
    <>
      <div className="fixed top-4 right-4 z-[9999]">
        <UserProfile user={user} />
      </div>
      
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            <Icon name="Calendar" className="inline-block mr-2 text-primary" size={36} />
            Календарь бронирования
          </h1>
          <p className="text-muted-foreground mb-4">
            Управляйте бронированиями для турбаз и гостевых домов
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button
              onClick={onShowPendingRequests}
              variant={pendingCount > 0 ? 'default' : 'outline'}
              className={`gap-2 ${pendingCount > 0 ? 'bg-warning hover:bg-warning/90 text-warning-foreground animate-pulse' : ''}`}
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