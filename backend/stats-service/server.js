const express = require("express");
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

app.get("/", (req, res) => {
  res.json({ message: "Stats Service funcionando 📈" });
});

app.get("/stats/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const result = await db.query(`
      SELECT
        COALESCE(SUM(calories),0) as calories,
        COALESCE(SUM(protein),0) as protein,
        COALESCE(SUM(carbs),0) as carbs,
        COALESCE(SUM(fat),0) as fat,
        COUNT(*) as meals
      FROM logs
      WHERE user_id = $1
      AND DATE(created_at) = CURRENT_DATE
    `, [userId]);

    const row = result.rows[0];

    res.json({
      todayCalories: Number(row.calories),
      todayProtein: Number(row.protein),
      todayCarbs: Number(row.carbs),
      todayFat: Number(row.fat),
      mealsToday: Number(row.meals)
    });

  } catch (error) {
    res.status(500).json({ error: "Error obteniendo stats" });
  }
});

app.listen(process.env.PORT, () => {
  console.log("Stats Service corriendo en puerto 3005");
});