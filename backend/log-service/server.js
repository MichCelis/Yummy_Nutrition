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

db.query(`
CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  user_id INT,
  food VARCHAR(200),
  calories NUMERIC,
  protein NUMERIC,
  carbs NUMERIC,
  fat NUMERIC,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
`).then(() => {
  console.log("Tabla logs lista");
});

app.get("/", (req, res) => {
  res.json({ message: "Log Service funcionando 📊" });
});

/* Guardar comida */
app.post("/logs", async (req, res) => {
  const { userId, food, calories, protein, carbs, fat } = req.body;

  try {
    await db.query(
      `INSERT INTO logs
      (user_id, food, calories, protein, carbs, fat)
      VALUES ($1,$2,$3,$4,$5,$6)`,
      [userId, food, calories, protein, carbs, fat]
    );

    res.json({ message: "Comida guardada" });

  } catch (error) {
    res.status(500).json({ error: "Error guardando log" });
  }
});

/* Historial usuario */
app.get("/logs/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const result = await db.query(
      `SELECT * FROM logs
       WHERE user_id=$1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);

  } catch (error) {
    res.status(500).json({ error: "Error obteniendo historial" });
  }
});

app.listen(process.env.PORT, () => {
  console.log("Log Service corriendo en puerto 3004");
});