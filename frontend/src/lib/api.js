const API_URL = import.meta.env.VITE_API_URL || '';

const TOKEN_KEY = 'assetflow_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function parseResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.message || 'Request failed');
    error.status = res.status;
    throw error;
  }
  return data;
}

export async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  return parseResponse(res);
}

export const authApi = {
  login: (email, password) =>
    apiFetch('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  signup: (name, email, password) =>
    apiFetch('/api/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  me: () => apiFetch('/api/v1/auth/me'),

  forgotPassword: (email) =>
    apiFetch('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};
