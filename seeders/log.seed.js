const { Pool } = require("pg");

// Conexión a authdb (para buscar el id real de demo@yummy.com)
const authPool = new Pool({
  host: "localhost",
  port: 5433,
  user: "postgres",
  password: "1234",
  database: "authdb"
});

// Conexión a logdb
const logPool = new Pool({
  host: "localhost",
  port: 5436,
  user: "postgres",
  password: "1234",
  database: "logdb"
});

const DEMO_EMAIL = "demo@yummy.com";

function daysAgo(days, hour = 12) {
  // Usamos hora local (no UTC) para que el "hoy" del seed coincida con el "hoy"
  // que ve el usuario en su navegador, sin desfase por zona horaria.
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  // Formatea como "YYYY-MM-DD HH:mm:ss" sin convertir a UTC
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const LOGS = [
  // HOY
  { food: "Oatmeal with banana", calories: 280, protein: 8,   carbs: 54, fat: 5,   at: daysAgo(0, 8) },
  { food: "Grilled chicken breast", calories: 220, protein: 41, carbs: 0, fat: 5.2, at: daysAgo(0, 13) },
  { food: "Apple",              calories: 52,  protein: 0.3, carbs: 14, fat: 0.2, at: daysAgo(0, 17) },

  // AYER
  { food: "Greek yogurt",       calories: 150, protein: 15,  carbs: 12, fat: 4,   at: daysAgo(1, 8) },
  { food: "Tuna salad",         calories: 320, protein: 25,  carbs: 10, fat: 20,  at: daysAgo(1, 13) },
  { food: "Banana",             calories: 89,  protein: 1.1, carbs: 23, fat: 0.3, at: daysAgo(1, 18) },

  // Hace 2 días
  { food: "Scrambled eggs",     calories: 200, protein: 14,  carbs: 2,  fat: 15,  at: daysAgo(2, 8) },
  { food: "Rice with beans",    calories: 400, protein: 15,  carbs: 70, fat: 6,   at: daysAgo(2, 13) },

  // Hace 3 días
  { food: "Protein shake",      calories: 180, protein: 30,  carbs: 8,  fat: 3,   at: daysAgo(3, 9) },
  { food: "Salmon + vegetables",calories: 450, protein: 35,  carbs: 20, fat: 25,  at: daysAgo(3, 19) },

  // Hace 4 días
  { food: "Toast with avocado", calories: 320, protein: 8,   carbs: 35, fat: 18,  at: daysAgo(4, 8) },
  { food: "Chicken wrap",       calories: 420, protein: 30,  carbs: 35, fat: 18,  at: daysAgo(4, 14) },

  // Hace 5 días
  { food: "Smoothie bowl",      calories: 350, protein: 12,  carbs: 55, fat: 10,  at: daysAgo(5, 9) },

  // Hace 6 días
  { food: "Pasta with tomato",  calories: 480, protein: 16,  carbs: 85, fat: 8,   at: daysAgo(6, 13) },
  { food: "Almonds (handful)",  calories: 170, protein: 6,   carbs: 6,  fat: 15,  at: daysAgo(6, 17) }
];

async function seed() {
  console.log("🌱 Seeding logdb...");

  // Paso 1: buscar el id real del usuario demo en authdb
  const userResult = await authPool.query(
    "SELECT id FROM users WHERE email = $1",
    [DEMO_EMAIL]
  );

  if (userResult.rows.length === 0) {
    throw new Error(`Usuario ${DEMO_EMAIL} no existe en authdb. Corre 'npm run seed:auth' primero.`);
  }

  const userId = userResult.rows[0].id;
  console.log(`  → Usuario demo encontrado: id=${userId}`);

  // Paso 2: limpiar todos los logs previos del usuario demo (idempotencia)
  const deleted = await logPool.query("DELETE FROM logs WHERE user_id = $1", [userId]);
  console.log(`  → Logs previos eliminados: ${deleted.rowCount}`);

  // Paso 3: insertar los logs frescos
  for (const l of LOGS) {
    await logPool.query(
      `INSERT INTO logs (user_id, food, calories, protein, carbs, fat, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, l.food, l.calories, l.protein, l.carbs, l.fat, l.at]
    );
  }

  console.log(`  ✅ ${LOGS.length} logs creados para user_id=${userId} (${DEMO_EMAIL})`);

  await authPool.end();
  await logPool.end();
  console.log("✅ logdb seeded\n");
}

seed().catch(err => {
  console.error("❌ Error seeding logdb:", err.message);
  process.exit(1);
});