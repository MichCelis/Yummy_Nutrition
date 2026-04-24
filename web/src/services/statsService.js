import api from "./api";

export const statsService = {
  getDaily: (userId) => api.get(`/stats/${userId}`),
  getHistory: (userId, days = 7) => api.get(`/stats/${userId}/history?days=${days}`),
};