import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface UserInfoCardProps {
  user: any;
  planName: string;
  planEmoji: string;
  expiryText: string | null;
  onRefresh: () => void;
  onNavigatePricing: () => void;
}

export default function UserInfoCard({ user, planName, planEmoji, expiryText, onRefresh, onNavigatePricing }: UserInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="User" size={24} />
          Личные данные
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {user && (
          <>
            <div className="flex items-center gap-4">
              {user.avatar_url && (
                <img
                  src={user.avatar_url}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <p className="font-semibold text-lg">{user.full_name}</p>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-2">Текущий тариф</p>
              <Badge className="text-lg px-4 py-2">
                {planEmoji} {planName}
              </Badge>
              {expiryText && (
                <p className="text-sm text-gray-600 mt-2">{expiryText}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={onRefresh} variant="outline" className="flex-1">
                <Icon name="RefreshCw" size={16} className="mr-2" />
                Обновить данные
              </Button>
              <Button onClick={onNavigatePricing} className="flex-1">
                <Icon name="Crown" size={16} className="mr-2" />
                Управление подпиской
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}