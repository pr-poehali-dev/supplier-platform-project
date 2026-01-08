import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Unit } from './UnitsManagement';

interface BookingDialogProps {
  selectedUnit: Unit | null;
  onCreateBooking: (booking: {
    check_in: string;
    check_out: string;
    guest_name: string;
    guest_phone: string;
  }) => Promise<void>;
}

export default function BookingDialog({ selectedUnit, onCreateBooking }: BookingDialogProps) {
  const [showAddBooking, setShowAddBooking] = useState(false);
  const [newBooking, setNewBooking] = useState({
    check_in: '',
    check_out: '',
    guest_name: '',
    guest_phone: ''
  });

  const handleCreateBooking = async () => {
    await onCreateBooking(newBooking);
    setShowAddBooking(false);
    setNewBooking({ check_in: '', check_out: '', guest_name: '', guest_phone: '' });
  };

  if (!selectedUnit) return null;

  return (
    <Dialog open={showAddBooking} onOpenChange={setShowAddBooking}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Icon name="Plus" className="mr-2" size={16} />
          Создать бронь
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать бронирование</DialogTitle>
          <DialogDescription>
            Добавить новое бронирование для {selectedUnit.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="checkIn">Заезд *</Label>
              <Input
                id="checkIn"
                type="date"
                value={newBooking.check_in}
                onChange={(e) => setNewBooking({...newBooking, check_in: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label htmlFor="checkOut">Выезд *</Label>
              <Input
                id="checkOut"
                type="date"
                value={newBooking.check_out}
                onChange={(e) => setNewBooking({...newBooking, check_out: e.target.value})}
                min={newBooking.check_in || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="guestName">Имя гостя *</Label>
            <Input
              id="guestName"
              placeholder="Иван Иванов"
              value={newBooking.guest_name}
              onChange={(e) => setNewBooking({...newBooking, guest_name: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="guestPhone">Телефон</Label>
            <Input
              id="guestPhone"
              placeholder="+7 (999) 123-45-67"
              value={newBooking.guest_phone}
              onChange={(e) => setNewBooking({...newBooking, guest_phone: e.target.value})}
            />
          </div>
          <Button onClick={handleCreateBooking} className="w-full">
            Создать бронирование
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
