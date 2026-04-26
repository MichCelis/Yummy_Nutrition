const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5435,
  user: "postgres",
  password: "1234",
  database: "recipedb"
});

const SEARCHES = [
  {
    query: "chicken",
    results: [{
      id: "52940", name: "Brown Stew Chicken", category: "Chicken", area: "Jamaican",
      image: "https://www.themealdb.com/images/media/meals/sypxpx1515365095.jpg"
    }]
  },
  {
    query: "pasta",
    results: [{
      id: "52835", name: "Fettucine alfredo", category: "Pasta", area: "Italian",
      image: "https://www.themealdb.com/images/media/meals/uquqtu1511178042.jpg"
    }]
  }
];

const DETAILS = [
  {
    meal_id: "52940",
    data: {
      id: "52940", name: "Brown Stew Chicken", category: "Chicken", area: "Jamaican",
      image: "https://www.themealdb.com/images/media/meals/sypxpx1515365095.jpg",
      instructions: "Season chicken with salt, pepper and brown it in a hot pan. Add onions, garlic and tomatoes. Simmer until tender.",
      ingredients: ["1 whole Chicken", "2 cloves Garlic", "1 tbsp Olive Oil", "1 large Onion", "2 Tomatoes"],
      youtube: "https://www.youtube.com/watch?v=_vsQ7g1v8mE"
    }
  },
  {
    meal_id: "52835",
    data: {
      id: "52835", name: "Fettucine alfredo", category: "Pasta", area: "Italian",
      image: "https://www.themealdb.com/images/media/meals/uquqtu1511178042.jpg",
      instructions: "Boil pasta. Melt butter with cream and parmesan. Toss pasta in sauce. Season with pepper.",
      ingredients: ["500g Fettucine", "100g Butter", "200ml Heavy Cream", "150g Parmesan", "1 tsp Black Pepper"],
      youtube: null
    }
  }
];

async function seed() {
  console.log("🌱 Seeding recipedb...");

  for (const s of SEARCHES) {
    await pool.query(
      `INSERT INTO recipe_searches (query, results) VALUES ($1, $2)
       ON CONFLICT (query) DO UPDATE SET results = EXCLUDED.results`,
      [s.query, JSON.stringify(s.results)]
    );
    console.log(`  ✅ Search cached: "${s.query}"`);
  }

  for (const d of DETAILS) {
    await pool.query(
      `INSERT INTO recipe_details (meal_id, data) VALUES ($1, $2)
       ON CONFLICT (meal_id) DO UPDATE SET data = EXCLUDED.data`,
      [d.meal_id, JSON.stringify(d.data)]
    );
    console.log(`  ✅ Detail cached: ${d.data.name}`);
  }

  await pool.end();
  console.log("✅ recipedb seeded\n");
}

seed().catch(err => { console.error("❌", err); process.exit(1); });