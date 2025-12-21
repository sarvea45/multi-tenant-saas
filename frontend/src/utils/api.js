import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Browser accesses localhost
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // Optional: Redirect to login logic here if needed
    }
    return Promise.reject(error);
  }
);

export default api; 