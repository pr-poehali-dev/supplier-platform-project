import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import type { Unit } from './UnitsManagement';

interface CreateBookingDialogProps {
  selectedUnit: Unit | null;
  onCreateBooking: (booking: {
    check_in: string;
    check_out: string;
    guest_name: string;
    guest_phone: string;
  }) => Promise<void>;
}

export default function CreateBookingDialog({
  selectedUnit,
  onCreateBooking
}: CreateBookingDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    check_in: '',
    check_out: '',
    guest_name: '',
    guest_phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateBooking(formData);
    setOpen(false);
    setFormData({
      check_in: '',
      check_out: '',
      guest_name: '',
      guest_phone: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm"
          disabled={!selectedUnit}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
        >
          <Icon name="Plus" size={16} className="mr-2" />
          Создать бронь
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Создать бронирование</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="guest_name">Имя гостя *</Label>
            <Input
              id="guest_name"
              value={formData.guest_name}
              onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
              placeholder="Иван Иванов"
              required
            />
          </div>
          <div>
            <Label htmlFor="guest_phone">Телефон</Label>
            <Input
              id="guest_phone"
              value={formData.guest_phone}
              onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
              placeholder="+7 (999) 123-45-67"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="check_in">Дата заезда *</Label>
              <Input
                id="check_in"
                type="date"
                value={formData.check_in}
                onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="check_out">Дата выезда *</Label>
              <Input
                id="check_out"
                type="date"
                value={formData.check_out}
                onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                required
              />
            </div>
          </div>
          {selectedUnit && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p className="text-blue-800">
                <strong>Объект:</strong> {selectedUnit.name}
              </p>
              <p className="text-blue-700 text-xs mt-1">
                Базовая цена: {selectedUnit.base_price} ₽/сутки
              </p>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Отмена
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600">
              Создать
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
