import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { getDiagnosticsResults, deleteDiagnosticsResult } from '@/utils/diagnosticsStorage';
import { getUserSubscription, getPlanName, getPlanEmoji } from '@/utils/subscription';
import { useState, useEffect } from 'react';
import UserInfoCard from '@/components/profile/UserInfoCard';
import DiagnosticsHistory from '@/components/profile/DiagnosticsHistory';
import UserProfile from '@/components/navigation/UserProfile';
import SubscriptionCard from '@/components/subscription/SubscriptionCard';
import { useSubscription } from '@/hooks/useSubscription';

const Profile = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState(getDiagnosticsResults());
  const [user, setUser] = useState<any>(null);
  const { subscription, cancelSubscription, refetch } = useSubscription();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
    }
    setResults(getDiagnosticsResults());
  }, []);

  // Get subscription plan from API or fallback to localStorage
  const subscriptionPlan = subscription?.plan_code || getUserSubscription();
  const planName = getPlanName(subscriptionPlan as any);
  const planEmoji = getPlanEmoji(subscriptionPlan as any);

  const getSubscriptionExpiryText = () => {
    if (!subscription?.current_period_end || subscriptionPlan === 'none') return null;
    const expiresAt = new Date(subscription.current_period_end);
    const now = new Date();
    const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return 'Истекла';
    if (daysLeft === 0) return 'Истекает сегодня';
    if (daysLeft === 1) return 'Истекает завтра';
    if (daysLeft <= 7) return `Осталось ${daysLeft} дней`;
    return `До ${expiresAt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    
    if (!confirm('Вы уверены? Подписка будет отменена в конце текущего периода.')) {
      return;
    }

    try {
      await cancelSubscription(subscription.id);
      alert('✅ Подписка будет отменена в конце периода');
      window.location.reload();
    } catch (error: any) {
      alert('❌ ' + (error.message || 'Ошибка при отмене подписки'));
    }
  };

  const refreshProfile = async () => {
    try {
      await refetch();
      alert('✅ Данные подписки обновлены!');
    } catch (error) {
      alert('❌ Ошибка при обновлении данных.');
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
      
      <div className="fixed top-4 right-4 z-50">
        <UserProfile user={user} />
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">Профиль</h1>
          
          <div className="space-y-6">
            <UserInfoCard
              user={user}
              planName={planName}
              planEmoji={planEmoji}
              expiryText={getSubscriptionExpiryText()}
              onRefresh={refreshProfile}
              onNavigatePricing={() => navigate('/pricing')}
            />

            <SubscriptionCard
              subscription={subscription}
              onCancel={handleCancelSubscription}
              onChangePlan={() => navigate('/pricing')}
            />

            <DiagnosticsHistory
              results={results}
              onView={handleViewResult}
              onDelete={handleDelete}
              formatDate={formatDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;