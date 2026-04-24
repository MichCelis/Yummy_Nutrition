import api from "./api";

export const authService = {
  register: (name, email, password) =>
    api.post("/auth/register", { name, email, password }),

  login: (email, password) =>
    api.post("/auth/login", { email, password }),

  profile: () => api.get("/auth/profile"),
};