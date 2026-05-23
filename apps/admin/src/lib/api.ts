import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000/api/super-admin' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use((r) => r, (err) => {
  if (err.response?.status === 401 && !err.config?.url?.includes('/login')) {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/login';
  }
  return Promise.reject(err);
});

export default api;
