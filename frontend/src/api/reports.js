import api from './axios';

// Получить отчёт за период
export const getReport = (from, to) => {
  return api.get('/reports', { params: { from, to } });
};