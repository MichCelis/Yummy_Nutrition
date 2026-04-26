const request = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createApp } = require("../app");

process.env.JWT_SECRET = "test_secret_for_jest";

describe("auth-service", () => {
  let app;
  let mockDb;

  beforeEach(() => {
    mockDb = { query: jest.fn() };
    app = createApp(mockDb);
  });

  describe("POST /register", () => {
    it("registra un usuario nuevo exitosamente (200)", async () => {
      mockDb.query.mockResolvedValueOnce({});

      const res = await request(app)
        .post("/register")
        .send({ name: "Angel", email: "angel@test.com", password: "pass123" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Usuario registrado");
      expect(mockDb.query).toHaveBeenCalledTimes(1);
    });

    it("rechaza email duplicado con 400", async () => {
      mockDb.query.mockRejectedValueOnce(new Error("duplicate key"));

      const res = await request(app)
        .post("/register")
        .send({ name: "Angel", email: "repetido@test.com", password: "pass123" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Email ya existe");
    });
  });

  describe("POST /login", () => {
    it("devuelve 404 cuando el usuario no existe", async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post("/login")
        .send({ email: "nadie@test.com", password: "x" });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Usuario no existe");
    });

    it("devuelve 401 con contraseña incorrecta", async () => {
      const hash = await bcrypt.hash("correcta", 10);
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: 1, name: "Angel", email: "angel@test.com", password: hash }]
      });

      const res = await request(app)
        .post("/login")
        .send({ email: "angel@test.com", password: "incorrecta" });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Contraseña incorrecta");
    });

    it("devuelve token JWT válido con credenciales correctas", async () => {
      const hash = await bcrypt.hash("correcta", 10);
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: 1, name: "Angel", email: "angel@test.com", password: hash }]
      });

      const res = await request(app)
        .post("/login")
        .send({ email: "angel@test.com", password: "correcta" });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();

      const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
      expect(decoded.email).toBe("angel@test.com");
      expect(decoded.id).toBe(1);
    });
  });

  describe("GET /profile (protegido)", () => {
    it("rechaza petición sin header Authorization (401)", async () => {
      const res = await request(app).get("/profile");
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Token requerido");
    });

    it("rechaza un token inválido (401)", async () => {
      const res = await request(app)
        .get("/profile")
        .set("Authorization", "Bearer tokenFalso.invalido.xxx");

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Token inválido");
    });

    it("acepta token válido y regresa los datos del usuario", async () => {
      const token = jwt.sign(
        { id: 1, email: "angel@test.com", name: "Angel" },
        process.env.JWT_SECRET
      );

      const res = await request(app)
        .get("/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe("angel@test.com");
    });
  });
});