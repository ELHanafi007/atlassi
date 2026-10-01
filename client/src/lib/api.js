const API_URL = import.meta.env.VITE_API_URL || '/api';

export async function api(path, options = {}) {
  const token = localStorage.getItem('atlassi-token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const cleanBase = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${cleanBase}${cleanPath}`, {
    ...options,
    headers
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Something went wrong.');
  }
  return payload;
}

export const auth = {
  register: (data) => api('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => api('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => api('/auth/me'),
  logout: () => api('/auth/logout', { method: 'POST' }),
  verifyPhone: (code) => api('/auth/verify-phone', { method: 'POST', body: JSON.stringify({ code }) })
};

export const listingsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });
    const queryString = query.toString();
    return api(`/listings${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => api(`/listings/${id}`),
  create: (data) => api('/listings', { method: 'POST', body: JSON.stringify(data) }),
  getMyListings: () => api('/me/listings'),
  updateStatus: (id, status) => api(`/listings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
};

export const offersApi = {
  create: (listingId, data) => api(`/listings/${listingId}/offers`, { method: 'POST', body: JSON.stringify(data) }),
  getMyOffers: () => api('/me/offers'),
  getReceivedOffers: () => api('/me/received-offers'),
  updateStatus: (id, status, ownerResponse) => api(`/offers/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, ownerResponse }) })
};

export const favoritesApi = {
  toggle: (listingId) => api(`/favorites/${listingId}`, { method: 'POST' }),
  getAll: () => api('/me/favorites')
};

export const requestsApi = {
  create: (data) => api('/requests', { method: 'POST', body: JSON.stringify(data) }),
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api(`/requests${query ? `?${query}` : ''}`);
  }
};

export const inquiriesApi = {
  send: (listingId, message) => api(`/listings/${listingId}/inquire`, { method: 'POST', body: JSON.stringify({ message }) })
};
