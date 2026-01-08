import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

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
      const token = localStorage.getItem('auth_token');
      const response = await fetch('https://functions.poehali.dev/admin-users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
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
      const token = localStorage.getItem('auth_token');
      const response = await fetch('https://functions.poehali.dev/c8640daa-ffb2-4b32-986a-988223824954', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
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
      const token = localStorage.getItem('auth_token');
      const response = await fetch('https://functions.poehali.dev/57e87325-acea-4f23-9b9b-048fa498ae14', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          action: 'toggle_admin'
        })
      });

      if (response.ok) {
        toast({
          title: 'Права обновлены',
          description: 'Статус администратора изменен'
        });
        fetchUsers();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось изменить права',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30">
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-lg z-50 border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold font-heading bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            TourConnect Admin
          </h1>
          <Button onClick={() => navigate('/')} variant="outline">
            <Icon name="Home" className="mr-2" size={20} />
            На главную
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Users" size={24} />
                Всего пользователей
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{total}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Send" size={24} />
                В Telegram
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-secondary">
                {users.filter(u => u.telegram_invited).length}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Shield" size={24} />
                Администраторы
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-accent">
                {users.filter(u => u.is_admin).length}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Email рассылка</CardTitle>
              <CardDescription>
                Отправить письмо всем зарегистрированным пользователям
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="subject">Тема письма</Label>
                <Input
                  id="subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Новые возможности TourConnect"
                />
              </div>
              <div>
                <Label htmlFor="message">Текст письма</Label>
                <Textarea
                  id="message"
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Здравствуйте, {name}!&#10;&#10;Рады сообщить вам..."
                  rows={8}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Используйте {'{name}'} для персонализации
                </p>
              </div>
              <Button
                onClick={sendEmail}
                disabled={sendingEmail || !emailSubject || !emailMessage}
                className="w-full"
              >
                {sendingEmail ? (
                  <>
                    <Icon name="Loader2" className="mr-2 animate-spin" size={20} />
                    Отправка...
                  </>
                ) : (
                  <>
                    <Icon name="Send" className="mr-2" size={20} />
                    Отправить рассылку
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Пользователи</CardTitle>
              <CardDescription>
                Список зарегистрированных пользователей
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Icon name="Loader2" className="animate-spin" size={32} />
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.full_name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            <Icon name="User" className="text-white" size={20} />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">{user.full_name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {user.provider}
                            </Badge>
                            {user.telegram_invited && (
                              <Badge variant="outline" className="text-xs bg-blue-50">
                                <Icon name="Send" size={12} className="mr-1" />
                                TG
                              </Badge>
                            )}
                            {user.is_admin && (
                              <Badge variant="outline" className="text-xs bg-purple-50">
                                <Icon name="Shield" size={12} className="mr-1" />
                                Admin
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAdmin(user.id)}
                      >
                        <Icon name="Shield" size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;