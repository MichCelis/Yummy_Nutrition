package com.example.yummynutrition.data.api

import android.content.Context
import com.example.yummynutrition.data.auth.AuthInterceptor
import okhttp3.ConnectionPool
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/**
 * Cliente Retrofit centralizado del proyecto.
 *
 * Toda la comunicación pasa por el API Gateway en http://10.0.2.2:3000/api/
 * (10.0.2.2 es la IP especial del emulador Android para llegar al host).
 *
 * El AuthInterceptor adjunta el JWT en cada petición si hay sesión activa.
 *
 * Configuración de robustez:
 * - retryOnConnectionFailure(true): reintenta automáticamente si una conexión
 *   TCP muere a mitad de respuesta (común con HTTP plano + emulador).
 * - ConnectionPool corto: descarta conexiones idle rápidamente para no reusar
 *   sockets en mal estado.
 * - Header "Connection: close": fuerza una conexión nueva por petición,
 *   evitando los "unexpected end of stream" que pasan al reusar sockets.
 */
object RetrofitClient {

    private const val BASE_URL = "http://10.0.2.2:3000/api/"

    @Volatile
    private var backendApi: BackendApiService? = null

    fun getBackendApi(context: Context): BackendApiService {
        return backendApi ?: synchronized(this) {
            backendApi ?: buildBackendApi(context.applicationContext).also {
                backendApi = it
            }
        }
    }

    private fun buildBackendApi(context: Context): BackendApiService {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
        }

        // Interceptor que fuerza Connection: close en cada petición.
        // Esto evita el bug "unexpected end of stream" cuando OkHttp reusa
        // conexiones TCP idle del pool que ya están muertas.
        val noKeepAlive = okhttp3.Interceptor { chain ->
            val request = chain.request().newBuilder()
                .header("Connection", "close")
                .build()
            chain.proceed(request)
        }

        val client = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(context))
            .addInterceptor(noKeepAlive)
            .addInterceptor(logging)
            .connectionPool(ConnectionPool(0, 1, TimeUnit.NANOSECONDS))
            .retryOnConnectionFailure(true)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .writeTimeout(15, TimeUnit.SECONDS)
            .build()

        val retrofit = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        return retrofit.create(BackendApiService::class.java)
    }
}