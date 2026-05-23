import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const url = error.config?.url || '';
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/verify-otp') || url.includes('/auth/refresh') || url.includes('/auth/trial-signup');

    // Handle disabled/expired client — from middleware or login route
    if (error.response?.status === 403) {
      const code = error.response?.data?.code;
      const msg = error.response?.data?.error;
      if (code === 'DISABLED' || code === 'EXPIRED' || msg?.includes('Service disabled') || msg?.includes('Trial expired')) {
        localStorage.setItem('account_blocked', msg || 'Account suspended. Contact admin.');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        if (!window.location.pathname.includes('/blocked')) {
          window.location.href = '/blocked';
        }
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 401 && !isAuthRoute && !error.config._retry) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        error.config._retry = true;
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken });
          localStorage.setItem('token', data.token);
          error.config.headers.Authorization = `Bearer ${data.token}`;
          return axios(error.config);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export { api };
export default api;
