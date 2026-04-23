# 📘 API Contract — YummyNutrition

**Versión:** 1.0.0  
**Base URL (desarrollo):** `http://localhost:3000/api`  
**Formato:** JSON (`Content-Type: application/json`)

Este documento define el contrato público de la API de YummyNutrition. Todos los clientes (aplicación Android, frontend web, y futuros consumidores) se comunican con el backend exclusivamente a través del API Gateway usando los endpoints aquí descritos.

---

## 🔐 Autenticación

Los endpoints marcados como **protegidos** requieren el siguiente header en la petición:

```
Authorization: Bearer <JWT_TOKEN>
```

El token se obtiene al hacer login exitoso en `/api/auth/login`. Tiene una vigencia de 24 horas.

---

## 📋 Códigos de estado HTTP

| Código | Significado | Cuándo ocurre |
|--------|-------------|---------------|
| `200 OK` | Éxito | Petición procesada correctamente |
| `201 Created` | Recurso creado | Registro/creación exitosa |
| `400 Bad Request` | Datos inválidos del cliente | Falta un campo, formato incorrecto |
| `401 Unauthorized` | Token faltante o inválido | Sin `Authorization` o token expirado |
| `404 Not Found` | Recurso no existe | ID inexistente, ruta mal escrita |
| `409 Conflict` | Conflicto de estado | Email ya registrado |
| `500 Internal Server Error` | Error del servidor | Error inesperado del backend |

---

## 🔑 auth-service

Gestión de cuentas de usuario y autenticación.

---

### `POST /api/auth/register`

Crear una nueva cuenta de usuario.

**Request:**
```json
{
  "name": "Ángel",
  "email": "angel@itl.edu.mx",
  "password": "miPassword123"
}
```

**Response `200`:**
```json
{
  "message": "Usuario registrado"
}
```

**Errores:**
- `400` si el email ya existe: `{ "error": "Email ya existe" }`

---

### `POST /api/auth/login`

Iniciar sesión y obtener un JWT.

**Request:**
```json
{
  "email": "angel@itl.edu.mx",
  "password": "miPassword123"
}
```

**Response `200`:**
```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errores:**
- `404` si el usuario no existe: `{ "error": "Usuario no existe" }`
- `401` si la contraseña es incorrecta: `{ "error": "Contraseña incorrecta" }`

---

### `GET /api/auth/profile` 🔒

Obtener información del usuario autenticado.

**Headers:** `Authorization: Bearer <token>`

**Response `200`:**
```json
{
  "message": "Ruta privada",
  "user": {
    "id": 1,
    "email": "angel@itl.edu.mx",
    "iat": 1776837915,
    "exp": 1776924315
  }
}
```

---

## 🥗 food-service

Búsqueda de alimentos con información nutricional (USDA FoodData Central).

---

### `GET /api/foods/search?q=<query>`

Buscar alimentos por nombre. Implementa caché: la primera búsqueda consulta a USDA, las siguientes se sirven desde la base de datos local.

**Query params:**
- `q` (string, requerido) — término de búsqueda

**Response `200` (primera búsqueda):**
```json
{
  "source": "usda",
  "foods": [
    {
      "name": "BANANA",
      "calories": 89,
      "protein": 1.1,
      "carbs": 22.8,
      "fat": 0.3
    }
  ]
}
```

**Response `200` (búsquedas subsecuentes):**
```json
{
  "source": "cache",
  "foods": [ ... ]
}
```

---

## 🍽️ recipe-service

Búsqueda de recetas (TheMealDB).

---

### `GET /api/recipes/search?q=<query>`

Buscar recetas por nombre. Implementa caché en base de datos local.

**Query params:**
- `q` (string, requerido) — término de búsqueda

**Response `200`:**
```json
{
  "source": "themealdb",
  "query": "chicken",
  "recipes": [
    {
      "id": "52940",
      "name": "Brown Stew Chicken",
      "category": "Chicken",
      "area": "Jamaican",
      "image": "https://www.themealdb.com/images/media/meals/..."
    }
  ]
}
```

---

### `GET /api/recipes/:id`

Obtener el detalle completo de una receta por su ID, incluyendo ingredientes e instrucciones.

**Response `200`:**
```json
{
  "source": "themealdb",
  "id": "52940",
  "name": "Brown Stew Chicken",
  "category": "Chicken",
  "area": "Jamaican",
  "image": "https://www.themealdb.com/images/media/meals/...",
  "instructions": "Season chicken with salt, pepper...",
  "ingredients": [
    "1 whole Chicken",
    "2 cloves Garlic",
    "1 tbsp Olive Oil"
  ],
  "youtube": "https://www.youtube.com/watch?v=..."
}
```

**Errores:**
- `404` si la receta no existe: `{ "error": "Receta no encontrada" }`

---

## 📊 log-service

Registro de comidas consumidas por el usuario.

---

### `POST /api/logs` 🔒

Registrar una comida consumida. El `user_id` se extrae del JWT, no del body.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "food": "Banana",
  "calories": 89,
  "protein": 1.1,
  "carbs": 22.8,
  "fat": 0.3
}
```

**Response `201`:**
```json
{
  "message": "Comida guardada",
  "log": {
    "id": 1,
    "user_id": 1,
    "food": "Banana",
    "calories": "89",
    "protein": "1.1",
    "carbs": "22.8",
    "fat": "0.3",
    "created_at": "2026-04-22T12:47:32.123Z"
  }
}
```

**Errores:**
- `400` si falta el campo `food`: `{ "error": "El campo 'food' es requerido" }`
- `401` si no hay token o es inválido

---

### `GET /api/logs` 🔒

Obtener el historial de comidas del usuario autenticado, ordenado del más reciente al más antiguo.

**Headers:** `Authorization: Bearer <token>`

**Response `200`:**
```json
[
  {
    "id": 3,
    "user_id": 1,
    "food": "Apple",
    "calories": "52",
    "protein": "0.3",
    "carbs": "14",
    "fat": "0.2",
    "created_at": "2026-04-22T12:47:32.123Z"
  },
  {
    "id": 2,
    "user_id": 1,
    "food": "Chicken breast",
    "calories": "165",
    "protein": "31",
    "carbs": "0",
    "fat": "3.6",
    "created_at": "2026-04-22T10:30:15.456Z"
  }
]
```

---

### `DELETE /api/logs/:id` 🔒

Eliminar un registro de comida. Solo el propietario puede eliminar sus propios registros.

**Headers:** `Authorization: Bearer <token>`

**Response `200`:**
```json
{
  "message": "Log eliminado",
  "id": 3
}
```

**Errores:**
- `404` si el log no existe o no pertenece al usuario: `{ "error": "Log no encontrado o no te pertenece" }`

---

## 📈 stats-service

Cálculo de estadísticas nutricionales a partir del historial de comidas.

El servicio consulta al `log-service` vía HTTP (no accede directamente a su base de datos) respetando el principio de bounded context entre microservicios.

---

### `GET /api/stats/:userId` 🔒

Obtener los totales nutricionales del día actual para un usuario. El resultado se cachea automáticamente en `statsdb` para consultas rápidas posteriores.

**Headers:** `Authorization: Bearer <token>`

**Response `200`:**
```json
{
  "userId": 1,
  "date": "2026-04-22",
  "todayCalories": 306,
  "todayProtein": 32.4,
  "todayCarbs": 36.8,
  "todayFat": 4.1,
  "mealsToday": 3,
  "source": "calculated"
}
```

---

### `GET /api/stats/:userId/history?days=<n>` 🔒

Obtener el historial de totales nutricionales por día (desde el caché de `statsdb`). Útil para visualización de tendencias semanales/mensuales.

**Query params:**
- `days` (int, opcional, default 7) — número de días hacia atrás

**Headers:** `Authorization: Bearer <token>`

**Response `200`:**
```json
{
  "userId": 1,
  "days": 7,
  "history": [
    {
      "date": "2026-04-22T06:00:00.000Z",
      "total_calories": "306",
      "total_protein": "32.4",
      "total_carbs": "36.8",
      "total_fat": "4.1",
      "meals_count": 3
    }
  ]
}
```

---

## 🔧 Endpoints utilitarios del Gateway

---

### `GET /`

Información general del API Gateway.

**Response `200`:**
```json
{
  "message": "YummyNutrition API Gateway 🌐",
  "version": "1.0.0",
  "services": {
    "auth": "/api/auth/*",
    "foods": "/api/foods/*",
    "recipes": "/api/recipes/*",
    "logs": "/api/logs/*",
    "stats": "/api/stats/*"
  }
}
```

---

### `GET /health`

Endpoint de salud para monitoreo.

**Response `200`:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-22T18:30:00.000Z"
}
```

---

## 🔄 Flujo típico de una sesión de usuario

```
1. POST /api/auth/register       → Crear cuenta
2. POST /api/auth/login          → Obtener JWT
3. GET  /api/foods/search?q=...  → Buscar alimento
4. POST /api/logs                → Registrar consumo (con JWT)
5. GET  /api/stats/:userId       → Ver resumen del día (con JWT)
6. GET  /api/recipes/search?q=.. → Buscar inspiración de receta
```

---

## 📝 Notas de implementación

- **userId en logs:** el cliente no debe enviar el `userId` en el body. El backend lo extrae del JWT automáticamente para prevenir suplantación.
- **Caché:** los servicios `food-service` y `recipe-service` mantienen caché en su base de datos propia. Esto reduce la latencia y el consumo de cuota en las APIs externas.
- **Comunicación entre microservicios:** `stats-service` consulta a `log-service` por HTTP interno dentro de la red Docker. No hay acceso cruzado a bases de datos.
- **Expiración de tokens:** los JWT tienen una vigencia de 24 horas. Tras este periodo, el cliente debe hacer login nuevamente.