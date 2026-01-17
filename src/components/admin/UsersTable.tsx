import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

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

interface UsersTableProps {
  users: User[];
  total: number;
  loading: boolean;
  onToggleAdmin: (userId: number) => void;
}

export default function UsersTable({ users, total, loading, onToggleAdmin }: UsersTableProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Users" size={24} />
          Пользователи ({total})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Icon name="Loader2" className="animate-spin" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">ID</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Имя</th>
                  <th className="text-left p-3">Провайдер</th>
                  <th className="text-left p-3">Подписка</th>
                  <th className="text-left p-3">Telegram</th>
                  <th className="text-left p-3">Создан</th>
                  <th className="text-left p-3">Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{user.id}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {user.avatar_url && (
                          <img src={user.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                        )}
                        {user.full_name}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">{user.provider}</Badge>
                    </td>
                    <td className="p-3">
                      {user.subscription_plan ? (
                        <div>
                          <Badge className="bg-green-500">
                            {user.subscription_plan.toUpperCase()}
                          </Badge>
                          {user.subscription_expires_at && (
                            <div className="text-xs text-gray-500 mt-1">
                              до {formatDate(user.subscription_expires_at)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline">Free</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      {user.telegram_invited ? (
                        <Badge className="bg-blue-500">Приглашён</Badge>
                      ) : (
                        <Badge variant="outline">Нет</Badge>
                      )}
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="p-3">
                      <Button
                        size="sm"
                        variant={user.is_admin ? "default" : "outline"}
                        onClick={() => onToggleAdmin(user.id)}
                      >
                        <Icon name="Shield" size={14} className="mr-1" />
                        {user.is_admin ? 'Админ' : 'Дать права'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
