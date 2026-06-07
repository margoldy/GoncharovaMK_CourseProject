import api from './axios';

export const getAllIncomes = () => {
  return api.get('/incomes');
};

export const getMyIncomes = () => {
  return api.get('/incomes/my');
};

export const createIncome = (data) => {
  return api.post('/incomes', data);
};

export const deleteIncome = (id) => {
  return api.delete(`/incomes/${id}`);
};

export const getIncomeTypes = () => {
  return api.get('/incomes/types');
};