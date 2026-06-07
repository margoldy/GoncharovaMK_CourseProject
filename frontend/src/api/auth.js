import api from './axios';

export const login = (login, password) => {
  return api.post('/auth/login', { login, password });
};

export const register = (data) => {
  return api.post('/auth/register', data);
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};