const request = require("supertest");
const jwt = require("jsonwebtoken");
const { createApp } = require("../app");

process.env.JWT_SECRET = "test_secret_for_jest";

function makeToken(user = { id: 1, email: "angel@test.com" }) {
  return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1h" });
}

describe("log-service", () => {
  let app;
  let mockDb;

  beforeEach(() => {
    mockDb = { query: jest.fn() };
    app = createApp(mockDb);
    jest.clearAllMocks();
  });

  describe("POST /logs (protegido)", () => {
    it("rechaza la petición sin header Authorization (401)", async () => {
      const res = await request(app)
        .post("/logs")
        .send({ food: "Banana" });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Token requerido");
    });

    it("rechaza token con formato inválido (401)", async () => {
      const res = await request(app)
        .post("/logs")
        .set("Authorization", "tokenSinBearer")
        .send({ food: "Banana" });
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Formato de token inválido/);
    });

    it("rechaza request con token válido pero sin campo food (400)", async () => {
      const res = await request(app)
        .post("/logs")
        .set("Authorization", `Bearer ${makeToken()}`)
        .send({ calories: 100 });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("El campo 'food' es requerido");
    });

    it("crea log correctamente usando el userId del JWT (NO del body)", async () => {
      // El test intenta suplantar con user_id falso en el body; debe ignorarse
      const fakeLog = {
        id: 10,
        user_id: 1, // el que está en el JWT
        food: "Banana",
        calories: "89",
        protein: "1.1",
        carbs: "22.8",
        fat: "0.3",
        created_at: new Date().toISOString()
      };
      mockDb.query.mockResolvedValueOnce({ rows: [fakeLog] });

      const res = await request(app)
        .post("/logs")
        .set("Authorization", `Bearer ${makeToken({ id: 1, email: "angel@test.com" })}`)
        .send({
          user_id: 999, // intento de suplantación — debe ignorarse
          food: "Banana",
          calories: 89,
          protein: 1.1,
          carbs: 22.8,
          fat: 0.3
        });

      expect(res.status).toBe(201);
      expect(res.body.log.user_id).toBe(1); // el del token, no el 999

      // Verifica que el INSERT recibió el id=1 del JWT como primer parámetro
      const queryCall = mockDb.query.mock.calls[0];
      expect(queryCall[1][0]).toBe(1); // userId del token, no 999
    });
  });

  describe("GET /logs (protegido)", () => {
    it("rechaza sin token (401)", async () => {
      const res = await request(app).get("/logs");
      expect(res.status).toBe(401);
    });

    it("devuelve los logs del usuario autenticado, ordenados desc", async () => {
      const logs = [
        { id: 3, user_id: 1, food: "Apple", created_at: "2026-04-22T12:00:00Z" },
        { id: 2, user_id: 1, food: "Chicken", created_at: "2026-04-22T10:00:00Z" }
      ];
      mockDb.query.mockResolvedValueOnce({ rows: logs });

      const res = await request(app)
        .get("/logs")
        .set("Authorization", `Bearer ${makeToken()}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(logs);
      expect(mockDb.query.mock.calls[0][1]).toEqual([1]); // filtrado por userId del token
    });
  });

  describe("DELETE /logs/:id (protegido)", () => {
    it("elimina el log cuando pertenece al usuario", async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: 5 }] });

      const res = await request(app)
        .delete("/logs/5")
        .set("Authorization", `Bearer ${makeToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Log eliminado");
      expect(res.body.id).toBe(5);
    });

    it("devuelve 404 si el log no existe o no le pertenece al usuario", async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // DELETE no afectó filas

      const res = await request(app)
        .delete("/logs/999")
        .set("Authorization", `Bearer ${makeToken()}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/no encontrado o no te pertenece/);
    });
  });

  describe("GET /logs/:userId (endpoint interno para stats-service)", () => {
    it("devuelve 400 si el userId no es numérico", async () => {
      const res = await request(app).get("/logs/abc");
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("userId inválido");
    });
  });
});