require("dotenv").config();
const { connectWithRetry } = require("./db");
const { createApp } = require("./app");

async function startServer() {
  const db = await connectWithRetry();

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

  const app = createApp(db);
  const PORT = process.env.PORT || 3005;
  app.listen(PORT, () => {
    console.log(`📈 Stats Service corriendo en puerto ${PORT}`);
    console.log(`🗄️  BD: ${process.env.DB_NAME}`);
    console.log(`🔗 Log Service: ${process.env.LOG_SERVICE_URL}`);
  });
}

startServer().catch(err => {
  console.error("❌ Error fatal:", err);
  process.exit(1);
});