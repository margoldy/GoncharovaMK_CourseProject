import api from './axios';

export const getAllExpenses = () => {
  return api.get('/expenses');
};

export const getMyExpenses = () => {
  return api.get('/expenses/my');
};

export const createExpense = (data) => {
  return api.post('/expenses', data);
};

export const executePlannedExpense = (id) => {
  return api.put(`/expenses/${id}/execute`);
};

export const deleteExpense = (id) => {
  return api.delete(`/expenses/${id}`);
};

export const getCategories = () => {
  return api.get('/expenses/categories');
};