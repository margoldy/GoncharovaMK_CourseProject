import api from './axios';

export const getAllMembers = () => {
  return api.get('/members');
};

export const createMember = (data) => {
  return api.post('/members', data);
};

export const approveMember = (id) => {
  return api.put(`/members/${id}/approve`);
};

export const rejectMember = (id) => {
  return api.delete(`/members/${id}/reject`);
};

export const deleteMember = (id) => {
  return api.delete(`/members/${id}`);
};

export const updateMemberRole = (id, role) => {
  return api.patch(`/members/${id}/role`, { role });
};

export const importMembers = (data) => {
  return api.post('/members/import', data);
};