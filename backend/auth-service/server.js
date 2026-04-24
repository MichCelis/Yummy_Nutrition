const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { connectWithRetry } = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

let db;

// ==================== ENDPOINTS ====================

app.get("/", (req, res) => {
  res.json({ message: "Auth real funcionando 🚀" });
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  try {
    await db.query(
      "INSERT INTO users(name,email,password) VALUES($1,$2,$3)",
      [name, email, hash]
    );

    res.json({ message: "Usuario registrado" });
  } catch (error) {
    res.status(400).json({ error: "Email ya existe" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const result = await db.query(
    "SELECT * FROM users WHERE email=$1",
    [email]
  );

  if (result.rows.length === 0)
    return res.status(404).json({ error: "Usuario no existe" });

  const user = result.rows[0];

  const valid = await bcrypt.compare(password, user.password);

  if (!valid)
    return res.status(401).json({ error: "Contraseña incorrecta" });

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({
    message: "Login exitoso",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  });
});

function verificarToken(req, res, next) {
  const header = req.headers.authorization;

  if (!header)
    return res.status(401).json({ error: "Token requerido" });

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
}

app.get("/profile", verificarToken, (req, res) => {
  res.json({
    message: "Ruta privada",
    user: req.user
  });
});

// ==================== ARRANQUE DEL SERVIDOR ====================

async function startServer() {
  db = await connectWithRetry();

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100),
      email VARCHAR(100) UNIQUE,
      password TEXT
    )
  `);
  console.log("✅ Tabla users lista");

  app.listen(process.env.PORT, () => {
    console.log("Auth Service PRO corriendo");
  });
}

startServer().catch(err => {
  console.error("❌ Error fatal:", err);
  process.exit(1);
});