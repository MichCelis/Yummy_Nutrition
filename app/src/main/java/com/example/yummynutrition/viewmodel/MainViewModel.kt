package com.example.yummynutrition.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.yummynutrition.data.api.StatsResponse
import com.example.yummynutrition.data.model.FoodItem
import com.example.yummynutrition.data.model.RecipeItem
import com.example.yummynutrition.data.repository.AppRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class CartItem(
    val id: String = System.currentTimeMillis().toString(),
    val foodItem: FoodItem,
    val quantity: Int = 1
)

class MainViewModel : ViewModel() {

    private val repo = AppRepository()

    private val _recipes = MutableStateFlow<List<RecipeItem>>(emptyList())
    val recipes: StateFlow<List<RecipeItem>> = _recipes

    private val _stats = MutableStateFlow<StatsResponse?>(null)
    val stats: StateFlow<StatsResponse?> = _stats

    fun loadStats() {
        viewModelScope.launch {
            _stats.value = repo.getStats()
        }
    }

    private val _nutrition = MutableStateFlow<FoodItem?>(null)
    val nutrition: StateFlow<FoodItem?> = _nutrition

    private val _selectedRecipe = MutableStateFlow<RecipeItem?>(null)
    val selectedRecipe: StateFlow<RecipeItem?> = _selectedRecipe

    // 🛒 CARRITO
    private val _cart = MutableStateFlow<List<CartItem>>(emptyList())
    val cart: StateFlow<List<CartItem>> = _cart

    fun searchRecipes(query: String) {
        viewModelScope.launch {
            val response = repo.searchRecipes(query)
            _recipes.value = response?.meals ?: emptyList()
        }
    }

    fun getNutrition(food: String) {
        viewModelScope.launch {
            val result = repo.getNutrition(food)

            println("DEBUG RESULT: $result")

            _nutrition.value = result
        }
    }

    fun loadRecipeById(id: String) {
        viewModelScope.launch {
            _selectedRecipe.value = repo.getRecipeById(id)
        }
    }

    // 🛒 FUNCIONES DEL CARRITO
    fun addToCart(foodItem: FoodItem, quantity: Int = 1) {
        val currentCart = _cart.value.toMutableList()
        val existingItem = currentCart.find { it.foodItem.description == foodItem.description }

        if (existingItem != null) {
            // Si ya existe, aumenta la cantidad
            val updatedItem = existingItem.copy(quantity = existingItem.quantity + quantity)
            currentCart[currentCart.indexOf(existingItem)] = updatedItem
        } else {
            // Si no existe, lo agrega
            currentCart.add(CartItem(foodItem = foodItem, quantity = quantity))
        }

        _cart.value = currentCart
    }

    fun removeFromCart(cartItemId: String) {
        val currentCart = _cart.value.toMutableList()
        currentCart.removeAll { it.id == cartItemId }
        _cart.value = currentCart
    }

    fun clearCart() {
        _cart.value = emptyList()
    }

    fun updateQuantity(cartItemId: String, newQuantity: Int) {
        if (newQuantity <= 0) {
            removeFromCart(cartItemId)
            return
        }

        val currentCart = _cart.value.toMutableList()
        val index = currentCart.indexOfFirst { it.id == cartItemId }
        if (index >= 0) {
            currentCart[index] = currentCart[index].copy(quantity = newQuantity)
            _cart.value = currentCart
        }
    }

    // 📊 TOTALES DEL CARRITO
    fun getCartTotalCalories(): Int {
        return _cart.value.sumOf { cartItem ->
            val calories = cartItem.foodItem.nutrientValue("Energy").toInt()
            calories * cartItem.quantity
        }.toInt()
    }

    fun getCartTotalProtein(): Int {
        return _cart.value.sumOf { cartItem ->
            val protein = cartItem.foodItem.nutrientValue("Protein").toInt()
            protein * cartItem.quantity
        }.toInt()
    }

    fun getCartTotalCarbs(): Int {
        return _cart.value.sumOf { cartItem ->
            val carbs = cartItem.foodItem.nutrientValue("Carbohydrate").toInt()
            carbs * cartItem.quantity
        }.toInt()
    }

    fun getCartTotalFats(): Int {
        return _cart.value.sumOf { cartItem ->
            val fats = cartItem.foodItem.nutrientValue("Total lipid", "Fat").toInt()
            fats * cartItem.quantity
        }.toInt()
    }

    fun saveFood(food: FoodItem) {
        viewModelScope.launch {
            repo.saveFood(food)
        }
    }

    fun getCartItemCount(): Int {
        return _cart.value.size
    }
}

// 🔹 Helper para obtener nutrientes
private fun FoodItem.nutrientValue(vararg keys: String): Double {
    return this.foodNutrients
        .firstOrNull { n -> keys.any { key -> n.nutrientName.contains(key, true) } }
        ?.value ?: 0.0
}