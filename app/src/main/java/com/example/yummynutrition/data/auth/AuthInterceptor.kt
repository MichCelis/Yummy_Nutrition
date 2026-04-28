package com.example.yummynutrition.data.auth

import android.content.Context
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response

/**
 * Interceptor de OkHttp que adjunta automáticamente el header
 * Authorization: Bearer <token> en cada petición saliente, si hay
 * sesión activa.
 *
 * Las rutas que NO requieren autenticación (login, register, búsquedas)
 * también reciben el header si existe; el backend simplemente lo ignora
 * cuando no es necesario.
 */
class AuthInterceptor(private val context: Context) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()

        // Lectura síncrona del token desde DataStore.
        // runBlocking aquí es seguro porque el interceptor corre en un
        // thread de OkHttp, no en el main thread.
        val token = runBlocking { SessionManager.getTokenSync(context) }

        val request = if (!token.isNullOrBlank()) {
            original.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        } else {
            original
        }

        return chain.proceed(request)
    }
}