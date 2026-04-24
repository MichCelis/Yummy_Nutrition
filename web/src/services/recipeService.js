import api from "./api";

export const recipeService = {
  search: (query) => api.get(`/recipes/search?q=${encodeURIComponent(query)}`),
  getById: (id) => api.get(`/recipes/${id}`),
};