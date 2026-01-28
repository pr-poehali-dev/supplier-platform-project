import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const SubscriptionStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const subscriptionId = searchParams.get('subscriptionId');
    const paymentStatus = searchParams.get('status');

    if (!subscriptionId) {
      setStatus('error');
      setMessage('Не найден идентификатор подписки');
      return;
    }

    if (paymentStatus === 'success') {
      setStatus('success');
      setMessage('Подписка успешно активирована!');
      
      setTimeout(() => {
        navigate('/profile');
      }, 3000);
    } else if (paymentStatus === 'error' || paymentStatus === 'cancelled') {
      setStatus('error');
      setMessage('Платёж не завершён. Попробуйте снова.');
    } else {
      setStatus('loading');
      setMessage('Проверяем статус платежа...');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto mb-6"></div>
            <h1 className="text-2xl font-bold mb-2 text-gray-900">{message}</h1>
            <p className="text-gray-600">Пожалуйста, подождите...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="bg-green-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-6">
              <Icon name="Check" size={32} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-gray-900">Подписка активирована!</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-700">
                <Icon name="Check" size={16} className="inline text-green-600 mr-2" />
                Подписка списывается автоматически раз в месяц
              </p>
              <p className="text-sm text-gray-700 mt-2">
                <Icon name="Settings" size={16} className="inline text-blue-600 mr-2" />
                Управлять подпиской можно в профиле
              </p>
            </div>
            <Button
              onClick={() => navigate('/profile')}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
            >
              Перейти в профиль
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="bg-red-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-6">
              <Icon name="X" size={32} className="text-red-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-gray-900">Платёж не завершён</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/pricing')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
              >
                Попробовать снова
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full"
              >
                Вернуться на главную
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SubscriptionStatus;
