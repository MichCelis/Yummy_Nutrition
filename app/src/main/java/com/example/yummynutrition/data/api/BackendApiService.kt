package com.example.yummynutrition.data.api

import retrofit2.Response
import retrofit2.http.*

// ==================== DTOs ====================

data class RegisterRequest(
    val name: String,
    val email: String,
    val password: String
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class AuthUserDto(
    val id: Int,
    val name: String,
    val email: String
)

data class LoginResponse(
    val message: String,
    val token: String,
    val user: AuthUserDto
)

data class RegisterResponse(
    val message: String
)

data class FoodDto(
    val name: String,
    val calories: Double,
    val protein: Double,
    val carbs: Double,
    val fat: Double
)

data class FoodResponse(
    val source: String,
    val foods: List<FoodDto>
)

data class RecipeDto(
    val id: String,
    val name: String,
    val category: String?,
    val area: String?,
    val image: String?
)

data class RecipeSearchResponse(
    val source: String,
    val query: String,
    val recipes: List<RecipeDto>
)

data class RecipeDetailResponse(
    val source: String,
    val id: String,
    val name: String,
    val category: String?,
    val area: String?,
    val image: String?,
    val instructions: String?,
    val ingredients: List<String>,
    val youtube: String?
)

data class StatsResponse(
    val userId: Int,
    val date: String,
    val todayCalories: Double,
    val todayProtein: Double,
    val todayCarbs: Double,
    val todayFat: Double,
    val mealsToday: Int,
    val source: String?
)

data class LogResponse(
    val id: Int,
    val user_id: Int,
    val food: String,
    val calories: String,
    val protein: String,
    val carbs: String,
    val fat: String,
    val created_at: String
)

data class CreateLogResponse(
    val message: String,
    val log: LogResponse
)

// ==================== INTERFAZ ====================

interface BackendApiService {

    // ----- AUTH -----
    @POST("auth/register")
    suspend fun register(@Body body: RegisterRequest): Response<RegisterResponse>

    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): Response<LoginResponse>

    // ----- FOODS -----
    @GET("foods/search")
    suspend fun searchFoods(@Query("q") query: String): Response<FoodResponse>

    // ----- RECIPES -----
    @GET("recipes/search")
    suspend fun searchRecipes(@Query("q") query: String): Response<RecipeSearchResponse>

    @GET("recipes/{id}")
    suspend fun getRecipeById(@Path("id") id: String): Response<RecipeDetailResponse>

    // ----- LOGS -----
    @POST("logs")
    suspend fun createLog(@Body body: Map<String, @JvmSuppressWildcards Any>): Response<CreateLogResponse>

    @GET("logs")
    suspend fun getLogs(): Response<List<LogResponse>>

    @DELETE("logs/{id}")
    suspend fun deleteLog(@Path("id") id: Int): Response<Map<String, Any>>

    // ----- STATS -----
    @GET("stats/{userId}")
    suspend fun getStats(@Path("userId") userId: Int): Response<StatsResponse>
}