import { useState, useEffect } from 'react';

interface Subscription {
  id: string;
  plan_code: string;
  amount: number;
  status: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  payment_method?: {
    card_type: string;
    card_last4: string;
  };
}

const SUBSCRIPTION_GET_URL = 'https://functions.poehali.dev/578f8247-37f6-47e4-a3ce-744df886fc3f';
const SUBSCRIPTION_CANCEL_URL = 'https://functions.poehali.dev/7f98ad7b-9f7c-4157-a5ab-7ba03dd634e5';
const AUTH_REFRESH_URL = 'https://functions.poehali.dev/16ce90a9-5ba3-4fed-a6db-3e75fe1e7c70?action=refresh';

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSubscription = async () => {
    let accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('auth_refresh_token');
    
    if (!accessToken && !refreshToken) {
      console.warn('No tokens found, skipping subscription fetch');
      return;
    }

    setLoading(true);
    try {
      // Try to refresh token first if we have refresh_token
      if (refreshToken) {
        try {
          const refreshResponse = await fetch(AUTH_REFRESH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
          
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            accessToken = refreshData.access_token;
            localStorage.setItem('access_token', accessToken);
            console.log('Token refreshed successfully before subscription fetch');
          }
        } catch (error) {
          console.warn('Failed to refresh token, using existing:', error);
        }
      }

      if (!accessToken) {
        console.warn('No valid access token after refresh attempt');
        return;
      }

      const response = await fetch(SUBSCRIPTION_GET_URL, {
        method: 'GET',
        headers: {
          'X-Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Subscription fetched:', data.subscription);
        setSubscription(data.subscription);
      } else {
        console.error('Failed to fetch subscription:', response.status, await response.text());
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
    refetch: fetchSubscription,
    cancelSubscription,
  };
}