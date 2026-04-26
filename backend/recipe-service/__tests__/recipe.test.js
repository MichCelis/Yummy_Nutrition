const request = require("supertest");
const { createApp } = require("../app");

jest.mock("axios");
const axios = require("axios");

describe("recipe-service", () => {
  let app;
  let mockDb;

  beforeEach(() => {
    mockDb = { query: jest.fn() };
    app = createApp(mockDb);
    jest.clearAllMocks();
  });

  describe("GET /recipes/search", () => {
    it("devuelve 400 si falta el parámetro q", async () => {
      const res = await request(app).get("/recipes/search");
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Falta el parámetro 'q'");
    });

    it("devuelve resultados desde caché (source: cache) sin llamar a TheMealDB", async () => {
      const cached = [
        { id: "52940", name: "Brown Stew Chicken", category: "Chicken", area: "Jamaican", image: "url" }
      ];
      mockDb.query.mockResolvedValueOnce({ rows: [{ results: cached }] });

      const res = await request(app).get("/recipes/search?q=chicken");

      expect(res.status).toBe(200);
      expect(res.body.source).toBe("cache");
      expect(res.body.recipes).toEqual(cached);
      expect(axios.get).not.toHaveBeenCalled();
    });

    it("consulta TheMealDB y guarda en caché cuando no hay resultado local", async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });  // cache miss
      mockDb.query.mockResolvedValueOnce({});             // INSERT

      axios.get.mockResolvedValueOnce({
        data: {
          meals: [
            {
              idMeal: "52940",
              strMeal: "Brown Stew Chicken",
              strCategory: "Chicken",
              strArea: "Jamaican",
              strMealThumb: "https://img.example/meal.jpg"
            }
          ]
        }
      });

      const res = await request(app).get("/recipes/search?q=chicken");

      expect(res.status).toBe(200);
      expect(res.body.source).toBe("themealdb");
      expect(res.body.recipes).toHaveLength(1);
      expect(res.body.recipes[0].name).toBe("Brown Stew Chicken");
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(mockDb.query).toHaveBeenCalledTimes(2);
    });

    it("devuelve 500 si TheMealDB falla", async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      axios.get.mockRejectedValueOnce(new Error("TheMealDB down"));

      const res = await request(app).get("/recipes/search?q=chicken");

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Error buscando recetas");
    });
  });

  describe("GET /recipes/:id", () => {
    it("devuelve 404 si TheMealDB no encuentra la receta", async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // cache miss
      axios.get.mockResolvedValueOnce({ data: { meals: null } });

      const res = await request(app).get("/recipes/999999");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Receta no encontrada");
    });

    it("parsea correctamente los 20 campos de ingredientes de TheMealDB", async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // cache miss
      mockDb.query.mockResolvedValueOnce({});           // INSERT

      // Simula respuesta de TheMealDB con 3 ingredientes reales + 17 vacíos
      const meal = {
        idMeal: "52940",
        strMeal: "Brown Stew Chicken",
        strCategory: "Chicken",
        strArea: "Jamaican",
        strMealThumb: "https://img.example/meal.jpg",
        strInstructions: "Cook it well.",
        strYoutube: "https://youtube.com/xyz",
        strIngredient1: "Chicken", strMeasure1: "1 whole",
        strIngredient2: "Garlic", strMeasure2: "2 cloves",
        strIngredient3: "Olive Oil", strMeasure3: "1 tbsp"
      };
      for (let i = 4; i <= 20; i++) {
        meal[`strIngredient${i}`] = "";
        meal[`strMeasure${i}`] = "";
      }

      axios.get.mockResolvedValueOnce({ data: { meals: [meal] } });

      const res = await request(app).get("/recipes/52940");

      expect(res.status).toBe(200);
      expect(res.body.source).toBe("themealdb");
      expect(res.body.ingredients).toEqual([
        "1 whole Chicken",
        "2 cloves Garlic",
        "1 tbsp Olive Oil"
      ]);
      expect(res.body.youtube).toBe("https://youtube.com/xyz");
    });

    it("devuelve la receta desde caché sin llamar a TheMealDB", async () => {
      const cachedRecipe = {
        id: "52940",
        name: "Brown Stew Chicken",
        ingredients: ["1 whole Chicken"]
      };
      mockDb.query.mockResolvedValueOnce({ rows: [{ data: cachedRecipe }] });

      const res = await request(app).get("/recipes/52940");

      expect(res.status).toBe(200);
      expect(res.body.source).toBe("cache");
      expect(res.body.name).toBe("Brown Stew Chicken");
      expect(axios.get).not.toHaveBeenCalled();
    });
  });
});