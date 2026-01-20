import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { fetchWithAuth } from '@/lib/api';
import Icon from '@/components/ui/icon';

const API_URL = 'https://functions.poehali.dev/9f1887ba-ac1c-402a-be0d-4ae5c1a9175d';

interface ModificationRequest {
  id: number;
  booking_id: number | null;
  client_name: string;
  client_phone: string;
  message_from_client: string;
  requested_changes: any;
  status: string;
  created_at: string;
}

export default function ModificationRequests() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ModificationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadRequests = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}?action=modification_requests`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (requestId: number) => {
    try {
      const response = await fetchWithAuth(`${API_URL}?action=resolve_modification_request`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId })
      });

      if (response.ok) {
        toast({
          title: 'Заявка закрыта',
          description: 'Запрос отмечен как обработанный'
        });
        loadRequests();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось закрыть заявку',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          Загрузка заявок...
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Edit" size={20} />
            Заявки на изменение броней
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-gray-500 py-8">
          Нет активных заявок на изменение
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Edit" size={20} />
            Заявки на изменение броней
          </div>
          <Badge variant="outline">{requests.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">Заявка #{req.id}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(req.created_at).toLocaleString('ru-RU')}
                  </p>
                </div>
                <Badge variant="secondary">Новая</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon name="User" size={16} className="text-gray-500" />
                  <span>{req.client_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Phone" size={16} className="text-gray-500" />
                  <a href={`tel:${req.client_phone}`} className="text-blue-600 hover:underline">
                    {req.client_phone}
                  </a>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm font-medium mb-1">Сообщение клиента:</p>
                <p className="text-sm whitespace-pre-wrap">{req.message_from_client}</p>
              </div>

              <Button 
                onClick={() => handleResolve(req.id)} 
                variant="outline" 
                className="w-full"
              >
                <Icon name="Check" size={16} className="mr-2" />
                Отметить как обработанное
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
