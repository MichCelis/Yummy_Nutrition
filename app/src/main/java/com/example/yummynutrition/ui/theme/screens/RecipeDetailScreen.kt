package com.example.yummynutrition.ui.theme.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import coil.compose.rememberAsyncImagePainter
import com.example.yummynutrition.ui.theme.md_theme_light_background
import com.example.yummynutrition.ui.theme.md_theme_light_primary
import com.example.yummynutrition.viewmodel.MainViewModel

@Composable
fun RecipeDetailScreen(
    id: String,
    navController: NavController,
    viewModel: MainViewModel = viewModel()
) {
    val recipe by viewModel.selectedRecipe.collectAsState()

    LaunchedEffect(id) {
        viewModel.loadRecipeById(id)
    }

    if (recipe == null) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(md_theme_light_background),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator(color = md_theme_light_primary)
        }
        return
    }

    val meal = recipe!!

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(md_theme_light_background)
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {

        // 🔙 BOTÓN BACK
        IconButton(onClick = { navController.popBackStack() }) {
            Icon(
                imageVector = Icons.Default.ArrowBack,
                contentDescription = "Back",
                tint = md_theme_light_primary
            )
        }

        Card(
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            Image(
                painter = rememberAsyncImagePainter(meal.image),
                contentDescription = meal.name,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(260.dp),
                contentScale = ContentScale.Crop
            )
        }

        Text(
            meal.name,
            color = Color(0xFF1C1C1C),
            style = MaterialTheme.typography.headlineLarge,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        Card(
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    "Instrucciones",
                    color = md_theme_light_primary,
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                Text(
                    text = meal.instructions ?: "Sin instrucciones disponibles",
                    color = Color(0xFF424242),
                    style = MaterialTheme.typography.bodyMedium.copy(
                        lineHeight = 24.sp
                    )
                )
            }
        }
    }
}