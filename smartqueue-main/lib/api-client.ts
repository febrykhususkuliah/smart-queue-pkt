// lib/api-client.ts

import { getAuthToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const API_BASE_PATH = process.env.NEXT_PUBLIC_API_BASE_PATH || '/api';

export const apiClient = {
  async get(endpoint: string) {
    const token = typeof window !== 'undefined' ? getAuthToken() : null;
    const res = await fetch(`${API_URL}${API_BASE_PATH}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return res.json();
  },

  async put(endpoint: string, data: any) {
    const token = typeof window !== 'undefined' ? getAuthToken() : null;
    const res = await fetch(`${API_URL}${API_BASE_PATH}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async post(endpoint: string, data: any) {
    const token = typeof window !== 'undefined' ? getAuthToken() : null;
    const res = await fetch(`${API_URL}${API_BASE_PATH}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};

export default apiClient;
