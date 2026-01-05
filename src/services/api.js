import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001', // Your backend server
  withCredentials: true,            // ✅ Send cookies
});

export const handleRegister = async (userData) => {
  try {
    const res = await api.post('/auth/register', userData);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || 'Registration failed';
  }
};

export const handleLogin = async (email, password) => {
  try {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || 'Login failed';
  }
};
export const getCurrentUser = async () => {
  try {
    const res = await api.get('/auth/protected');
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || 'Not authenticated';
  }
};
export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout failed:', error);
  }
};