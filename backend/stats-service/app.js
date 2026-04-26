const express = require("express");
const cors = require("cors");
const axios = require("axios");
const jwt = require("jsonwebtoken");

// Helper: formatea una fecha como "YYYY-MM-DD" en hora local del contenedor.
// IMPORTANTE: el contenedor debe estar en TZ=America/Mexico_City (ver docker-compose.yml)
function getLocalDateString(date) {
  const pad = n => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function createApp(db) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const LOG_SERVICE_URL = process.env.LOG_SERVICE_URL;

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

      const today = getLocalDateString(new Date());
      const todayLogs = logs.filter(log => {
        const logDate = getLocalDateString(new Date(log.created_at));
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

  return app;
}

module.exports = { createApp };