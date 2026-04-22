package com.example.yummynutrition.ui.theme.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.yummynutrition.ui.theme.md_theme_light_background
import com.example.yummynutrition.ui.theme.md_theme_light_primary
import com.example.yummynutrition.viewmodel.MainViewModel

@Composable
fun NutritionScreen(
    viewModel: MainViewModel = viewModel()
) {
    var query by remember { mutableStateOf("") }
    val food by viewModel.nutrition.collectAsState()
    var quantity by remember { mutableStateOf(1) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(md_theme_light_background)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {

        Text(
            text = "Nutrition",
            style = MaterialTheme.typography.headlineMedium,
            color = Color(0xFF1C1C1C),
            modifier = Modifier.padding(bottom = 16.dp)
        )

        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            label = { Text("Search food (banana, rice, apple)") },
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = md_theme_light_primary,
                focusedLabelColor = md_theme_light_primary,
                cursorColor = md_theme_light_primary,
                unfocusedBorderColor = Color(0xFFBDBDBD)
            )
        )

        Spacer(modifier = Modifier.height(12.dp))

        Button(
            onClick = {
                if (query.isNotBlank()) {
                    viewModel.getNutrition(query)
                }
            },
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = md_theme_light_primary)
        ) {
            Text("Get Nutrition", color = Color.White)
        }

        Spacer(modifier = Modifier.height(24.dp))

        food?.let { item ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = item.description,
                        color = Color(0xFF1C1C1C),
                        style = MaterialTheme.typography.headlineSmall,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )

                    Divider(color = Color(0xFFE0E0E0), thickness = 1.dp)

                    Spacer(modifier = Modifier.height(8.dp))

                    item.foodNutrients.forEach { nutrient ->
                        nutrient.value?.let { value ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 6.dp),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = nutrient.nutrientName,
                                    color = Color(0xFF616161),
                                    style = MaterialTheme.typography.bodyMedium
                                )
                                Text(
                                    text = "$value ${nutrient.unitName}",
                                    color = md_theme_light_primary,
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    if (food == null && query.isNotBlank()) {
                        Text(
                            text = "No results found",
                            color = Color.Red
                        )
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Button(
                            onClick = { if (quantity > 1) quantity-- },
                            modifier = Modifier.size(40.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEEEEEE)),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("-", color = Color(0xFF1C1C1C))
                        }

                        Text(
                            text = quantity.toString(),
                            modifier = Modifier.padding(horizontal = 16.dp),
                            style = MaterialTheme.typography.titleMedium
                        )

                        Button(
                            onClick = { quantity++ },
                            modifier = Modifier.size(40.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEEEEEE)),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("+", color = Color(0xFF1C1C1C))
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = {
                            viewModel.addToCart(item, quantity)
                            repeat(quantity) {
                                viewModel.saveFood(item)
                            }
                            viewModel.loadStats()
                            quantity = 1
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = md_theme_light_primary),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("Add to Cart", color = Color.White)
                    }
                }
            }
        }
    }
}