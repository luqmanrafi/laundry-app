import axios from 'axios';

const client = axios.create({
  // Menggunakan Environment Variable (Standar Industri)
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api', 
});

// Request interceptor untuk menambahkan token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor untuk handle 401 Unauthorized
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
