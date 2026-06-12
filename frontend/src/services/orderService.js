import api from '../utils/api';

export const orderService = {
  createOrder: (data) => api.post('/orders', data),
  getOrders: (params = {}) => api.get('/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id) => api.put(`/orders/${id}/cancel`),
};
