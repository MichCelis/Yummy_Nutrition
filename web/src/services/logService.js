import api from "./api";

export const logService = {
  create: (log) => api.post("/logs", log),
  getAll: () => api.get("/logs"),
  delete: (id) => api.delete(`/logs/${id}`),
};