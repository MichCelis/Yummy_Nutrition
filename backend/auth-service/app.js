const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function createApp(db) {
  const app = express();
  app.use(cors());
  app.use(express.json());

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
      user: { id: user.id, name: user.name, email: user.email }
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
    res.json({ message: "Ruta privada", user: req.user });
  });

  return app;
}

module.exports = { createApp };