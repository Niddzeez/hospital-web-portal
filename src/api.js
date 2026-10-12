const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('dd_token');
  const response = await fetch(`${apiBase}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  hospitals: () => request('/hospitals'),
  patients: (hospitalId) => request(`/hospitals/${hospitalId}/patient-relationships`),
  invite: (hospitalId, payload) => request(`/hospitals/${hospitalId}/invitations`, { method: 'POST', body: JSON.stringify(payload) }),
  acceptInvite: (token, password, phone) => request('/hospitals/invitations/accept', { method: 'POST', body: JSON.stringify({ token, password, phone }) }),
};
