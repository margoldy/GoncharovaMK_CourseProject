import api from './axios';

export const getBalances = () => {
  return api.get('/balances');
};