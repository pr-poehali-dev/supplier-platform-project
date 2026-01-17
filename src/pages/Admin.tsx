import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { fetchWithAuth } from '@/lib/api';
import PaymentLinksManager from '@/components/admin/PaymentLinksManager';
import PendingBookingsManager from '@/components/admin/PendingBookingsManager';
import SubscriptionManager from '@/components/admin/SubscriptionManager';
import CalendarSyncManager from '@/components/admin/CalendarSyncManager';
import UsersTable from '@/components/admin/UsersTable';
import EmailSender from '@/components/admin/EmailSender';

interface User {
  id: number;
  email: string;
  full_name: string;
  provider: string;
  avatar_url: string;
  created_at: string;
  last_login: string;
  telegram_invited: boolean;
  is_admin: boolean;
  subscription_plan?: string;
  subscription_expires_at?: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/auth');
      return;
    }
    
    const user = JSON.parse(userStr);
    if (!user.is_admin) {
      toast({
        title: 'Доступ запрещен',
        description: 'У вас нет прав администратора',
        variant: 'destructive'
      });
      navigate('/');
      return;
    }
    
    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('https://functions.poehali.dev/admin-users');
      
      if (response.status === 403) {
        toast({
          title: 'Доступ запрещен',
          description: 'У вас нет прав администратора',
          variant: 'destructive'
        });
        navigate('/');
        return;
      }
      
      const data = await response.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить пользователей',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Заполните тему и текст письма',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSendingEmail(true);
      const response = await fetchWithAuth('https://functions.poehali.dev/c8640daa-ffb2-4b32-986a-988223824954', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: emailSubject,
          message: emailMessage
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Рассылка отправлена!',
          description: `Успешно отправлено ${data.sent_count} из ${data.total_users} писем`
        });
        setEmailSubject('');
        setEmailMessage('');
      } else {
        throw new Error(data.error || 'Ошибка отправки');
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка отправки',
        description: error.message || 'Не удалось отправить рассылку',
        variant: 'destructive'
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const toggleAdmin = async (userId: number) => {
    try {
      const response = await fetchWithAuth('https://functions.poehali.dev/57e87325-acea-4f23-9b9b-048fa498ae14', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          action: 'toggle_admin'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Успешно',
          description: data.message || 'Права изменены'
        });
        fetchUsers();
      } else {
        throw new Error(data.error || 'Ошибка');
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось изменить права',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <Icon name="ArrowLeft" size={20} />
              Назад
            </Button>
            <h1 className="text-4xl font-bold">Панель администратора</h1>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="users">
              <Icon name="Users" size={16} className="mr-2" />
              Пользователи
            </TabsTrigger>
            <TabsTrigger value="email">
              <Icon name="Mail" size={16} className="mr-2" />
              Рассылка
            </TabsTrigger>
            <TabsTrigger value="payments">
              <Icon name="CreditCard" size={16} className="mr-2" />
              Платежи
            </TabsTrigger>
            <TabsTrigger value="bookings">
              <Icon name="Calendar" size={16} className="mr-2" />
              Брони
            </TabsTrigger>
            <TabsTrigger value="subscriptions">
              <Icon name="Crown" size={16} className="mr-2" />
              Подписки
            </TabsTrigger>
            <TabsTrigger value="sync">
              <Icon name="RefreshCw" size={16} className="mr-2" />
              Синхронизация
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UsersTable
              users={users}
              total={total}
              loading={loading}
              onToggleAdmin={toggleAdmin}
            />
          </TabsContent>

          <TabsContent value="email">
            <EmailSender
              subject={emailSubject}
              message={emailMessage}
              onSubjectChange={setEmailSubject}
              onMessageChange={setEmailMessage}
              onSend={sendEmail}
              sending={sendingEmail}
            />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentLinksManager />
          </TabsContent>

          <TabsContent value="bookings">
            <PendingBookingsManager />
          </TabsContent>

          <TabsContent value="subscriptions">
            <SubscriptionManager />
          </TabsContent>

          <TabsContent value="sync">
            <CalendarSyncManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
