import api from '../utils/api';

export const categoryService = {
  getCategories: () => api.get('/categories'),
  getCategory: (slug) => api.get(`/categories/${slug}`),
};
