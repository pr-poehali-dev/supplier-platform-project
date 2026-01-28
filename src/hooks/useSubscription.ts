import { useState, useEffect } from 'react';

interface Subscription {
  id: string;
  plan_code: string;
  amount: number;
  status: string;
  current_period_end?: string;
  payment_method?: {
    card_type: string;
    card_last4: string;
  };
}

const SUBSCRIPTION_GET_URL = 'https://functions.poehali.dev/578f8247-37f6-47e4-a3ce-744df886fc3f';
const SUBSCRIPTION_CANCEL_URL = 'https://functions.poehali.dev/7f98ad7b-9f7c-4157-a5ab-7ba03dd634e5';

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSubscription = async () => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await fetch(SUBSCRIPTION_GET_URL, {
        method: 'GET',
        headers: {
          'X-Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      } else {
        console.error('Failed to fetch subscription:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (subscriptionId: string) => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(SUBSCRIPTION_CANCEL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        subscription_id: subscriptionId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel subscription');
    }

    return response.json();
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  return {
    subscription,
    loading,
    fetchSubscription,
    cancelSubscription,
  };
}