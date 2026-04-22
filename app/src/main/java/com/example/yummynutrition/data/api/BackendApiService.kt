package com.example.yummynutrition.data.api

import retrofit2.Response
import retrofit2.http.*

data class FoodResponse(
    val source: String,
    val foods: List<FoodDto>
)

data class FoodDto(
    val name: String,
    val calories: Double,
    val protein: Double,
    val carbs: Double,
    val fat: Double
)

data class StatsResponse(
    val todayCalories: Int,
    val todayProtein: Int,
    val todayCarbs: Int,
    val todayFat: Double,
    val mealsToday: Int
)



interface BackendApiService {

    @GET("foods/search")
    suspend fun searchFoods(
        @Query("q") query: String
    ): Response<FoodResponse>

    @POST("logs")
    suspend fun saveFood(
        @Body body: Map<String, Any>
    ): Response<Unit>

    @GET("stats/{userId}")
    suspend fun getStats(
        @Path("userId") userId: Int
    ): Response<StatsResponse>
}