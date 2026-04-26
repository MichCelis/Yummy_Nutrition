const request = require("supertest");
const { createApp } = require("../app");

jest.mock("axios");
const axios = require("axios");

describe("food-service", () => {
  let app;
  let mockDb;

  beforeEach(() => {
    mockDb = { query: jest.fn() };
    app = createApp(mockDb);
    jest.clearAllMocks();
  });

  describe("GET /foods/search", () => {
    it("devuelve 400 si falta el parámetro q", async () => {
      const res = await request(app).get("/foods/search");
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("El parámetro 'q' es requerido");
    });

    it("devuelve resultados desde caché si ya existen en BD (source: cache)", async () => {
      const cached = [
        { fdcId: 1, name: "BANANA", calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3 }
      ];
      mockDb.query.mockResolvedValueOnce({
        rows: [{ query: "banana", results: cached }]
      });

      const res = await request(app).get("/foods/search?q=banana");

      expect(res.status).toBe(200);
      expect(res.body.source).toBe("cache");
      expect(res.body.foods).toEqual(cached);
      expect(axios.get).not.toHaveBeenCalled(); // NO debe llamar a USDA
    });

    it("consulta USDA y guarda en caché cuando no hay resultado local", async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });  // cache miss (SELECT)
      mockDb.query.mockResolvedValueOnce({});             // INSERT

      axios.get.mockResolvedValueOnce({
        data: {
          foods: [
            {
              fdcId: 123,
              description: "APPLE",
              foodNutrients: [
                { nutrientName: "Energy", value: 52 },
                { nutrientName: "Protein", value: 0.3 },
                { nutrientName: "Carbohydrate, by difference", value: 14 },
                { nutrientName: "Total lipid (fat)", value: 0.2 }
              ]
            }
          ]
        }
      });

      const res = await request(app).get("/foods/search?q=apple");

      expect(res.status).toBe(200);
      expect(res.body.source).toBe("usda");
      expect(res.body.foods).toHaveLength(1);
      expect(res.body.foods[0].name).toBe("APPLE");
      expect(res.body.foods[0].calories).toBe(52);
      expect(res.body.foods[0].protein).toBe(0.3);
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(mockDb.query).toHaveBeenCalledTimes(2); // SELECT + INSERT
    });

    it("devuelve 500 si la API de USDA falla", async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // cache miss
      axios.get.mockRejectedValueOnce(new Error("USDA unavailable"));

      const res = await request(app).get("/foods/search?q=banana");

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Error buscando alimentos");
    });
  });
});