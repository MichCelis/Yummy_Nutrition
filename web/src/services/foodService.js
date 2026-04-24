import api from "./api";

export const foodService = {
  search: (query) => api.get(`/foods/search?q=${encodeURIComponent(query)}`),
};