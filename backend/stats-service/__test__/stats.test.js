const request = require("supertest");
const jwt = require("jsonwebtoken");
const { createApp } = require("../app");

process.env.JWT_SECRET = "test_secret_for_jest";
process.env.LOG_SERVICE_URL = "http://log-service:3004";

jest.mock("axios");
const axios = require("axios");

function makeToken(user = { id: 1, email: "angel@test.com" }) {
  return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1h" });
}

// Helper: genera una fecha ISO con la fecha de HOY (para los filtros de "hoy")
function todayIso(hour = "12:00:00") {
  const today = new Date().toISOString().split("T")[0];
  return `${today}T${hour}.000Z`;
}

describe("stats-service", () => {
  let app;
  let mockDb;

  beforeEach(() => {
    mockDb = { query: jest.fn() };
    app = createApp(mockDb);
    jest.clearAllMocks();
  });

  describe("Autenticación y validación", () => {
    it("rechaza GET /stats/:userId sin token (401)", async () => {
      const res = await request(app).get("/stats/1");
      expect(res.status).toBe(401);
    });

    it("rechaza userId no numérico (400)", async () => {
      const res = await request(app)
        .get("/stats/abc")
        .set("Authorization", `Bearer ${makeToken()}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("userId inválido");
    });
  });

  describe("GET /stats/:userId — cálculo de totales del día", () => {
    it("suma correctamente solo los logs de hoy, ignorando días anteriores", async () => {
      // log-service devuelve 3 logs de hoy + 1 de ayer
      const logs = [
        { calories: 100, protein: 10, carbs: 20, fat: 2, created_at: todayIso("08:00:00") },
        { calories: 200, protein: 15, carbs: 30, fat: 5, created_at: todayIso("13:00:00") },
        { calories: 50,  protein: 3,  carbs: 10, fat: 1, created_at: todayIso("18:00:00") },
        { calories: 999, protein: 99, carbs: 99, fat: 99, created_at: "2025-01-01T12:00:00.000Z" } // ayer-ish
      ];
      axios.get.mockResolvedValueOnce({ data: logs });
      mockDb.query.mockResolvedValueOnce({}); // UPSERT

      const res = await request(app)
        .get("/stats/1")
        .set("Authorization", `Bearer ${makeToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.userId).toBe(1);
      expect(res.body.todayCalories).toBe(350);   // 100+200+50
      expect(res.body.todayProtein).toBe(28);     // 10+15+3
      expect(res.body.todayCarbs).toBe(60);       // 20+30+10
      expect(res.body.todayFat).toBe(8);          // 2+5+1
      expect(res.body.mealsToday).toBe(3);
      expect(res.body.source).toBe("calculated");

      // Verifica que consumió log-service vía HTTP (no BD directa)
      expect(axios.get).toHaveBeenCalledWith(
        "http://log-service:3004/logs/1"
      );
    });

    it("devuelve totales en cero cuando el usuario no tiene logs hoy", async () => {
      axios.get.mockResolvedValueOnce({ data: [] });
      mockDb.query.mockResolvedValueOnce({}); // UPSERT

      const res = await request(app)
        .get("/stats/1")
        .set("Authorization", `Bearer ${makeToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.todayCalories).toBe(0);
      expect(res.body.mealsToday).toBe(0);
    });

    it("propaga 404 cuando log-service responde 404", async () => {
      const err = new Error("Not found");
      err.response = { status: 404 };
      axios.get.mockRejectedValueOnce(err);

      const res = await request(app)
        .get("/stats/999")
        .set("Authorization", `Bearer ${makeToken()}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Usuario no encontrado en log-service");
    });

    it("devuelve 500 si log-service está caído (ECONNREFUSED)", async () => {
      axios.get.mockRejectedValueOnce(new Error("ECONNREFUSED"));

      const res = await request(app)
        .get("/stats/1")
        .set("Authorization", `Bearer ${makeToken()}`);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Error calculando stats");
    });
  });

  describe("GET /stats/:userId/history", () => {
    it("devuelve el historial desde la BD de caché", async () => {
      const history = [
        { date: "2026-04-22", total_calories: "306", total_protein: "32.4", total_carbs: "36.8", total_fat: "4.1", meals_count: 3 }
      ];
      mockDb.query.mockResolvedValueOnce({ rows: history });

      const res = await request(app)
        .get("/stats/1/history?days=7")
        .set("Authorization", `Bearer ${makeToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.userId).toBe(1);
      expect(res.body.days).toBe(7);
      expect(res.body.history).toEqual(history);

      // Verifica que usa default de 7 días si no se especifica
      const queryCall = mockDb.query.mock.calls[0];
      expect(queryCall[1]).toEqual([1, 7]);
    });

    it("aplica el parámetro days cuando se proporciona", async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get("/stats/1/history?days=30")
        .set("Authorization", `Bearer ${makeToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.days).toBe(30);
      expect(mockDb.query.mock.calls[0][1]).toEqual([1, 30]);
    });
  });
});