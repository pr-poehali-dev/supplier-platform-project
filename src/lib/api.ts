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

export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const user = getUser();
  
  if (!user) {
    console.error('fetchWithAuth: User not found in localStorage');
    throw new Error('User not authenticated');
  }

  console.log('fetchWithAuth: Making request with owner_id:', user.id);

  const headers = {
    ...options.headers,
    'X-Owner-Id': user.id.toString(),
  };

  return fetch(url, {
    ...options,
    headers,
  });
};