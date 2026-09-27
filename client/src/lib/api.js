const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function api(path, options = {}) {
  const token = localStorage.getItem('atlassi-token');
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Something went wrong.');
  return payload;
}

export const auth = { register: (data) => api('/auth/register', { method: 'POST', body: JSON.stringify(data) }), login: (data) => api('/auth/login', { method: 'POST', body: JSON.stringify(data) }), verify: (code) => api('/auth/verify-phone', { method: 'POST', body: JSON.stringify({ code }) }), me: () => api('/auth/me') };
