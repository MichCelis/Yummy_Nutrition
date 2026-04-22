const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const db = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
  database: process.env.DB_NAME
});

db.query(`
CREATE TABLE IF NOT EXISTS foods (
  id SERIAL PRIMARY KEY,
  query VARCHAR(100) UNIQUE,
  results JSONB
)
`).then(() => {
  console.log("Tabla foods lista");
});

app.get("/", (req, res) => {
  res.json({ message: "Food Service PRO 🥗" });
});

app.get("/foods/search", async (req, res) => {
  const q = req.query.q.toLowerCase();

  try {
    const local = await db.query(
      "SELECT * FROM foods WHERE query=$1",
      [q]
    );

    if (local.rows.length > 0) {
      return res.json({
        source: "cache",
        foods: local.rows[0].results
      });
    }

    const response = await axios.get(
      "https://api.nal.usda.gov/fdc/v1/foods/search",
      {
        params: {
          query: q,
          api_key: process.env.USDA_API_KEY
        }
      }
    );

    const foods = response.data.foods.slice(0,10).map(food => ({
      name: food.description,
      calories:
        food.foodNutrients.find(n => n.nutrientName === "Energy")?.value || 0,
      protein:
        food.foodNutrients.find(n => n.nutrientName === "Protein")?.value || 0,
      carbs:
        food.foodNutrients.find(n => n.nutrientName === "Carbohydrate, by difference")?.value || 0,
      fat:
        food.foodNutrients.find(n => n.nutrientName === "Total lipid (fat)")?.value || 0
    }));

    await db.query(
      "INSERT INTO foods(query, results) VALUES($1,$2)",
      [q, JSON.stringify(foods)]
    );

    res.json({
      source: "usda",
      foods
    });

  } catch (error) {
    res.status(500).json({ error: "Error buscando alimentos" });
  }
});

app.listen(process.env.PORT, () => {
  console.log("Food Service PRO corriendo 3002");
});