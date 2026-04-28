package com.example.yummynutrition.ui.theme.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.example.yummynutrition.data.api.LogResponse
import com.example.yummynutrition.ui.theme.md_theme_light_background
import com.example.yummynutrition.ui.theme.md_theme_light_primary
import com.example.yummynutrition.ui.theme.md_theme_light_secondary
import com.example.yummynutrition.viewmodel.MainViewModel
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
fun HistoryScreen(
    navController: NavController,
    viewModel: MainViewModel = viewModel()
) {
    val logs by viewModel.logs.collectAsState()
    val isLoading by viewModel.isLoadingLogs.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadLogs()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(md_theme_light_background)
            .padding(16.dp)
    ) {
        // Header con back button
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = { navController.popBackStack() }) {
                Icon(
                    imageVector = Icons.Default.ArrowBack,
                    contentDescription = "Back",
                    tint = md_theme_light_primary
                )
            }
            Text(
                text = "Meal History",
                style = MaterialTheme.typography.headlineMedium,
                color = Color(0xFF1C1C1C),
                modifier = Modifier.padding(start = 8.dp)
            )
        }

        when {
            isLoading && logs.isEmpty() -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = md_theme_light_primary)
                }
            }

            logs.isEmpty() -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "🍽️",
                            style = MaterialTheme.typography.displayLarge
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "No meals logged yet",
                            color = Color(0xFF616161),
                            style = MaterialTheme.typography.bodyLarge
                        )
                        Text(
                            text = "Search a food in Nutrition and log it",
                            color = Color(0xFF9E9E9E),
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                }
            }

            else -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(logs, key = { it.id }) { log ->
                        LogItemCard(
                            log = log,
                            onDelete = { viewModel.deleteLog(log.id) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun LogItemCard(
    log: LogResponse,
    onDelete: () -> Unit
) {
    val calories = log.calories.toDoubleOrNull()?.toInt() ?: 0
    val protein = log.protein.toDoubleOrNull() ?: 0.0
    val carbs = log.carbs.toDoubleOrNull() ?: 0.0
    val fat = log.fat.toDoubleOrNull() ?: 0.0

    Card(
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = log.food,
                        style = MaterialTheme.typography.titleMedium,
                        color = Color(0xFF1C1C1C),
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(
                        text = formatTimestamp(log.created_at),
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF9E9E9E),
                        modifier = Modifier.padding(top = 2.dp)
                    )
                }
                IconButton(
                    onClick = onDelete,
                    modifier = Modifier.size(36.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = "Delete log",
                        tint = Color(0xFFD32F2F)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))
            Divider(color = Color(0xFFEEEEEE), thickness = 1.dp)
            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                MacroChip("$calories", "kcal", md_theme_light_primary)
                MacroChip(formatGrams(protein), "Protein", md_theme_light_primary)
                MacroChip(formatGrams(carbs), "Carbs", md_theme_light_secondary)
                MacroChip(formatGrams(fat), "Fat", Color(0xFFFF9800))
            }
        }
    }
}

@Composable
private fun MacroChip(value: String, label: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = value,
            color = color,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = label,
            color = Color(0xFF9E9E9E),
            style = MaterialTheme.typography.labelSmall
        )
    }
}

private fun formatGrams(value: Double): String {
    return if (value == value.toInt().toDouble()) "${value.toInt()}g"
    else String.format(Locale.US, "%.1fg", value)
}

/**
 * Formatea el created_at del backend a hora local de México (America/Mexico_City).
 * El backend envía timestamps en UTC (formato ISO-8601 con sufijo Z o sin zona).
 * Forzamos la conversión a México para que la hora mostrada sea siempre la del
 * negocio, sin importar la zona del dispositivo.
 */
private fun formatTimestamp(raw: String): String {
    val mexicoZone = ZoneId.of("America/Mexico_City")

    return try {
        val zoned: ZonedDateTime = try {
            // Caso 1: timestamp con offset explícito (ej: "2026-04-27T18:12:30Z" o "...-06:00")
            OffsetDateTime.parse(raw).atZoneSameInstant(mexicoZone)
        } catch (e: Exception) {
            // Caso 2: sin zona → asumimos UTC (default de PostgreSQL al serializar)
            val cleaned = raw.removeSuffix("Z")
            java.time.LocalDateTime.parse(cleaned)
                .atZone(ZoneId.of("UTC"))
                .withZoneSameInstant(mexicoZone)
        }

        val today = java.time.LocalDate.now(mexicoZone)
        val timeFmt = DateTimeFormatter.ofPattern("HH:mm", Locale.getDefault())

        if (zoned.toLocalDate() == today) {
            "Today at ${zoned.format(timeFmt)}"
        } else {
            val dateFmt = DateTimeFormatter.ofPattern("MMM d, HH:mm", Locale.getDefault())
            zoned.format(dateFmt)
        }
    } catch (e: Exception) {
        raw
    }
}