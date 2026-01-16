import { useEffect } from 'react';
import { fetchWithAuth } from '@/lib/api';

const AUTH_API = 'https://functions.poehali.dev/16ce90a9-5ba3-4fed-a6db-3e75fe1e7c70';

export const useAutoRefreshUser = () => {
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    const userData = JSON.parse(userStr);
    
    const shouldRefresh = 
      !userData.subscription_plan || 
      userData.subscription_plan === 'none' ||
      !userData.subscription_expires_at;

    if (shouldRefresh) {
      fetchWithAuth(`${AUTH_API}?action=refresh`)
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        })
        .catch(() => {});
    }
  }, []);
};