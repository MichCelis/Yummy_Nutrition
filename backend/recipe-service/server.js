require("dotenv").config();
const { connectWithRetry } = require("./db");
const { createApp } = require("./app");

async function startServer() {
  const db = await connectWithRetry();

  await db.query(`
    CREATE TABLE IF NOT EXISTS recipe_searches (
      id SERIAL PRIMARY KEY,
      query VARCHAR(200) UNIQUE NOT NULL,
      results JSONB NOT NULL,
      cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("✅ Tabla recipe_searches lista");

  await db.query(`
    CREATE TABLE IF NOT EXISTS recipe_details (
      id SERIAL PRIMARY KEY,
      meal_id VARCHAR(50) UNIQUE NOT NULL,
      data JSONB NOT NULL,
      cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("✅ Tabla recipe_details lista");

  const app = createApp(db);
  const PORT = process.env.PORT || 3003;
  app.listen(PORT, () => {
    console.log(`🍽️  Recipe Service corriendo en puerto ${PORT}`);
    console.log(`🗄️  BD: ${process.env.DB_NAME}`);
  });
}

startServer().catch(err => {
  console.error("❌ Error fatal:", err);
  process.exit(1);
});