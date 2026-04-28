package com.example.yummynutrition.data.auth

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private const val SESSION_NAME = "yummy_session"
val Context.sessionDataStore by preferencesDataStore(name = SESSION_NAME)

object SessionManager {
    private val KEY_TOKEN = stringPreferencesKey("jwt_token")
    private val KEY_USER_ID = intPreferencesKey("user_id")
    private val KEY_USER_NAME = stringPreferencesKey("user_name")
    private val KEY_USER_EMAIL = stringPreferencesKey("user_email")

    /** Guarda la sesión completa tras login/registro exitoso */
    suspend fun saveSession(
        context: Context,
        token: String,
        userId: Int,
        name: String,
        email: String
    ) {
        context.sessionDataStore.edit { prefs ->
            prefs[KEY_TOKEN] = token
            prefs[KEY_USER_ID] = userId
            prefs[KEY_USER_NAME] = name
            prefs[KEY_USER_EMAIL] = email
        }
    }

    /** Borra la sesión (logout o 401) */
    suspend fun clearSession(context: Context) {
        context.sessionDataStore.edit { prefs -> prefs.clear() }
    }

    /** Token JWT como Flow reactivo */
    fun tokenFlow(context: Context): Flow<String?> =
        context.sessionDataStore.data.map { prefs -> prefs[KEY_TOKEN] }

    /** ID del usuario logueado */
    fun userIdFlow(context: Context): Flow<Int?> =
        context.sessionDataStore.data.map { prefs -> prefs[KEY_USER_ID] }

    /** Nombre del usuario logueado */
    fun userNameFlow(context: Context): Flow<String> =
        context.sessionDataStore.data.map { prefs -> prefs[KEY_USER_NAME].orEmpty() }

    /** Lectura síncrona del token (uso interno del interceptor) */
    suspend fun getTokenSync(context: Context): String? =
        context.sessionDataStore.data.first()[KEY_TOKEN]

    /** Lectura síncrona del userId */
    suspend fun getUserIdSync(context: Context): Int? =
        context.sessionDataStore.data.first()[KEY_USER_ID]

    /** ¿Hay una sesión activa? */
    fun isLoggedInFlow(context: Context): Flow<Boolean> =
        tokenFlow(context).map { it != null && it.isNotBlank() }
}