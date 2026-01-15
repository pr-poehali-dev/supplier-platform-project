import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { fetchWithAuth } from '@/lib/api';

const AI_URL = 'https://functions.poehali.dev/f62c6672-5e97-4934-af5c-2f4fa9dca61a';

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  enabled: boolean;
}

export default function AdditionalServices() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const getUserId = () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    return user?.id;
  };

  const loadServices = async () => {
    const userId = getUserId();
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetchWithAuth(`${AI_URL}?action=services`, {
        headers: { 'X-User-Id': userId.toString() }
      });
      const data = await response.json();
      setServices(data.services || []);
    } catch (error) {
      // Error loading services
    } finally {
      setLoading(false);
    }
  };

  const saveService = async () => {
    if (!editingService?.name) return;

    const userId = getUserId();
    if (!userId) return;

    setLoading(true);
    try {
      const url = editingService.id
        ? `${AI_URL}?action=services&id=${editingService.id}`
        : `${AI_URL}?action=services`;

      const response = await fetchWithAuth(url, {
        method: editingService.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        },
        body: JSON.stringify(editingService)
      });

      if (response.ok) {
        await loadServices();
        setIsDialogOpen(false);
        setEditingService(null);
        toast({
          title: 'Успешно',
          description: editingService.id ? 'Услуга обновлена' : 'Услуга добавлена'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить услугу',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const openNewServiceDialog = () => {
    setEditingService({
      name: '',
      description: '',
      price: 0,
      category: 'Прочее',
      enabled: true
    });
    setIsDialogOpen(true);
  };

  const openEditServiceDialog = (service: Service) => {
    setEditingService({ ...service });
    setIsDialogOpen(true);
  };

  const categories = [
    'Питание',
    'Экскурсии',
    'Развлечения',
    'Трансфер',
    'Аренда оборудования',
    'Прочее'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/booking-calendar')}
        className="fixed top-4 left-4 gap-2 z-50"
      >
        <Icon name="ArrowLeft" size={20} />
        Назад
      </Button>

      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            <Icon name="Plus" className="inline-block mr-2" size={36} />
            Допродажи
          </h1>
          <p className="text-gray-600">
            Управление дополнительными услугами для гостей
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Список услуг</CardTitle>
                <CardDescription>
                  AI-бот будет предлагать эти услуги вашим клиентам
                </CardDescription>
              </div>
              <Button onClick={openNewServiceDialog} className="gap-2">
                <Icon name="Plus" size={16} />
                Добавить услугу
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Icon name="Loader2" size={32} className="animate-spin mx-auto" />
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Icon name="Package" size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg mb-2">Пока нет услуг</p>
                <p className="text-sm">Добавьте первую допродажу для ваших гостей!</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                  <Card
                    key={service.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      !service.enabled ? 'opacity-60' : ''
                    }`}
                    onClick={() => openEditServiceDialog(service)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{service.name}</CardTitle>
                          <p className="text-xs text-gray-500 mt-1">{service.category}</p>
                        </div>
                        <Switch checked={service.enabled} className="ml-2" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {service.description || 'Без описания'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-purple-600">
                          {service.price ? `${service.price}₽` : 'Бесплатно'}
                        </span>
                        <Icon name="ChevronRight" size={16} className="text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Диалог добавления/редактирования */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingService?.id ? 'Редактировать услугу' : 'Новая услуга'}
              </DialogTitle>
            </DialogHeader>
            {editingService && (
              <div className="space-y-4">
                <div>
                  <Label>Название</Label>
                  <Input
                    value={editingService.name || ''}
                    onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                    placeholder="Завтрак"
                  />
                </div>

                <div>
                  <Label>Описание</Label>
                  <Textarea
                    value={editingService.description || ''}
                    onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                    placeholder="Горячий завтрак шведский стол"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Цена (₽)</Label>
                    <Input
                      type="number"
                      value={editingService.price || 0}
                      onChange={(e) => setEditingService({
                        ...editingService,
                        price: parseFloat(e.target.value) || 0
                      })}
                      placeholder="500"
                    />
                  </div>

                  <div>
                    <Label>Категория</Label>
                    <Select
                      value={editingService.category || 'Прочее'}
                      onValueChange={(value) => setEditingService({
                        ...editingService,
                        category: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingService.enabled !== false}
                    onCheckedChange={(checked) => setEditingService({
                      ...editingService,
                      enabled: checked
                    })}
                  />
                  <Label>Услуга активна</Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={saveService} disabled={loading} className="flex-1">
                    {loading ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}