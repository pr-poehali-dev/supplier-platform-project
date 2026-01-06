import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [telegramLink, setTelegramLink] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');
    const telegram = params.get('telegram_invite');

    if (error) {
      setStatus('error');
      return;
    }

    if (token) {
      localStorage.setItem('auth_token', token);
      setStatus('success');
      
      if (telegram) {
        setTelegramLink(telegram);
      } else {
        setTimeout(() => navigate('/simulator'), 2000);
      }
    } else {
      setStatus('error');
    }
  }, [navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-none shadow-2xl">
          <CardContent className="pt-6 text-center space-y-4">
            <Icon name="Loader2" className="mx-auto animate-spin text-primary" size={48} />
            <h2 className="text-2xl font-bold">Вход в систему...</h2>
            <p className="text-gray-600">Пожалуйста, подождите</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-none shadow-2xl">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Icon name="AlertCircle" className="text-red-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold">Ошибка авторизации</h2>
            <p className="text-gray-600">Не удалось войти в систему. Попробуйте еще раз.</p>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Вернуться к входу
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-none shadow-2xl">
        <CardContent className="pt-6 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Icon name="CheckCircle" className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold">Добро пожаловать!</h2>
          <p className="text-gray-600">Вы успешно вошли в систему</p>
          
          {telegramLink ? (
            <div className="space-y-4 pt-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center mb-3">
                  <Icon name="Send" className="text-blue-600" size={24} />
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  Присоединяйтесь к нашему Telegram каналу, чтобы получать актуальные новости, советы и общаться с сообществом предпринимателей!
                </p>
                <Button
                  onClick={() => {
                    window.open(telegramLink, '_blank');
                    setTimeout(() => navigate('/simulator'), 1000);
                  }}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                >
                  <Icon name="Send" className="mr-2" size={20} />
                  Перейти в Telegram
                </Button>
              </div>
              <Button
                onClick={() => navigate('/simulator')}
                variant="outline"
                className="w-full"
              >
                Пропустить и перейти к калькулятору
              </Button>
            </div>
          ) : (
            <Button onClick={() => navigate('/simulator')} className="w-full">
              Перейти к калькулятору
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;
