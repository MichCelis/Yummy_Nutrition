const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5434,
  user: "postgres",
  password: "1234",
  database: "fooddb"
});

const CACHED = [
  {
    query: "banana",
    results: [{
      fdcId: 1105314, name: "BANANA", brand: null, category: "Fruits",
      dataType: "SR Legacy", servingSize: 100, servingUnit: "g",
      calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3
    }]
  },
  {
    query: "apple",
    results: [{
      fdcId: 1102644, name: "APPLE, RAW", brand: null, category: "Fruits",
      dataType: "SR Legacy", servingSize: 100, servingUnit: "g",
      calories: 52, protein: 0.3, carbs: 14, fat: 0.2
    }]
  },
  {
    query: "chicken breast",
    results: [{
      fdcId: 171077, name: "CHICKEN, BREAST, RAW", brand: null, category: "Poultry",
      dataType: "SR Legacy", servingSize: 100, servingUnit: "g",
      calories: 120, protein: 22.5, carbs: 0, fat: 2.6
    }]
  }
];

async function seed() {
  console.log("🌱 Seeding fooddb...");
  for (const c of CACHED) {
    await pool.query(
      `INSERT INTO foods (query, results) VALUES ($1, $2)
       ON CONFLICT (query) DO UPDATE SET results = EXCLUDED.results`,
      [c.query, JSON.stringify(c.results)]
    );
    console.log(`  ✅ Cached: "${c.query}"`);
  }
  await pool.end();
  console.log("✅ fooddb seeded\n");
}

seed().catch(err => { console.error("❌", err); process.exit(1); });