import api from './axios';

export const getAllTransfers = () => {
  return api.get('/transfers');
};

export const getMyTransfers = () => {
  return api.get('/transfers/my');
};

export const createTransfer = (data) => {
  return api.post('/transfers', data);
};

export const deleteTransfer = (id) => {
  return api.delete(`/transfers/${id}`);
};