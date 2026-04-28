package com.example.yummynutrition.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.*
import com.example.yummynutrition.ui.theme.Meals
import com.example.yummynutrition.ui.theme.screens.*
import com.example.yummynutrition.viewmodel.AuthViewModel
import com.example.yummynutrition.viewmodel.MainViewModel

// 🔹 Definición de rutas
sealed class Screen(
    val route: String,
    val label: String,
    val icon: ImageVector?
) {
    object Splash : Screen("splash", "", null)
    object Login : Screen("login", "", null)
    object Register : Screen("register", "", null)
    object Home : Screen("home", "Home", Icons.Default.Home)
    object Recipes : Screen("recipes", "Recipes", Icons.Default.Search)
    object Nutrition : Screen("nutrition", "Nutrition", Icons.Default.Star)
    object Meals : Screen("meals", "Meals", null)
    object History : Screen("history", "History", null)
    object RecipeDetail : Screen("recipe_detail/{id}", "Detail", null) {
        fun createRoute(id: String) = "recipe_detail/$id"
    }
}

@Composable
fun AppNavigation(navController: NavHostController) {

    val mainViewModel: MainViewModel = viewModel()
    val authViewModel: AuthViewModel = viewModel()

    val isLoggedIn by authViewModel.isLoggedIn.collectAsState(initial = false)

    // 🔹 Pantallas con BottomBar
    val bottomBarScreens = listOf(
        Screen.Home,
        Screen.Recipes,
        Screen.Nutrition
    )

    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val showBottomBar = bottomBarScreens.any { it.route == currentRoute }

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar {
                    bottomBarScreens.forEach { screen ->
                        NavigationBarItem(
                            selected = currentRoute == screen.route,
                            onClick = {
                                navController.navigate(screen.route) {
                                    popUpTo(navController.graph.startDestinationId) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = {
                                screen.icon?.let { Icon(it, contentDescription = screen.label) }
                            },
                            label = { Text(screen.label) }
                        )
                    }
                }
            }
        }
    ) { padding ->

        NavHost(
            navController = navController,
            startDestination = Screen.Splash.route,
            modifier = Modifier.padding(padding)
        ) {

            // 🔹 Splash
            composable(Screen.Splash.route) {
                SplashScreen {
                    val nextRoute = if (isLoggedIn) Screen.Home.route else Screen.Login.route
                    navController.navigate(nextRoute) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                }
            }

            // 🔹 Login
            composable(Screen.Login.route) {
                LoginScreen(
                    authViewModel = authViewModel,
                    onLoginSuccess = {
                        navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                    },
                    onGoToRegister = {
                        navController.navigate(Screen.Register.route)
                    }
                )
            }

            // 🔹 Register
            composable(Screen.Register.route) {
                RegisterScreen(
                    authViewModel = authViewModel,
                    onRegisterSuccess = {
                        navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                    },
                    onGoToLogin = {
                        navController.popBackStack()
                    }
                )
            }

            // 🔹 Home
            composable(Screen.Home.route) {
                HomeScreen(
                    navController = navController,
                    viewModel = mainViewModel
                )
            }

            // 🔹 Recipes
            composable(Screen.Recipes.route) {
                RecipesScreen(
                    navController = navController,
                    viewModel = mainViewModel
                )
            }

            // 🔹 Nutrition
            composable(Screen.Nutrition.route) {
                NutritionScreen(viewModel = mainViewModel)
            }

            // 🔹 Meals
            composable(Screen.Meals.route) {
                Meals()
            }

            // 🔹 History
            composable(Screen.History.route) {
                HistoryScreen(
                    navController = navController,
                    viewModel = mainViewModel
                )
            }

            // 🔹 Detalle receta
            composable(Screen.RecipeDetail.route) { backStack ->
                val id = backStack.arguments?.getString("id") ?: ""
                RecipeDetailScreen(
                    id = id,
                    navController = navController,
                    viewModel = mainViewModel
                )
            }
        }
    }
}