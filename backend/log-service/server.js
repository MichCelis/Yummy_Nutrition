require("dotenv").config();
const { connectWithRetry } = require("./db");
const { createApp } = require("./app");

async function startServer() {
  const db = await connectWithRetry();

  await db.query(`
    CREATE TABLE IF NOT EXISTS logs (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      food VARCHAR(200) NOT NULL,
      calories NUMERIC,
      protein NUMERIC,
      carbs NUMERIC,
      fat NUMERIC,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await db.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'logs'
          AND column_name = 'created_at'
          AND data_type = 'timestamp without time zone'
      ) THEN
        ALTER TABLE logs
        ALTER COLUMN created_at TYPE TIMESTAMPTZ
        USING created_at AT TIME ZONE 'UTC';
        RAISE NOTICE '✅ Columna created_at migrada a TIMESTAMPTZ';
      END IF;
    END $$;
  `);

  console.log("✅ Tabla logs lista");

  const app = createApp(db);
  const PORT = process.env.PORT || 3004;
  app.listen(PORT, () => {
    console.log(`📊 Log Service corriendo en puerto ${PORT}`);
    console.log(`🗄️  BD: ${process.env.DB_NAME}`);
    console.log(`🔐 JWT habilitado`);
  });
}

startServer().catch(err => {
  console.error("❌ Error fatal:", err);
  process.exit(1);
});