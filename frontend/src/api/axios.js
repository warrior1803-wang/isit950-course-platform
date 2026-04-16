import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(null, error => {
  const requestUrl = String(error.config?.url || '');
  const isAuthRequest =
    requestUrl.includes('/auth/login') ||
    requestUrl.includes('/auth/register');

  // Let login/register handle invalid credentials locally instead of forcing
  // a hard redirect back to the same page, which looks like a refresh.
  if (error.response?.status === 401 && !isAuthRequest) {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
  }
  return Promise.reject(error);
});

export default api;
