import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { getDiagnosticsResults, deleteDiagnosticsResult } from '@/utils/diagnosticsStorage';
import { getUserSubscription, getPlanName, getPlanEmoji } from '@/utils/subscription';
import { useState, useEffect } from 'react';

const Profile = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState(getDiagnosticsResults());
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
    }
    setResults(getDiagnosticsResults());
  }, []);

  const subscriptionPlan = getUserSubscription();
  const planName = getPlanName(subscriptionPlan);
  const planEmoji = getPlanEmoji(subscriptionPlan);

  const getSubscriptionExpiryText = () => {
    if (!user?.subscription_expires_at || subscriptionPlan === 'none') return null;
    const expiresAt = new Date(user.subscription_expires_at);
    const now = new Date();
    const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return 'Истекла';
    if (daysLeft === 0) return 'Истекает сегодня';
    if (daysLeft === 1) return 'Истекает завтра';
    if (daysLeft <= 7) return `Осталось ${daysLeft} дней`;
    return `До ${expiresAt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const refreshProfile = () => {
    if (confirm('Для обновления данных нужно перезайти в аккаунт. Продолжить?')) {
      localStorage.removeItem('user');
      navigate('/auth');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Удалить этот результат диагностики?')) {
      deleteDiagnosticsResult(id);
      setResults(getDiagnosticsResults());
    }
  };

  const handleViewResult = (id: string) => {
    const result = results.find(r => r.id === id);
    if (result) {
      navigate('/diagnostics/results', { 
        state: { 
          answers: result.answers,
          savedResult: true,
          savedId: id
        } 
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 gap-2 z-50"
      >
        <Icon name="Home" size={20} />
        На главную
      </Button>
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
            <Icon name="ArrowLeft" className="group-hover:-translate-x-1 transition-transform" size={20} />
            <h1 className="text-2xl font-bold font-heading bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              TourConnect
            </h1>
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold font-heading">Личный кабинет</h1>
                {subscriptionPlan !== 'none' && (
                  <Badge 
                    className={
                      subscriptionPlan === 'start' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg px-4 py-1' :
                      subscriptionPlan === 'pro' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-lg px-4 py-1' :
                      subscriptionPlan === 'business' ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white text-lg px-4 py-1' :
                      'bg-gradient-to-r from-red-500 to-rose-600 text-white text-lg px-4 py-1'
                    }
                  >
                    {planEmoji} {planName}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4">
                <p className="text-gray-600">История ваших диагностик</p>
                {subscriptionPlan !== 'none' && getSubscriptionExpiryText() && (
                  <Badge variant="outline" className="text-xs">
                    <Icon name="Clock" size={12} className="mr-1" />
                    {getSubscriptionExpiryText()}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={refreshProfile}
                variant="outline"
                size="sm"
              >
                <Icon name="RefreshCw" className="mr-2" size={16} />
                Перезайти
              </Button>
              {user?.is_admin && (
                <Button
                  onClick={() => navigate('/admin')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
                >
                  <Icon name="Shield" className="mr-2" size={20} />
                  Админ-панель
                </Button>
              )}
            </div>
          </div>
        </div>

        {results.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="FileText" className="text-gray-400" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Пока нет результатов</h3>
              <p className="text-gray-600 mb-6">Пройдите диагностику, чтобы увидеть результаты здесь</p>
              <Button onClick={() => navigate('/diagnostics')} className="bg-gradient-to-r from-primary to-secondary">
                Пройти диагностику
                <Icon name="ArrowRight" className="ml-2" size={20} />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {results.map((result) => (
              <Card key={result.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-3 mb-2">
                        <Icon name="FileText" size={24} />
                        Диагностика от {formatDate(result.createdAt)}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Icon name="Target" size={16} />
                          Общий балл: {result.totalScore} ({result.totalPercentage}%)
                        </span>
                      </div>
                    </div>
                    <Badge 
                      className={
                        result.totalPercentage >= 70 
                          ? 'bg-green-500' 
                          : result.totalPercentage >= 40 
                          ? 'bg-yellow-500' 
                          : 'bg-red-500'
                      }
                    >
                      {result.totalPercentage >= 70 ? 'Хорошо' : result.totalPercentage >= 40 ? 'Средне' : 'Требует внимания'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {result.blockScores.slice(0, 6).map((block) => (
                      <div
                        key={block.id}
                        className={`p-3 rounded-lg border ${
                          block.level === 'critical'
                            ? 'border-red-200 bg-red-50'
                            : block.level === 'medium'
                            ? 'border-yellow-200 bg-yellow-50'
                            : 'border-green-200 bg-green-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon
                            name={block.icon as any}
                            size={16}
                            className={
                              block.level === 'critical'
                                ? 'text-red-500'
                                : block.level === 'medium'
                                ? 'text-yellow-600'
                                : 'text-green-600'
                            }
                          />
                          <span className="text-xs font-medium">{block.title}</span>
                        </div>
                        <p className="text-sm font-semibold">
                          {block.score}/{block.maxScore}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleViewResult(result.id)}
                      variant="default"
                      className="flex-1 bg-gradient-to-r from-primary to-secondary"
                    >
                      <Icon name="Eye" className="mr-2" size={16} />
                      Посмотреть подробно
                    </Button>
                    <Button 
                      onClick={() => handleDelete(result.id)}
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Icon name="Trash2" size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Icon name="Lightbulb" size={24} />
              Совет
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Проходите диагностику регулярно (раз в 3-6 месяцев), чтобы отслеживать прогресс вашего бизнеса и видеть, как меняются ключевые показатели.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;