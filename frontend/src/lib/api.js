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

  signup: (name, email, password, organizationCode) =>
    apiFetch('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, organizationCode }),
    }),

  signupOrg: (orgName, orgCode, name, email, password) =>
    apiFetch('/api/v1/auth/register-organization', {
      method: 'POST',
      body: JSON.stringify({ orgName, orgCode, name, email, password }),
    }),

  me: () => apiFetch('/api/v1/auth/me'),

  forgotPassword: (email) =>
    apiFetch('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};

export const assetApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/api/v1/assets${qs ? `?${qs}` : ''}`);
  },

  create: (data) =>
    apiFetch('/api/v1/assets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (id) => apiFetch(`/api/v1/assets/${id}`),

  update: (id, data) =>
    apiFetch(`/api/v1/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    apiFetch(`/api/v1/assets/${id}`, { method: 'DELETE' }),
};

export const bookingApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/api/v1/bookings${qs ? `?${qs}` : ''}`);
  },

  create: (data) =>
    apiFetch('/api/v1/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (id) => apiFetch(`/api/v1/bookings/${id}`),

  cancel: (id) =>
    apiFetch(`/api/v1/bookings/${id}/cancel`, { method: 'PATCH' }),
};

export const transferApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/api/v1/transfers${qs ? `?${qs}` : ''}`);
  },

  create: (data) =>
    apiFetch('/api/v1/transfers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (id) => apiFetch(`/api/v1/transfers/${id}`),

  approve: (id) =>
    apiFetch(`/api/v1/transfers/${id}/approve`, { method: 'PATCH' }),

  reject: (id, reason) =>
    apiFetch(`/api/v1/transfers/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ rejectionReason: reason }),
    }),

  cancel: (id) =>
    apiFetch(`/api/v1/transfers/${id}/cancel`, { method: 'PATCH' }),
};

export const auditApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/api/v1/audits${qs ? `?${qs}` : ''}`);
  },

  create: (data) =>
    apiFetch('/api/v1/audits', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (id) => apiFetch(`/api/v1/audits/${id}`),

  close: (id) =>
    apiFetch(`/api/v1/audits/${id}/close`, { method: 'POST' }),

  addItem: (auditId, data) =>
    apiFetch(`/api/v1/audits/${auditId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateItem: (auditId, itemId, data) =>
    apiFetch(`/api/v1/audits/${auditId}/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

export const reportApi = {
  export: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/api/v1/reports/export${qs ? `?${qs}` : ''}`);
  },

  dashboardStats: () => apiFetch('/api/v1/reports/dashboard-stats'),
};

export const maintenanceApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/api/v1/maintenance${qs ? `?${qs}` : ''}`);
  },

  create: (data) =>
    apiFetch('/api/v1/maintenance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (id) => apiFetch(`/api/v1/maintenance/${id}`),

  update: (id, data) =>
    apiFetch(`/api/v1/maintenance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateStatus: (id, status) =>
    apiFetch(`/api/v1/maintenance/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

export const allocationApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/api/v1/allocations${qs ? `?${qs}` : ''}`);
  },

  create: (data) =>
    apiFetch('/api/v1/allocations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  return: (id) =>
    apiFetch(`/api/v1/allocations/${id}/return`, { method: 'POST' }),
};
