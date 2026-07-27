const API_BASE = '/api';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
}

export async function loginApi(email: string, password: string): Promise<void> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Login failed');
  }
}

export async function logoutApi(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function getMe(): Promise<User> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Not authenticated');
  }
  
  return response.json();
}
