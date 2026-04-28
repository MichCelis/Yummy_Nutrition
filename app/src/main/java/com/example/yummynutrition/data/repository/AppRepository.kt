package com.example.yummynutrition.data.repository

import android.content.Context
import android.util.Log
import com.example.yummynutrition.data.api.*
import com.example.yummynutrition.data.auth.SessionManager
import com.example.yummynutrition.data.model.FoodItem
import com.example.yummynutrition.data.model.FoodNutrient

/**
 * Capa única de acceso a datos del cliente.
 * Toda la comunicación con el backend pasa por aquí.
 *
 * Recibe Context para poder acceder al SessionManager (token, userId).
 */
class AppRepository(private val context: Context) {

    private val api: BackendApiService = RetrofitClient.getBackendApi(context)

    // ==================== AUTH ====================

    suspend fun register(name: String, email: String, password: String): RegisterResult {
        return try {
            val response = api.register(RegisterRequest(name, email, password))
            if (response.isSuccessful) {
                RegisterResult.Success
            } else {
                val msg = when (response.code()) {
                    400 -> "El email ya está registrado"
                    else -> "Error en el registro (${response.code()})"
                }
                RegisterResult.Error(msg)
            }
        } catch (e: Exception) {
            Log.e("API", "Register exception", e)
            RegisterResult.Error("No se pudo conectar con el servidor")
        }
    }

    suspend fun login(email: String, password: String): LoginResult {
        return try {
            val response = api.login(LoginRequest(email, password))
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    SessionManager.saveSession(
                        context = context,
                        token = body.token,
                        userId = body.user.id,
                        name = body.user.name,
                        email = body.user.email
                    )
                    LoginResult.Success
                } else {
                    LoginResult.Error("Respuesta vacía del servidor")
                }
            } else {
                val msg = when (response.code()) {
                    404 -> "Usuario no existe"
                    401 -> "Contraseña incorrecta"
                    else -> "Error de login (${response.code()})"
                }
                LoginResult.Error(msg)
            }
        } catch (e: Exception) {
            Log.e("API", "Login exception", e)
            LoginResult.Error("No se pudo conectar con el servidor")
        }
    }

    /**
     * Cierra la sesión local. No requiere petición al backend porque los
     * JWT son stateless y caducan solos.
     */
    suspend fun logout() {
        SessionManager.clearSession(context)
    }

    // ==================== FOODS ====================

    suspend fun searchFood(query: String): FoodItem? {
        return try {
            val response = api.searchFoods(query)
            if (!response.isSuccessful) {
                Log.e("API", "searchFood failed: ${response.code()}")
                return null
            }
            val data = response.body()
            if (data == null || data.foods.isEmpty()) {
                return null
            }
            val item = data.foods.first()
            FoodItem(
                description = item.name,
                foodNutrients = listOf(
                    FoodNutrient("Energy", item.calories, "kcal"),
                    FoodNutrient("Protein", item.protein, "g"),
                    FoodNutrient("Carbohydrate", item.carbs, "g"),
                    FoodNutrient("Fat", item.fat, "g")
                )
            )
        } catch (e: Exception) {
            Log.e("API", "searchFood exception", e)
            null
        }
    }

    // ==================== LOGS ====================

    /**
     * Registra un consumo de comida en el backend.
     * Nota: el backend extrae el user_id del JWT automáticamente,
     * NO se manda en el body.
     */
    suspend fun saveFood(food: FoodItem): Boolean {
        return try {
            val body = mapOf(
                "food" to food.description,
                "calories" to food.nutrientValue("Energy"),
                "protein" to food.nutrientValue("Protein"),
                "carbs" to food.nutrientValue("Carbohydrate"),
                "fat" to food.nutrientValue("Fat")
            )
            val response = api.createLog(body)
            response.isSuccessful
        } catch (e: Exception) {
            Log.e("API", "saveFood exception", e)
            false
        }
    }

    suspend fun getLogs(): List<LogResponse> {
        return try {
            val response = api.getLogs()
            response.body() ?: emptyList()
        } catch (e: Exception) {
            Log.e("API", "getLogs exception", e)
            emptyList()
        }
    }

    suspend fun deleteLog(id: Int): Boolean {
        return try {
            api.deleteLog(id).isSuccessful
        } catch (e: Exception) {
            Log.e("API", "deleteLog exception", e)
            false
        }
    }

    // ==================== STATS ====================

    suspend fun getStats(): StatsResponse? {
        var userId = SessionManager.getUserIdSync(context)
        var attempts = 0
        while (userId == null && attempts < 3) {
            kotlinx.coroutines.delay(150)
            userId = SessionManager.getUserIdSync(context)
            attempts++
        }
        if (userId == null) return null

        // Retry automático para mitigar ProtocolException intermitente con HTTP
        // plano + emulador Android. El backend responde correctamente, pero a
        // veces OkHttp recibe un stream incompleto. Reintentamos hasta 3 veces.
        repeat(3) { attempt ->
            try {
                val response = api.getStats(userId)
                if (response.isSuccessful) {
                    return response.body()
                } else {
                    Log.e("API", "getStats HTTP ${response.code()} (intento ${attempt + 1})")
                    return null
                }
            } catch (e: Exception) {
                if (attempt == 2) {
                    Log.e("API", "getStats agotó reintentos", e)
                    return null
                }
                kotlinx.coroutines.delay(200)
            }
        }
        return null
    }

    // ==================== RECIPES ====================

    suspend fun searchRecipes(query: String): List<RecipeDto> {
        return try {
            val response = api.searchRecipes(query)
            response.body()?.recipes ?: emptyList()
        } catch (e: Exception) {
            Log.e("API", "searchRecipes exception", e)
            emptyList()
        }
    }

    suspend fun getRecipeById(id: String): RecipeDetailResponse? {
        return try {
            api.getRecipeById(id).body()
        } catch (e: Exception) {
            Log.e("API", "getRecipeById exception", e)
            null
        }
    }
}

// ==================== RESULTS (sealed classes) ====================

sealed class LoginResult {
    object Success : LoginResult()
    data class Error(val message: String) : LoginResult()
}

sealed class RegisterResult {
    object Success : RegisterResult()
    data class Error(val message: String) : RegisterResult()
}

// ==================== HELPER ====================

private fun FoodItem.nutrientValue(vararg keys: String): Double {
    return this.foodNutrients
        .firstOrNull { n -> keys.any { key -> n.nutrientName.contains(key, true) } }
        ?.value ?: 0.0
}