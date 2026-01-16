import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { fetchWithAuth } from '@/lib/api';

interface PaymentLink {
  id: number;
  unit_id: number;
  unit_name: string;
  payment_system: string;
  payment_link: string;
  recipient_name: string;
}

interface BookingUnit {
  id: number;
  name: string;
  price_per_night: number;
}

export const PaymentLinksManager = () => {
  const { toast } = useToast();
  const [units, setUnits] = useState<BookingUnit[]>([]);
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUnit, setEditingUnit] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    payment_system: 'sbp',
    payment_link: '',
    recipient_name: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [unitsRes, linksRes] = await Promise.all([
        fetchWithAuth('https://functions.poehali.dev/9f1887ba-ac1c-402a-be0d-4ae5c1a9175d?action=get_units'),
        fetchWithAuth('https://functions.poehali.dev/9f1887ba-ac1c-402a-be0d-4ae5c1a9175d?action=get_payment_links')
      ]);

      const unitsData = await unitsRes.json();
      const linksData = await linksRes.json();
      
      setUnits(unitsData.units || []);
      setLinks(linksData.links || []);
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить данные',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const savePaymentLink = async (unitId: number) => {
    if (!formData.payment_link.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите платежную ссылку',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetchWithAuth('https://functions.poehali.dev/9f1887ba-ac1c-402a-be0d-4ae5c1a9175d', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'save_payment_link',
          unit_id: unitId,
          ...formData
        })
      });

      if (response.ok) {
        toast({
          title: 'Сохранено!',
          description: 'Платежные реквизиты обновлены'
        });
        setEditingUnit(null);
        setFormData({ payment_system: 'sbp', payment_link: '', recipient_name: '' });
        loadData();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить реквизиты',
        variant: 'destructive'
      });
    }
  };

  const startEdit = (unitId: number) => {
    const existing = links.find(l => l.unit_id === unitId);
    if (existing) {
      setFormData({
        payment_system: existing.payment_system,
        payment_link: existing.payment_link,
        recipient_name: existing.recipient_name
      });
    }
    setEditingUnit(unitId);
  };

  if (loading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="CreditCard" size={24} />
            Платежные реквизиты
          </CardTitle>
          <CardDescription>
            Настройте платежные ссылки для каждого объекта. Используйте {'{amount}'} для автоподстановки суммы.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {units.map(unit => {
              const existingLink = links.find(l => l.unit_id === unit.id);
              const isEditing = editingUnit === unit.id;
              
              return (
                <div key={unit.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{unit.name}</h3>
                      <p className="text-sm text-gray-600">{unit.price_per_night} ₽/ночь</p>
                    </div>
                    {!isEditing && (
                      <Button
                        onClick={() => startEdit(unit.id)}
                        variant={existingLink ? "outline" : "default"}
                        size="sm"
                      >
                        <Icon name={existingLink ? "Pencil" : "Plus"} size={16} className="mr-2" />
                        {existingLink ? 'Изменить' : 'Добавить'}
                      </Button>
                    )}
                  </div>

                  {existingLink && !isEditing && (
                    <div className="bg-gray-50 rounded p-3 text-sm space-y-1">
                      <p><strong>Система:</strong> {existingLink.payment_system.toUpperCase()}</p>
                      <p><strong>Получатель:</strong> {existingLink.recipient_name || '—'}</p>
                      <p className="break-all"><strong>Ссылка:</strong> {existingLink.payment_link}</p>
                    </div>
                  )}

                  {isEditing && (
                    <div className="space-y-3 bg-blue-50 p-4 rounded">
                      <div>
                        <Label>Платежная система</Label>
                        <select
                          value={formData.payment_system}
                          onChange={(e) => setFormData({ ...formData, payment_system: e.target.value })}
                          className="w-full mt-1 p-2 border rounded"
                        >
                          <option value="sbp">СБП (Система быстрых платежей)</option>
                          <option value="card">Банковская карта</option>
                          <option value="yoomoney">ЮMoney</option>
                          <option value="qiwi">QIWI</option>
                          <option value="other">Другое</option>
                        </select>
                      </div>

                      <div>
                        <Label>Имя получателя (необязательно)</Label>
                        <Input
                          value={formData.recipient_name}
                          onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                          placeholder="Иван Иванов"
                        />
                      </div>

                      <div>
                        <Label>Платежная ссылка</Label>
                        <Input
                          value={formData.payment_link}
                          onChange={(e) => setFormData({ ...formData, payment_link: e.target.value })}
                          placeholder="https://example.com/pay?amount={amount}&desc={description}"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Пример: https://example.com/pay?sum={'{amount}'}&comment={'{description}'}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={() => savePaymentLink(unit.id)} className="flex-1">
                          <Icon name="Check" size={16} className="mr-2" />
                          Сохранить
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingUnit(null);
                            setFormData({ payment_system: 'sbp', payment_link: '', recipient_name: '' });
                          }}
                          variant="outline"
                        >
                          Отмена
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentLinksManager;