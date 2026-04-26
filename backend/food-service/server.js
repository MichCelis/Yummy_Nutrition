require("dotenv").config();
const { connectWithRetry } = require("./db");
const { createApp } = require("./app");

async function startServer() {
  const db = await connectWithRetry();

  await db.query(`
    CREATE TABLE IF NOT EXISTS foods (
      id SERIAL PRIMARY KEY,
      query VARCHAR(100) UNIQUE,
      results JSONB
    )
  `);
  console.log("✅ Tabla foods lista");

  const app = createApp(db);
  app.listen(process.env.PORT, () => {
    console.log("Food Service PRO corriendo 3002");
  });
}

startServer().catch(err => {
  console.error("❌ Error fatal:", err);
  process.exit(1);
});