import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

const PaymentFail = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-orange-50/30 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full border-none shadow-2xl">
        <CardContent className="p-12 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center mx-auto mb-6">
            <Icon name="XCircle" className="text-red-600" size={56} />
          </div>
          
          <Badge className="mb-4 bg-red-50 text-red-700 border-red-200">
            ❌ Ошибка оплаты
          </Badge>
          
          <h1 className="text-4xl font-bold font-heading mb-4">
            Платёж не прошёл
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            К сожалению, не удалось провести оплату. Возможно, недостаточно средств на карте или возникла техническая ошибка.
          </p>
          
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4 text-left">
              <Icon name="Info" className="text-blue-600 flex-shrink-0 mt-1" size={24} />
              <div className="text-sm text-gray-700">
                <h3 className="font-semibold mb-2">Что можно сделать:</h3>
                <ul className="space-y-1">
                  <li>• Проверьте баланс карты</li>
                  <li>• Убедитесь, что данные карты введены правильно</li>
                  <li>• Попробуйте другую карту</li>
                  <li>• Свяжитесь с банком для уточнения</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              onClick={() => navigate('/pricing')}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              Попробовать снова
              <Icon name="ArrowRight" className="ml-2" size={20} />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/')}
            >
              На главную
            </Button>
          </div>

          <p className="text-sm text-gray-500 mt-8">
            Нужна помощь? <a href="/#contact" className="text-primary hover:underline">Напишите нам</a>, и мы поможем разобраться
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentFail;
