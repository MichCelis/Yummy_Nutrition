package com.example.yummynutrition.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.yummynutrition.data.auth.SessionManager
import com.example.yummynutrition.data.repository.AppRepository
import com.example.yummynutrition.data.repository.LoginResult
import com.example.yummynutrition.data.repository.RegisterResult
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class AuthViewModel(application: Application) : AndroidViewModel(application) {

    private val repo = AppRepository(application)

    // Flujo reactivo: ¿hay sesión activa?
    val isLoggedIn: Flow<Boolean> = SessionManager.isLoggedInFlow(application)
    val userName: Flow<String> = SessionManager.userNameFlow(application)

    // Estado de UI para login
    private val _loginState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
    val loginState: StateFlow<AuthUiState> = _loginState

    // Estado de UI para registro
    private val _registerState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
    val registerState: StateFlow<AuthUiState> = _registerState

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _loginState.value = AuthUiState.Loading
            _loginState.value = when (val result = repo.login(email, password)) {
                is LoginResult.Success -> AuthUiState.Success
                is LoginResult.Error -> AuthUiState.Error(result.message)
            }
        }
    }

    fun register(name: String, email: String, password: String) {
        viewModelScope.launch {
            _registerState.value = AuthUiState.Loading
            _registerState.value = when (val result = repo.register(name, email, password)) {
                is RegisterResult.Success -> {
                    // Tras registro exitoso, hacemos login automático para obtener el JWT
                    when (val loginResult = repo.login(email, password)) {
                        is LoginResult.Success -> AuthUiState.Success
                        is LoginResult.Error -> AuthUiState.Error(loginResult.message)
                    }
                }
                is RegisterResult.Error -> AuthUiState.Error(result.message)
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            repo.logout()
            _loginState.value = AuthUiState.Idle
            _registerState.value = AuthUiState.Idle
        }
    }

    fun resetState() {
        _loginState.value = AuthUiState.Idle
        _registerState.value = AuthUiState.Idle
    }
}

sealed class AuthUiState {
    object Idle : AuthUiState()
    object Loading : AuthUiState()
    object Success : AuthUiState()
    data class Error(val message: String) : AuthUiState()
}