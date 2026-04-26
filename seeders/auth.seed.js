const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
  host: "localhost",
  port: 5433,
  user: "postgres",
  password: "1234",
  database: "authdb"
});

const USERS = [
  { name: "Demo User", email: "demo@yummy.com",    password: "demo1234" },
  { name: "Angel",     email: "angel@itl.edu.mx",  password: "angel1234" }
];

async function seed() {
  console.log("🌱 Seeding authdb...");

  for (const u of USERS) {
    const hash = await bcrypt.hash(u.password, 10);
    await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password = EXCLUDED.password`,
      [u.name, u.email, hash]
    );
    console.log(`  ✅ ${u.email} (password: ${u.password})`);
  }

  await pool.end();
  console.log("✅ authdb seeded\n");
}

seed().catch(err => {
  console.error("❌ Error seeding authdb:", err);
  process.exit(1);
});