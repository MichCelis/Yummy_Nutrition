const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();
const { connectWithRetry } = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

let db;

async function startServer() {
  db = await connectWithRetry();

  await db.query(`
    CREATE TABLE IF NOT EXISTS recipe_searches (
      id SERIAL PRIMARY KEY,
      query VARCHAR(200) UNIQUE NOT NULL,
      results JSONB NOT NULL,
      cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("✅ Tabla recipe_searches lista");

  await db.query(`
    CREATE TABLE IF NOT EXISTS recipe_details (
      id SERIAL PRIMARY KEY,
      meal_id VARCHAR(50) UNIQUE NOT NULL,
      data JSONB NOT NULL,
      cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("✅ Tabla recipe_details lista");

  const PORT = process.env.PORT || 3003;
  app.listen(PORT, () => {
    console.log(`🍽️  Recipe Service corriendo en puerto ${PORT}`);
    console.log(`🗄️  BD: ${process.env.DB_NAME}`);
  });
}

app.get("/", (req, res) => {
  res.json({
    message: "Recipe Service funcionando 🍽️",
    database: process.env.DB_NAME
  });
});

app.get("/recipes/search", async (req, res) => {
  const q = (req.query.q || "").toLowerCase().trim();

  if (!q) {
    return res.status(400).json({ error: "Falta el parámetro 'q'" });
  }

  try {
    const cached = await db.query(
      "SELECT results FROM recipe_searches WHERE query = $1",
      [q]
    );

    if (cached.rows.length > 0) {
      return res.json({
        source: "cache",
        query: q,
        recipes: cached.rows[0].results
      });
    }

    const response = await axios.get(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`
    );

    const meals = response.data.meals || [];

    const recipes = meals.map(meal => ({
      id: meal.idMeal,
      name: meal.strMeal,
      category: meal.strCategory,
      area: meal.strArea,
      image: meal.strMealThumb
    }));

    if (recipes.length > 0) {
      await db.query(
        "INSERT INTO recipe_searches (query, results) VALUES ($1, $2) ON CONFLICT (query) DO NOTHING",
        [q, JSON.stringify(recipes)]
      );
    }

    res.json({
      source: "themealdb",
      query: q,
      recipes
    });

  } catch (error) {
    console.error("Error buscando recetas:", error.message);
    res.status(500).json({ error: "Error buscando recetas" });
  }
});

app.get("/recipes/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const cached = await db.query(
      "SELECT data FROM recipe_details WHERE meal_id = $1",
      [id]
    );

    if (cached.rows.length > 0) {
      return res.json({
        source: "cache",
        ...cached.rows[0].data
      });
    }

    const response = await axios.get(
      `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`
    );

    const meal = response.data.meals?.[0];

    if (!meal) {
      return res.status(404).json({ error: "Receta no encontrada" });
    }

    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ingredient && ingredient.trim() !== "") {
        ingredients.push(`${measure?.trim() || ""} ${ingredient.trim()}`.trim());
      }
    }

    const recipeData = {
      id: meal.idMeal,
      name: meal.strMeal,
      category: meal.strCategory,
      area: meal.strArea,
      image: meal.strMealThumb,
      instructions: meal.strInstructions,
      ingredients,
      youtube: meal.strYoutube || null
    };

    await db.query(
      "INSERT INTO recipe_details (meal_id, data) VALUES ($1, $2) ON CONFLICT (meal_id) DO NOTHING",
      [id, JSON.stringify(recipeData)]
    );

    res.json({
      source: "themealdb",
      ...recipeData
    });

  } catch (error) {
    console.error("Error obteniendo receta:", error.message);
    res.status(500).json({ error: "Error obteniendo detalle de receta" });
  }
});

startServer().catch(err => {
  console.error("❌ Error fatal:", err);
  process.exit(1);
});