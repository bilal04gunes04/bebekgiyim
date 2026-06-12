import api from '../utils/api';

export const productService = {
  getProducts: (params = {}) => api.get('/products', { params }),
  getProduct: (slug) => api.get(`/products/${slug}`),
  getFeatured: () => api.get('/products/featured'),
  getNewArrivals: () => api.get('/products/new-arrivals'),
  getByCategory: (slug, params = {}) => api.get(`/products/category/${slug}`, { params }),
  search: (query, params = {}) => api.get('/products/search', { params: { ...params, search: query } }),
  getReviews: (productId) => api.get(`/products/${productId}/reviews`),
  addReview: (productId, data) => api.post(`/products/${productId}/reviews`, data),
};
