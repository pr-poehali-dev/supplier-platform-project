import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

interface UnitFormData {
  name: string;
  type: string;
  description: string;
  base_price: string;
  max_guests: string;
  photo_urls?: string[];
  map_link?: string;
}

interface UnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: UnitFormData;
  onUnitChange: (unit: UnitFormData) => void;
  onSave: () => void;
  title: string;
  description: string;
}

export default function UnitDialog({ open, onOpenChange, unit, onUnitChange, onSave, title, description }: UnitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="unitName">Название *</Label>
            <Input
              id="unitName"
              placeholder="Домик №1"
              value={unit.name}
              onChange={(e) => onUnitChange({ ...unit, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="unitType">Тип</Label>
            <select
              id="unitType"
              className="w-full p-2 border rounded-md"
              value={unit.type}
              onChange={(e) => onUnitChange({ ...unit, type: e.target.value })}
            >
              <option value="house">Домик</option>
              <option value="room">Номер</option>
              <option value="bathhouse">Баня</option>
            </select>
          </div>
          <div>
            <Label htmlFor="unitDescription">Описание для клиентов</Label>
            <Textarea
              id="unitDescription"
              placeholder="Уютный домик с видом на лес. 2 спальни, кухня, терраса с мангалом."
              value={unit.description}
              onChange={(e) => onUnitChange({ ...unit, description: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <Label>Фото объекта (до 3 штук)</Label>
            <p className="text-xs text-gray-500 mb-2">Вставьте URL фотографий</p>
            <div className="space-y-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="space-y-1">
                  <Input
                    placeholder={`https://example.com/photo${index + 1}.jpg`}
                    value={(unit.photo_urls || [])[index] || ''}
                    onChange={(e) => {
                      const urls = [...(unit.photo_urls || [])];
                      urls[index] = e.target.value;
                      onUnitChange({ ...unit, photo_urls: urls.filter(url => url.trim()) });
                    }}
                  />
                  {(unit.photo_urls || [])[index] && (unit.photo_urls || [])[index].trim() && (
                    <div className="relative w-full h-32 rounded-md overflow-hidden border border-gray-200">
                      <img
                        src={(unit.photo_urls || [])[index]}
                        alt={`Фото ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="flex items-center justify-center h-full bg-gray-100 text-gray-500 text-sm">Ошибка загрузки изображения</div>';
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="unitMapLink">Ссылка на карты</Label>
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <Input
                  id="unitMapLink"
                  placeholder="https://yandex.ru/maps/..."
                  value={unit.map_link || ''}
                  onChange={(e) => onUnitChange({ ...unit, map_link: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Яндекс.Карты, Google Maps или 2GIS</p>
              </div>
              {unit.map_link && (
                <a href={unit.map_link} target="_blank" rel="noopener noreferrer" className="mt-1">
                  <Icon name="ExternalLink" size={20} className="text-blue-600" />
                </a>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unitPrice">Цена за ночь *</Label>
              <Input
                id="unitPrice"
                type="number"
                placeholder="5000"
                value={unit.base_price}
                onChange={(e) => onUnitChange({ ...unit, base_price: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="unitGuests">Макс. гостей *</Label>
              <Input
                id="unitGuests"
                type="number"
                placeholder="4"
                value={unit.max_guests}
                onChange={(e) => onUnitChange({ ...unit, max_guests: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={onSave} className="w-full">
            Сохранить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}