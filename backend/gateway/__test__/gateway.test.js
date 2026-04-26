const request = require("supertest");
const { createApp } = require("../app");

describe("gateway", () => {
  let app;

  beforeEach(() => {
    app = createApp({ logging: false }); // silenciamos morgan en tests
  });

  describe("GET /", () => {
    it("devuelve información del gateway con el listado de servicios", async () => {
      const res = await request(app).get("/");

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("API Gateway");
      expect(res.body.version).toBe("1.0.0");
      expect(res.body.services).toEqual({
        auth:    "/api/auth/*",
        foods:   "/api/foods/*",
        recipes: "/api/recipes/*",
        logs:    "/api/logs/*",
        stats:   "/api/stats/*"
      });
    });
  });

  describe("GET /health", () => {
    it("devuelve status ok con timestamp ISO", async () => {
      const res = await request(app).get("/health");

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/); // formato ISO
    });
  });

  describe("Ruta desconocida", () => {
    it("devuelve 404 con el path solicitado en la respuesta", async () => {
      const res = await request(app).get("/ruta/que/no/existe");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Ruta no encontrada");
      expect(res.body.path).toBe("/ruta/que/no/existe");
    });
  });
});