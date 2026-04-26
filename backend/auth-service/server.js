require("dotenv").config();
const { connectWithRetry } = require("./db");
const { createApp } = require("./app");

async function startServer() {
  const db = await connectWithRetry();

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100),
      email VARCHAR(100) UNIQUE,
      password TEXT
    )
  `);
  console.log("✅ Tabla users lista");

  const app = createApp(db);
  app.listen(process.env.PORT, () => {
    console.log("Auth Service PRO corriendo");
  });
}

startServer().catch(err => {
  console.error("❌ Error fatal:", err);
  process.exit(1);
});