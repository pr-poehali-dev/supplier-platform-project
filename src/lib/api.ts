export interface User {
  id: number;
  email: string;
  full_name?: string;
  provider?: string;
  subscription_plan?: string;
  subscription_expires_at?: string;
}

export const getUser = (): User | null => {
  const userStr = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null;
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
};

const AUTH_URL = 'https://functions.poehali.dev/16ce90a9-5ba3-4fed-a6db-3e75fe1e7c70';

export const refreshUserProfile = async (): Promise<void> => {
  const user = getUser();
  if (!user) return;

  try {
    const response = await fetch(`${AUTH_URL}?action=refresh_profile`, {
      headers: {
        'X-User-Id': user.id.toString(),
      },
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('user', JSON.stringify(data.user));
      console.log('User profile refreshed:', data.user.subscription_plan);
    }
  } catch (error) {
    console.error('Failed to refresh user profile:', error);
  }
};

export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    console.error('No refresh token found');
    return null;
  }

  try {
    const response = await fetch(`${AUTH_URL}?action=refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      
      // Обновить профиль пользователя после обновления токена
      await refreshUserProfile();
      
      return data.access_token;
    } else {
      console.error('Failed to refresh token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/';
      return null;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<any> => {
  const accessToken = localStorage.getItem('access_token');
  
  if (!accessToken) {
    console.error('fetchWithAuth: No access token found');
    throw new Error('User not authenticated');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    'X-Authorization': `Bearer ${accessToken}`,
  };

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // If token expired, try to refresh
  if (response.status === 401) {
    console.log('Token expired, attempting to refresh...');
    const newToken = await refreshAccessToken();
    
    if (newToken) {
      // Retry request with new token
      const newHeaders = {
        ...headers,
        'X-Authorization': `Bearer ${newToken}`,
      };
      
      response = await fetch(url, {
        ...options,
        headers: newHeaders,
      });
    }
  }

  // Parse JSON response
  if (response.ok) {
    return response.json();
  } else {
    const error = await response.text();
    throw new Error(`API Error ${response.status}: ${error}`);
  }
};