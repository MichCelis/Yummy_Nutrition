const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

function createApp(db) {
  const app = express();
  app.use(cors());
  app.use(express.json());

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
      message: "Log Service funcionando 📊",
      database: process.env.DB_NAME
    });
  });

  app.post("/logs", verificarToken, async (req, res) => {
    const { food, calories, protein, carbs, fat } = req.body;
    const userId = req.user.id;

    if (!food) {
      return res.status(400).json({ error: "El campo 'food' es requerido" });
    }

    try {
      const result = await db.query(
        `INSERT INTO logs (user_id, food, calories, protein, carbs, fat)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, food, calories || 0, protein || 0, carbs || 0, fat || 0]
      );
      res.status(201).json({
        message: "Comida guardada",
        log: result.rows[0]
      });
    } catch (error) {
      console.error("Error guardando log:", error.message);
      res.status(500).json({ error: "Error guardando log" });
    }
  });

  app.get("/logs", verificarToken, async (req, res) => {
    const userId = req.user.id;
    try {
      const result = await db.query(
        `SELECT * FROM logs WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      );
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: "Error obteniendo historial" });
    }
  });

  app.get("/logs/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "userId inválido" });
    }
    try {
      const result = await db.query(
        `SELECT * FROM logs WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      );
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: "Error obteniendo historial" });
    }
  });

  app.delete("/logs/:id", verificarToken, async (req, res) => {
    const logId = parseInt(req.params.id);
    const userId = req.user.id;
    try {
      const result = await db.query(
        "DELETE FROM logs WHERE id = $1 AND user_id = $2 RETURNING id",
        [logId, userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Log no encontrado o no te pertenece" });
      }
      res.json({ message: "Log eliminado", id: logId });
    } catch (error) {
      res.status(500).json({ error: "Error eliminando log" });
    }
  });

  return app;
}

module.exports = { createApp };