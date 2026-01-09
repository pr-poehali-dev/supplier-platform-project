import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleAuth = (provider: 'vk' | 'yandex' | 'google') => {
    setIsLoading(provider);
    const authUrl = 'https://functions.poehali.dev/16ce90a9-5ba3-4fed-a6db-3e75fe1e7c70';
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 flex items-center justify-center px-4">
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 gap-2 z-50"
      >
        <Icon name="Home" size={20} />
        На главную
      </Button>
      <Card className="w-full max-w-md border-none shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-4">
            <Icon name="Lock" className="text-white" size={32} />
          </div>
          <CardTitle className="text-3xl font-bold font-heading">
            Добро пожаловать в{' '}
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              TourConnect
            </span>
          </CardTitle>
          <CardDescription className="text-base">
            Войдите, чтобы получить доступ к калькулятору бизнеса и сообществу предпринимателей
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => handleAuth('vk')}
            disabled={isLoading !== null}
            className="w-full h-12 bg-[#0077FF] hover:bg-[#0066DD] text-white text-lg"
          >
            {isLoading === 'vk' ? (
              <Icon name="Loader2" className="mr-2 animate-spin" size={20} />
            ) : (
              <svg className="mr-2" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.785 16.241s.288-.032.435-.189c.136-.145.131-.417.131-.417s-.019-1.271.57-1.458c.581-.184 1.327 1.228 2.117 1.772.598.411 1.053.321 1.053.321l2.116-.03s1.106-.068.582-.937c-.043-.071-.306-.645-1.575-1.825-1.328-1.235-1.15-1.035.449-3.171.974-1.3 1.363-2.094 1.242-2.433-.115-.324-.829-.238-.829-.238l-2.382.015s-.177-.024-.308.054c-.128.077-.21.257-.21.257s-.376.999-.877 1.85c-1.058 1.794-1.482 1.889-1.656 1.777-.404-.262-.303-1.053-.303-1.615 0-1.755.266-2.488-.519-2.678-.261-.063-.453-.105-1.121-.112-.857-.009-1.583.003-1.994.204-.274.134-.485.432-.356.449.159.021.519.097.71.357.247.336.238 1.09.238 1.09s.142 2.067-.331 2.324c-.325.176-.77-.183-1.726-1.825-.489-.835-.859-1.76-.859-1.76s-.071-.174-.198-.267c-.154-.113-.37-.149-.37-.149l-2.263.014s-.34.01-.465.157c-.111.131-.009.402-.009.402s1.76 4.117 3.752 6.194c1.828 1.906 3.902 1.78 3.902 1.78h.947z"/>
              </svg>
            )}
            Войти через ВКонтакте
          </Button>

          <Button
            onClick={() => handleAuth('yandex')}
            disabled={isLoading !== null}
            className="w-full h-12 bg-[#FC3F1D] hover:bg-[#E63619] text-white text-lg"
          >
            {isLoading === 'yandex' ? (
              <Icon name="Loader2" className="mr-2 animate-spin" size={20} />
            ) : (
              <svg className="mr-2" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.88 14.77h-2.13V9.23h-1.48V7.46h1.48V6.54c0-1.48.61-2.36 2.36-2.36h1.45v1.77h-.91c-.68 0-.72.25-.72.73v1.78h1.66l-.19 1.77h-1.47v7.54z"/>
              </svg>
            )}
            Войти через Яндекс
          </Button>

          <div className="text-center text-sm text-gray-500 pt-4">
            Нажимая кнопку входа, вы соглашаетесь с обработкой персональных данных
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;