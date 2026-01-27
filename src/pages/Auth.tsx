import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { LoginForm } from '@/components/extensions/auth-email/LoginForm';
import { RegisterForm } from '@/components/extensions/auth-email/RegisterForm';
import { ResetPasswordForm } from '@/components/extensions/auth-email/ResetPasswordForm';
import { useAuth } from '@/components/extensions/auth-email/useAuth';

const AUTH_URL = 'https://functions.poehali.dev/d538ced0-a6f6-4224-b438-b70de2029bd9';

type View = 'login' | 'register' | 'reset';

const Auth = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('login');
  const [isYandexLoading, setIsYandexLoading] = useState(false);

  const auth = useAuth({
    apiUrls: {
      login: `${AUTH_URL}?action=login`,
      register: `${AUTH_URL}?action=register`,
      verifyEmail: `${AUTH_URL}?action=verify-email`,
      refresh: `${AUTH_URL}?action=refresh`,
      logout: `${AUTH_URL}?action=logout`,
      resetPassword: `${AUTH_URL}?action=reset-password`,
    },
  });

  const handleYandexAuth = () => {
    setIsYandexLoading(true);
    const yandexAuthUrl = 'https://functions.poehali.dev/16ce90a9-5ba3-4fed-a6db-3e75fe1e7c70';
    window.location.href = yandexAuthUrl;
  };

  const handleSuccess = () => {
    navigate('/profile');
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

      <div className="w-full max-w-md space-y-4">
        {view === 'login' && (
          <>
            <Card className="border-none shadow-2xl">
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
                  Войдите, чтобы получить доступ к инструментам управления
                </CardDescription>
              </CardHeader>
            </Card>

            <LoginForm
              onLogin={auth.login}
              onSuccess={handleSuccess}
              onRegisterClick={() => setView('register')}
              onForgotPasswordClick={() => setView('reset')}
              error={auth.error}
              isLoading={auth.isLoading}
              className="border-none shadow-2xl"
            />

            <Card className="border-none shadow-xl">
              <CardContent className="pt-6 space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">или</span>
                  </div>
                </div>

                <Button
                  onClick={handleYandexAuth}
                  disabled={isYandexLoading}
                  className="w-full h-12 bg-[#FC3F1D] hover:bg-[#E63619] text-white text-lg"
                >
                  {isYandexLoading ? (
                    <Icon name="Loader2" className="mr-2 animate-spin" size={20} />
                  ) : (
                    <svg className="mr-2" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.88 14.77h-2.13V9.23h-1.48V7.46h1.48V6.54c0-1.48.61-2.36 2.36-2.36h1.45v1.77h-.91c-.68 0-.72.25-.72.73v1.78h1.66l-.19 1.77h-1.47v7.54z"/>
                    </svg>
                  )}
                  Войти через Яндекс
                </Button>

                <div className="text-center text-sm text-gray-500 pt-2">
                  Нажимая кнопку входа, вы соглашаетесь с обработкой персональных данных
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {view === 'register' && (
          <RegisterForm
            onRegister={auth.register}
            onVerifyEmail={auth.verifyEmail}
            onLogin={auth.login}
            onSuccess={handleSuccess}
            onLoginClick={() => setView('login')}
            error={auth.error}
            isLoading={auth.isLoading}
            className="border-none shadow-2xl"
          />
        )}

        {view === 'reset' && (
          <ResetPasswordForm
            onRequestReset={auth.requestPasswordReset}
            onResetPassword={auth.resetPassword}
            onBackToLogin={() => setView('login')}
            error={auth.error}
            isLoading={auth.isLoading}
            className="border-none shadow-2xl"
          />
        )}
      </div>
    </div>
  );
};

export default Auth;
