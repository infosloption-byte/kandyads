const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Request failed');
  }
  return payload;
}

export const api = {
  getDashboardSummary: () => request('/dashboard/summary'),
  listClients: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/clients${query ? `?${query}` : ''}`);
  },
  createClient: (input) => request('/clients', {
    method: 'POST',
    body: JSON.stringify(input),
  }),
};
