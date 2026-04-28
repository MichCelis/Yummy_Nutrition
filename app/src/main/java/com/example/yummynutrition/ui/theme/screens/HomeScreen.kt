package com.example.yummynutrition.ui.theme.screens

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.example.yummynutrition.data.auth.SessionManager
import com.example.yummynutrition.navigation.Screen
import com.example.yummynutrition.ui.theme.md_theme_light_background
import com.example.yummynutrition.ui.theme.md_theme_light_primary
import com.example.yummynutrition.ui.theme.md_theme_light_secondary
import com.example.yummynutrition.viewmodel.AuthViewModel
import com.example.yummynutrition.viewmodel.MainViewModel
import androidx.compose.foundation.clickable

@Composable
fun HomeScreen(
    navController: NavController,
    viewModel: MainViewModel = viewModel(),
    authViewModel: AuthViewModel = viewModel()
) {
    val context = LocalContext.current
    // Datos de la sesión activa
    val savedName by SessionManager.userNameFlow(context).collectAsState(initial = "")
    val userId by SessionManager.userIdFlow(context).collectAsState(initial = null)
    val stats by viewModel.stats.collectAsState()

    // Totales reales del backend (vienen de stats-service)
    val todayCalories = stats?.todayCalories?.toInt() ?: 0
    val todayProtein = stats?.todayProtein?.toInt() ?: 0
    val todayCarbs = stats?.todayCarbs?.toInt() ?: 0
    val todayFats = stats?.todayFat?.toInt() ?: 0

    LaunchedEffect(userId) {
        if (userId != null) {
            viewModel.loadStats()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(md_theme_light_background)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {

        // 🔝 Header con saludo y botón de logout
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = if (savedName.isNotBlank()) "Hello, $savedName 👋" else "Hello 👋",
                    style = MaterialTheme.typography.headlineMedium,
                    color = Color(0xFF1C1C1C)
                )
                Text(
                    text = "Your nutritional summary today",
                    color = Color(0xFF616161)
                )
            }

            IconButton(
                onClick = {
                    viewModel.clearAll()      // ← limpia datos viejos
                    authViewModel.logout()    // ← borra token de DataStore
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            ) {
                Icon(
                    imageVector = Icons.Default.ExitToApp,
                    contentDescription = "Cerrar sesión",
                    tint = md_theme_light_primary
                )
            }
        }

        Card(
            colors = CardDefaults.cardColors(containerColor = Color.White),
            shape = RoundedCornerShape(28.dp),
            modifier = Modifier
                .fillMaxWidth()
                .shadow(elevation = 4.dp, shape = RoundedCornerShape(28.dp))
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("TODAY'S CALORIES", color = Color(0xFF9E9E9E))
                Text(
                    "$todayCalories kcal",
                    style = MaterialTheme.typography.headlineLarge,
                    color = md_theme_light_primary
                )
                Text(
                    "${stats?.mealsToday ?: 0} meals today",
                    color = Color(0xFF757575),
                    style = MaterialTheme.typography.labelLarge
                )
            }
        }

        Card(
            colors = CardDefaults.cardColors(containerColor = Color.White),
            shape = RoundedCornerShape(24.dp),
            modifier = Modifier
                .fillMaxWidth()
                .shadow(elevation = 2.dp, shape = RoundedCornerShape(24.dp))
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Text(
                    "Macronutrients",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color(0xFF1C1C1C)
                )

                MacroBar("Protein", todayProtein, md_theme_light_primary)
                MacroBar("Carbohydrates", todayCarbs, md_theme_light_secondary)
                MacroBar("Fats", todayFats, Color(0xFFFF9800))
            }
        }

        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFFFFC107)),
            shape = RoundedCornerShape(22.dp),
            modifier = Modifier
                .fillMaxWidth()
                .clickable { navController.navigate(Screen.History.route) }
        ) {
            Row(
                modifier = Modifier
                    .padding(18.dp)
                    .fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        "Meal History",
                        color = Color.Black,
                        style = MaterialTheme.typography.titleMedium
                    )
                    Text(
                        "View all your logged meals",
                        color = Color(0xFF424242),
                        style = MaterialTheme.typography.bodySmall
                    )
                }
                Text(
                    "${stats?.mealsToday ?: 0}",
                    color = Color.Black,
                    style = MaterialTheme.typography.headlineSmall
                )
            }
        }

        Button(
            onClick = { navController.navigate(Screen.Recipes.route) },
            colors = ButtonDefaults.buttonColors(containerColor = md_theme_light_secondary),
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp)
        ) {
            Text("Explore healthy recipes", color = Color.White)
        }

        Button(
            onClick = { navController.navigate(Screen.Nutrition.route) },
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4CAF50)),
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp)
        ) {
            Text("Search nutrition info", color = Color.White)
        }
    }
}

@Composable
fun MacroBar(label: String, value: Int, barColor: Color) {

    val max = when (label) {
        "Protein" -> 100f
        "Carbohydrates" -> 300f
        "Fats" -> 70f
        else -> 100f
    }

    val animatedProgress by animateFloatAsState(
        targetValue = (value / max).coerceIn(0f, 1f),
        animationSpec = tween(800),
        label = ""
    )

    Column {
        Text(
            text = "$label: $value g",
            color = Color(0xFF424242)
        )

        Spacer(modifier = Modifier.height(6.dp))

        Row(
            modifier = Modifier
                .height(14.dp)
                .fillMaxWidth()
                .background(Color(0xFFEEEEEE), RoundedCornerShape(12.dp))
        ) {
            Spacer(
                modifier = Modifier
                    .height(14.dp)
                    .fillMaxWidth(animatedProgress)
                    .background(barColor, RoundedCornerShape(12.dp))
            )
        }
    }
}