import API_URL from '../config';

const API_BASE_URL = API_URL;

const getAuthHeaders = (extraHeaders = {}) => {
  const token = localStorage.getItem('token');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
};

const request = async (method, endpoint, body = null) => {
  const options = {
    method,
    credentials: 'include',
    headers: getAuthHeaders(),
  };

  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `HTTP error! status: ${response.status}`);
  }

  return data;
};

export const api = {
  get: async (endpoint) => request('GET', endpoint),
  post: async (endpoint, data) => request('POST', endpoint, data),
  put: async (endpoint, data) => request('PUT', endpoint, data),
  delete: async (endpoint) => request('DELETE', endpoint),
};

export default api;
