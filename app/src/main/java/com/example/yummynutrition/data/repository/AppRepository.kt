package com.example.yummynutrition.data.repository

import android.util.Log
import com.example.yummynutrition.data.api.BackendApiService
import com.example.yummynutrition.data.api.RetrofitClient
import com.example.yummynutrition.data.api.StatsResponse
import com.example.yummynutrition.data.api.RecipesApiService
import com.example.yummynutrition.data.model.FoodItem
import com.example.yummynutrition.data.model.FoodNutrient
import com.example.yummynutrition.data.model.RecipeItem
import com.example.yummynutrition.data.model.RecipeResponse

class AppRepository {

    private val backendApi =
        RetrofitClient.getBackendInstance()
            .create(BackendApiService::class.java)

    private val recipesApi =
        RetrofitClient.getRecipesInstance()
            .create(RecipesApiService::class.java)

    // 🍌 Buscar alimentos (TU BACKEND)
    suspend fun getNutrition(food: String): FoodItem? {
        return try {
            val response = backendApi.searchFoods(food)

            Log.d("API", "CODE: ${response.code()}")
            Log.d("API", "BODY: ${response.body()}")

            if (!response.isSuccessful) {
                Log.e("API", "ERROR: ${response.errorBody()?.string()}")
                return null
            }

            val data = response.body()

            if (data == null || data.foods.isEmpty()) {
                Log.e("API", "Respuesta vacía")
                return null
            }

            val item = data.foods.first()

            Log.d("API", "ITEM: $item")

            return FoodItem(
                description = item.name,
                foodNutrients = listOf(
                    FoodNutrient("Energy", item.calories ?: 0.0, "kcal"),
                    FoodNutrient("Protein", item.protein ?: 0.0, "g"),
                    FoodNutrient("Carbohydrate", item.carbs ?: 0.0, "g"),
                    FoodNutrient("Fat", item.fat ?: 0.0, "g")
                )
            )

        } catch (e: Exception) {
            Log.e("API", "EXCEPTION: ${e.message}", e)
            null
        }
    }

    // 💾 Guardar comida (TU BACKEND)
    suspend fun saveFood(food: FoodItem) {
        try {
            backendApi.saveFood(
                mapOf(
                    "userId" to 1,
                    "food" to food.description,
                    "calories" to food.nutrientValue("Energy"),
                    "protein" to food.nutrientValue("Protein"),
                    "carbs" to food.nutrientValue("Carbohydrate"),
                    "fat" to food.nutrientValue("Fat")
                )
            )
        } catch (e: Exception) {
            Log.e("API", "Error guardando comida", e)
        }
    }

    // 📊 Stats reales
    suspend fun getStats(): StatsResponse? =
        try {
            backendApi.getStats(1).body()
        } catch (e: Exception) {
            Log.e("API", "Error obteniendo stats", e)
            null
        }

    // 🍗 Buscar recetas
    suspend fun searchRecipes(query: String): RecipeResponse? =
        try {
            recipesApi.searchRecipes(query)
        } catch (e: Exception) {
            Log.e("API", "Error recetas", e)
            null
        }

    // 📖 Receta por ID
    suspend fun getRecipeById(id: String): RecipeItem? =
        try {
            recipesApi.getRecipeById(id).meals?.firstOrNull()
        } catch (e: Exception) {
            Log.e("API", "Error detalle receta", e)
            null
        }
}

// 🔹 Helper
private fun FoodItem.nutrientValue(vararg keys: String): Double {
    return this.foodNutrients
        .firstOrNull { n -> keys.any { key -> n.nutrientName.contains(key, true) } }
        ?.value ?: 0.0
}