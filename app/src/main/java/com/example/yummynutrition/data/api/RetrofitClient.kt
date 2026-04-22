package com.example.yummynutrition.data.api

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RetrofitClient {

    fun getNutritionInstance(): Retrofit =
        Retrofit.Builder()
            .baseUrl("https://api.nal.usda.gov/fdc/v1/")
            .addConverterFactory(GsonConverterFactory.create())
            .build()

    fun getRecipesInstance(): Retrofit =
        Retrofit.Builder()
            .baseUrl("https://www.themealdb.com/api/json/v1/1/")
            .addConverterFactory(GsonConverterFactory.create())
            .build()

    fun getBackendInstance(): Retrofit {
        return Retrofit.Builder()
            .baseUrl("http://10.0.2.2:3002/")
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
}

