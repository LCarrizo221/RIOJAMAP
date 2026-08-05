import { validateResponse } from './validate.js';
import { UserSchema, type User } from '../contracts/auth.js';

const API_BASE = '/api';

// Re-export User type for backward compatibility
export type { User };

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
  
  // Backend returns void on success (200/204), but validate if it returns data
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    // If backend returns user data, validate it
    if (data && typeof data === 'object') {
      validateResponse(data, UserSchema);
    }
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
  
  const data = await response.json();
  return validateResponse(data, UserSchema);
}
