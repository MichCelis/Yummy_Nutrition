const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Recipe Service funcionando 🍽️" });
});

/* Buscar recetas */
app.get("/recipes/search", async (req, res) => {
  const q = req.query.q;

  try {
    const response = await axios.get(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${q}`
    );

    const meals = response.data.meals || [];

    const result = meals.map(meal => ({
      id: meal.idMeal,
      name: meal.strMeal,
      category: meal.strCategory,
      area: meal.strArea,
      image: meal.strMealThumb
    }));

    res.json(result);

  } catch (error) {
    res.status(500).json({ error: "Error buscando recetas" });
  }
});

/* Detalle receta */
app.get("/recipes/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const response = await axios.get(
      `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`
    );

    const meal = response.data.meals[0];

    const ingredients = [];

    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];

      if (ingredient && ingredient.trim() !== "") {
        ingredients.push(`${measure} ${ingredient}`);
      }
    }

    res.json({
      id: meal.idMeal,
      name: meal.strMeal,
      category: meal.strCategory,
      area: meal.strArea,
      image: meal.strMealThumb,
      instructions: meal.strInstructions,
      ingredients
    });

  } catch (error) {
    res.status(500).json({ error: "Error detalle receta" });
  }
});

app.listen(process.env.PORT, () => {
  console.log("Recipe Service corriendo en puerto 3003");
});