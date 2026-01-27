import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface PricingCardProps {
  id: string;
  name: string;
  price: number;
  emoji: string;
  description: string;
  limits: string;
  features: string[];
  popular: boolean;
  color: string;
  selected: boolean;
  isCurrent: boolean;
  onSelect: () => void;
}

export default function PricingCard({
  name,
  price,
  emoji,
  description,
  limits,
  features,
  popular,
  color,
  selected,
  isCurrent,
  onSelect
}: PricingCardProps) {
  return (
    <Card className={`relative overflow-hidden transition-all duration-300 ${
      selected ? 'ring-4 ring-primary shadow-2xl scale-105' : 'hover:shadow-xl'
    } ${popular ? 'border-2 border-primary' : ''}`}>
      {popular && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 text-sm font-bold">
          Популярный
        </div>
      )}
      {isCurrent && (
        <Badge className="absolute top-4 left-4 bg-green-500">
          <Icon name="Check" size={14} className="mr-1" />
          Ваш тариф
        </Badge>
      )}
      <CardContent className="p-8 pt-12">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{emoji}</div>
          <h3 className="text-2xl font-bold mb-2">{name}</h3>
          <p className="text-gray-600 mb-4">{description}</p>
          <div className="mb-4">
            <span className={`text-4xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
              {price.toLocaleString('ru-RU')} ₽
            </span>
            <span className="text-gray-600 ml-2">/мес</span>
          </div>
          <Badge variant="outline" className="mb-6">
            {limits}
          </Badge>
        </div>

        <ul className="space-y-3 mb-8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Icon name="Check" size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          onClick={onSelect}
          className={`w-full ${selected ? `bg-gradient-to-r ${color}` : 'bg-gray-900'} hover:opacity-90`}
          size="lg"
        >
          {selected ? 'Выбрано' : isCurrent ? 'Продлить' : 'Выбрать тариф'}
        </Button>
      </CardContent>
    </Card>
  );
}