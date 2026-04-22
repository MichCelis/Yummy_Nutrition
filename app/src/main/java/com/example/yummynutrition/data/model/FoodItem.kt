package com.example.yummynutrition.data.model

data class FoodItem(
    val description: String,
    val foodNutrients: List<FoodNutrient>
)