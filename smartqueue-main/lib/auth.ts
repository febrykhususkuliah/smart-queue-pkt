import { SessionUser } from './types';

const USER_KEY = 'user';
const TOKEN_KEY = 'authToken';
const EXPIRY_KEY = 'sessionExpiry';

export function saveUserSession(user: SessionUser, rememberMe = false, token?: string) {
  const expiryMs = rememberMe ? 1000 * 60 * 60 * 24 * 7 : 1000 * 60 * 60 * 24;
  const expiresAt = Date.now() + expiryMs;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(EXPIRY_KEY, expiresAt.toString());
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getStoredSession(): { user: SessionUser; expiresAt: number } | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const userText = localStorage.getItem(USER_KEY);
  const expiryText = localStorage.getItem(EXPIRY_KEY);

  if (!userText || !expiryText) {
    return null;
  }

  const expiresAt = Number(expiryText);
  if (Number.isNaN(expiresAt) || expiresAt < Date.now()) {
    clearUserSession();
    return null;
  }

  try {
    const user = JSON.parse(userText) as SessionUser;
    return { user, expiresAt };
  } catch {
    clearUserSession();
    return null;
  }
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

export function clearUserSession() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}
