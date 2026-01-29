export interface User {
  id: number;
  email: string;
  full_name?: string;
  provider?: string;
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

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Parse JSON response
  if (response.ok) {
    return response.json();
  } else {
    const error = await response.text();
    throw new Error(`API Error ${response.status}: ${error}`);
  }
};