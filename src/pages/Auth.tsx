import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const Auth = () => {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleAuth = (provider: 'vk' | 'yandex' | 'google') => {
    setIsLoading(provider);
    const redirectUri = `${window.location.origin}/auth/callback`;
    window.location.href = `/api/auth/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 flex items-center justify-center px-4">
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

          <Button
            onClick={() => handleAuth('google')}
            disabled={isLoading !== null}
            className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 text-lg"
          >
            {isLoading === 'google' ? (
              <Icon name="Loader2" className="mr-2 animate-spin" size={20} />
            ) : (
              <svg className="mr-2" width="24" height="24" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Войти через Google
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
