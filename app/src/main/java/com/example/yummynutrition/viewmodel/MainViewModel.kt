package com.example.yummynutrition.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.yummynutrition.data.api.LogResponse
import com.example.yummynutrition.data.api.RecipeDetailResponse
import com.example.yummynutrition.data.api.RecipeDto
import com.example.yummynutrition.data.api.StatsResponse
import com.example.yummynutrition.data.model.FoodItem
import com.example.yummynutrition.data.repository.AppRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val repo = AppRepository(application)

    // ---------- Recetas ----------
    private val _recipes = MutableStateFlow<List<RecipeDto>>(emptyList())
    val recipes: StateFlow<List<RecipeDto>> = _recipes

    private val _selectedRecipe = MutableStateFlow<RecipeDetailResponse?>(null)
    val selectedRecipe: StateFlow<RecipeDetailResponse?> = _selectedRecipe

    // ---------- Stats ----------
    private val _stats = MutableStateFlow<StatsResponse?>(null)
    val stats: StateFlow<StatsResponse?> = _stats

    // ---------- Nutrición buscada ----------
    private val _nutrition = MutableStateFlow<FoodItem?>(null)
    val nutrition: StateFlow<FoodItem?> = _nutrition

    // ---------- Historial de comidas ----------
    private val _logs = MutableStateFlow<List<LogResponse>>(emptyList())
    val logs: StateFlow<List<LogResponse>> = _logs

    private val _isLoadingLogs = MutableStateFlow(false)
    val isLoadingLogs: StateFlow<Boolean> = _isLoadingLogs

    // ============ Acciones ============

    fun loadStats() {
        viewModelScope.launch {
            _stats.value = repo.getStats()
        }
    }

    fun searchRecipes(query: String) {
        viewModelScope.launch {
            _recipes.value = repo.searchRecipes(query)
        }
    }

    fun getNutrition(food: String) {
        viewModelScope.launch {
            _nutrition.value = repo.searchFood(food)
        }
    }

    fun loadRecipeById(id: String) {
        viewModelScope.launch {
            _selectedRecipe.value = repo.getRecipeById(id)
        }
    }

    fun saveFood(food: FoodItem, onResult: (Boolean) -> Unit = {}) {
        viewModelScope.launch {
            val ok = repo.saveFood(food)
            if (ok) loadStats() // recarga stats tras registrar comida
            onResult(ok)
        }
    }

    fun loadLogs() {
        viewModelScope.launch {
            _isLoadingLogs.value = true
            _logs.value = repo.getLogs()
            _isLoadingLogs.value = false
        }
    }

    fun deleteLog(id: Int) {
        viewModelScope.launch {
            val ok = repo.deleteLog(id)
            if (ok) {
                // Optimistic update local + recarga stats para reflejar en home
                _logs.value = _logs.value.filterNot { it.id == id }
                loadStats()
            }
        }
    }

    /** Limpia todos los datos del ViewModel. Se llama al cerrar sesión. */
    fun clearAll() {
        _stats.value = null
        _recipes.value = emptyList()
        _selectedRecipe.value = null
        _nutrition.value = null
        _logs.value = emptyList()
    }
}