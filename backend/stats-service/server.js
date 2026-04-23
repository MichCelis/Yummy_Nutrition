const express = require("express");
const cors = require("cors");
const axios = require("axios");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { connectWithRetry } = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

let db;
const LOG_SERVICE_URL = process.env.LOG_SERVICE_URL;

async function startServer() {
  db = await connectWithRetry();

  await db.query(`
    CREATE TABLE IF NOT EXISTS stats_cache (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      date DATE NOT NULL,
      total_calories NUMERIC DEFAULT 0,
      total_protein NUMERIC DEFAULT 0,
      total_carbs NUMERIC DEFAULT 0,
      total_fat NUMERIC DEFAULT 0,
      meals_count INT DEFAULT 0,
      calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date)
    )
  `);
  console.log("✅ Tabla stats_cache lista en statsdb");

  const PORT = process.env.PORT || 3005;
  app.listen(PORT, () => {
    console.log(`📈 Stats Service corriendo en puerto ${PORT}`);
    console.log(`🗄️  BD: ${process.env.DB_NAME}`);
    console.log(`🔗 Log Service: ${LOG_SERVICE_URL}`);
  });
}

function verificarToken(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "Token requerido" });
  }

  const partes = header.split(" ");
  if (partes.length !== 2 || partes[0] !== "Bearer") {
    return res.status(401).json({ error: "Formato de token inválido. Use: Bearer <token>" });
  }

  const token = partes[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

app.get("/", (req, res) => {
  res.json({
    message: "Stats Service funcionando 📈",
    database: process.env.DB_NAME,
    logService: LOG_SERVICE_URL
  });
});

app.get("/stats/:userId", verificarToken, async (req, res) => {
  const userId = parseInt(req.params.userId);

  if (isNaN(userId)) {
    return res.status(400).json({ error: "userId inválido" });
  }

  try {
    const response = await axios.get(`${LOG_SERVICE_URL}/logs/${userId}`);
    const logs = response.data;

    const today = new Date().toISOString().split("T")[0];
    const todayLogs = logs.filter(log => {
      const logDate = new Date(log.created_at).toISOString().split("T")[0];
      return logDate === today;
    });

    const totals = todayLogs.reduce((acc, log) => ({
      calories: acc.calories + Number(log.calories || 0),
      protein:  acc.protein  + Number(log.protein  || 0),
      carbs:    acc.carbs    + Number(log.carbs    || 0),
      fat:      acc.fat      + Number(log.fat      || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    await db.query(`
      INSERT INTO stats_cache (user_id, date, total_calories, total_protein, total_carbs, total_fat, meals_count, calculated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, date) DO UPDATE SET
        total_calories = EXCLUDED.total_calories,
        total_protein  = EXCLUDED.total_protein,
        total_carbs    = EXCLUDED.total_carbs,
        total_fat      = EXCLUDED.total_fat,
        meals_count    = EXCLUDED.meals_count,
        calculated_at  = CURRENT_TIMESTAMP
    `, [userId, today, totals.calories, totals.protein, totals.carbs, totals.fat, todayLogs.length]);

    res.json({
      userId,
      date: today,
      todayCalories: Number(totals.calories.toFixed(2)),
      todayProtein:  Number(totals.protein.toFixed(2)),
      todayCarbs:    Number(totals.carbs.toFixed(2)),
      todayFat:      Number(totals.fat.toFixed(2)),
      mealsToday:    todayLogs.length,
      source: "calculated"
    });

  } catch (error) {
    console.error("Error obteniendo stats:", error.message);

    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: "Usuario no encontrado en log-service" });
    }

    res.status(500).json({
      error: "Error calculando stats",
      detail: error.message
    });
  }
});

app.get("/stats/:userId/history", verificarToken, async (req, res) => {
  const userId = parseInt(req.params.userId);
  const days = parseInt(req.query.days) || 7;

  try {
    const result = await db.query(`
      SELECT date, total_calories, total_protein, total_carbs, total_fat, meals_count
      FROM stats_cache
      WHERE user_id = $1
      ORDER BY date DESC
      LIMIT $2
    `, [userId, days]);

    res.json({
      userId,
      days,
      history: result.rows
    });
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo historial" });
  }
});

startServer().catch(err => {
  console.error("❌ Error fatal:", err);
  process.exit(1);
});