const { Pool } = require("pg");

async function connectWithRetry(maxRetries = 10, delayMs = 3000) {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: String(process.env.DB_PASSWORD),
    database: process.env.DB_NAME
  });

  for (let i = 1; i <= maxRetries; i++) {
    try {
      await pool.query("SELECT 1");
      console.log(`✅ Conectado a PostgreSQL (${process.env.DB_NAME}) en intento ${i}`);
      return pool;
    } catch (err) {
      console.log(`⏳ Intento ${i}/${maxRetries} — PostgreSQL no está listo (${err.code || err.message}). Reintentando en ${delayMs / 1000}s...`);
      if (i === maxRetries) {
        console.error("❌ No se pudo conectar a PostgreSQL después de todos los intentos.");
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

module.exports = { connectWithRetry };