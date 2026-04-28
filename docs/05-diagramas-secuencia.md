# 🔄 Diagramas de Secuencia

**Proyecto:** YummyNutrition
**Versión del documento:** 1.0
**Fecha:** Abril 2026

---

## 1. Introducción

Este documento presenta los diagramas de secuencia que describen los flujos más representativos del sistema YummyNutrition. Cada diagrama ilustra cómo viaja una petición desde el cliente, atraviesa el API Gateway, llega al microservicio correspondiente, interactúa con la base de datos o con servicios externos, y devuelve la respuesta.

Los diagramas elegidos cubren los tres flujos críticos del sistema:

1. **Autenticación**: registro y login de un usuario.
2. **Registro nutricional**: búsqueda de un alimento y registro del consumo.
3. **Consulta de estadísticas**: cálculo de los totales nutricionales del día.
4. **Búsqueda de receta con detalle**: consulta a una API externa con caché transparente.

Cada diagrama está acompañado de una descripción narrativa del flujo y notas técnicas relevantes para su comprensión y defensa.

## 2. Convenciones de los diagramas

A lo largo de los diagramas se utilizan las siguientes convenciones:

| Símbolo | Significado |
|---------|-------------|
| Línea sólida con flecha | Petición síncrona (HTTP, query SQL) |
| Línea punteada con flecha | Respuesta de una petición previa |
| Caja `Note` | Comentario explicativo de un paso |
| Caja `alt` | Flujo alternativo (ej. error 404) |
| Caja `loop` | Repetición de pasos |

Los actores representados son:

- **Cliente** (Web SPA o App Android)
- **Gateway** (API Gateway)
- **Microservicios** (auth, food, recipe, log, stats)
- **Bases de datos** (authdb, fooddb, recipedb, logdb, statsdb)
- **APIs externas** (USDA FoodData Central, TheMealDB)

## 3. Flujo 1 — Registro y autenticación de un usuario

### 3.1 Descripción

Este flujo cubre dos casos de uso encadenados: **CU-01 Registrarse** y **CU-02 Iniciar sesión**. Cuando un usuario se registra exitosamente, el sistema lo autentica de forma automática emitiéndole un JWT, evitando que tenga que volver a ingresar credenciales inmediatamente.

El cliente almacena dos valores en `localStorage`: el token JWT y los datos públicos del usuario (id, nombre, email). Estos valores se utilizan en todas las peticiones subsecuentes para identificar al usuario.

### 3.2 Diagrama

```mermaid
sequenceDiagram
  autonumber
  actor Cliente
  participant Gateway
  participant AuthService as auth-service
  participant AuthDB as authdb

  Note over Cliente: Usuario llena el formulariode registro

  Cliente->>Gateway: POST /api/auth/register{ name, email, password }
  Gateway->>AuthService: POST /register

  AuthService->>AuthService: bcrypt.hash(password, 10)

  AuthService->>AuthDB: INSERT INTO users(name, email, password_hash)

  alt Email no existe
    AuthDB-->>AuthService: row inserted
    AuthService-->>Gateway: 200 { message: "Usuario registrado" }
    Gateway-->>Cliente: 200 OK
  else Email ya existe
    AuthDB-->>AuthService: error duplicate key
    AuthService-->>Gateway: 400 { error: "Email ya existe" }
    Gateway-->>Cliente: 400 Bad Request
  end

  Note over Cliente: Cliente hace loginautomáticamente

  Cliente->>Gateway: POST /api/auth/login{ email, password }
  Gateway->>AuthService: POST /login

  AuthService->>AuthDB: SELECT * FROM usersWHERE email = $1
  AuthDB-->>AuthService: user row

  AuthService->>AuthService: bcrypt.compare(password, hash)

  alt Contraseña válida
    AuthService->>AuthService: jwt.sign({id, email, name},JWT_SECRET, expiresIn:"1d")
    AuthService-->>Gateway: 200 { token, user }
    Gateway-->>Cliente: 200 { token, user }

    Note over Cliente: localStorage.setItem("token", ...)localStorage.setItem("user", ...)
  else Contraseña inválida
    AuthService-->>Gateway: 401 { error: "Contraseña incorrecta" }
    Gateway-->>Cliente: 401 Unauthorized
  end
```

### 3.3 Notas técnicas

- El JWT se firma con HMAC-SHA256 usando el secreto compartido `JWT_SECRET` definido en `docker-compose.yml`. Este mismo secreto lo usan `log-service` y `stats-service` para validar tokens.
- La contraseña se cifra con `bcrypt` usando un factor de costo de 10. Este valor balancea seguridad y rendimiento (un hash tarda aproximadamente 100 ms en hardware moderno).
- El registro y el login son los únicos endpoints **no protegidos** del sistema, junto con las búsquedas en `food-service` y `recipe-service`.

---

## 4. Flujo 2 — Registro nutricional con búsqueda de alimento

### 4.1 Descripción

Este es el flujo de uso principal del sistema. Cubre los casos de uso **CU-04 Buscar alimento** y **CU-07 Registrar comida** ejecutados secuencialmente. Demuestra dos características técnicas importantes:

- **Caché transparente**: la búsqueda primero verifica si el término ya fue buscado antes; si es así, responde sin contactar a USDA. Esto reduce la latencia y el consumo de cuota de la API externa.
- **Identidad gobernada por JWT**: al registrar la comida, el `user_id` se extrae exclusivamente del token, ignorando cualquier valor que pudiera enviarse en el cuerpo de la petición.

### 4.2 Diagrama

```mermaid
sequenceDiagram
  autonumber
  actor Cliente
  participant Gateway
  participant FoodService as food-service
  participant FoodDB as fooddb
  participant USDA
  participant LogService as log-service
  participant LogDB as logdb

  Note over Cliente: Usuario busca "banana"en pantalla de Alimentos

  Cliente->>Gateway: GET /api/foods/search?q=banana
  Gateway->>FoodService: GET /foods/search?q=banana

  FoodService->>FoodDB: SELECT * FROM foodsWHERE query = 'banana'

  alt Cache HIT
    FoodDB-->>FoodService: cached results
    FoodService-->>Gateway: 200 { source: "cache", foods }
    Note right of FoodService: No se consulta USDA
  else Cache MISS
    FoodDB-->>FoodService: empty
    FoodService->>USDA: GET /foods/search?query=banana&api_key=...
    USDA-->>FoodService: foods array
    FoodService->>FoodService: normalizar respuesta(extraer kcal, prot, carbs, fat)
    FoodService->>FoodDB: INSERT INTO foods(query, results)
    FoodDB-->>FoodService: row inserted
    FoodService-->>Gateway: 200 { source: "usda", foods }
  end

  Gateway-->>Cliente: 200 { foods }

  Note over Cliente: Usuario hace clicken "Registrar" en una banana

  Cliente->>Gateway: POST /api/logsHeader: Authorization: Bearer Body: { food: "Banana", calories: 89, ... }
  Gateway->>LogService: POST /logs

  LogService->>LogService: jwt.verify(token, JWT_SECRET)
  Note right of LogService: Extrae user_id del token,NO del body (anti-suplantación)

  LogService->>LogDB: INSERT INTO logs(user_id, food, calories, ...)RETURNING *
  LogDB-->>LogService: log row

  LogService-->>Gateway: 201 { message, log }
  Gateway-->>Cliente: 201 Created

  Note over Cliente: Usuario ve confirmación"Comida guardada"
```

### 4.3 Notas técnicas

- El caché se identifica por el término de búsqueda **normalizado a minúsculas y sin espacios al inicio o final**. Esto significa que `"Banana"`, `"banana"` y `" banana "` resultan en el mismo registro de caché.
- Si la API de USDA falla y no hay caché, el servicio responde con error 500 controlado. El cliente muestra un mensaje al usuario sin colapsar.
- El campo `created_at` del log es de tipo `TIMESTAMPTZ` y se genera con `NOW()` de PostgreSQL, que internamente almacena el valor en UTC. La conversión a hora local de México (`America/Mexico_City`) se realiza en el cliente al momento de mostrar la fecha al usuario, mediante helpers de zona horaria fija. Este enfoque garantiza que un mismo registro se vea con la hora correcta sin importar la zona configurada en el navegador, el emulador Android o el contenedor del backend.

---

## 5. Flujo 3 — Consulta de estadísticas del día

### 5.1 Descripción

Este flujo cubre el caso de uso **CU-10 Ver totales del día** y es uno de los flujos más interesantes del sistema desde el punto de vista arquitectónico. Demuestra el principio de **bounded context con comunicación HTTP entre microservicios**.

El microservicio `stats-service` necesita los registros del usuario para calcular los totales, pero **no accede directamente** a la base de datos `logdb`. En su lugar, consulta al `log-service` mediante una llamada HTTP interna dentro de la red Docker. Esta decisión preserva la responsabilidad exclusiva de cada microservicio sobre sus datos.

Adicionalmente, el resultado del cálculo se cachea en `statsdb` con UPSERT (`INSERT ... ON CONFLICT DO UPDATE`) para acelerar consultas repetidas y para construir el historial por día (CU-11) sin tener que recalcular.

### 5.2 Diagrama

```mermaid
sequenceDiagram
  autonumber
  actor Cliente
  participant Gateway
  participant StatsService as stats-service
  participant LogService as log-service
  participant LogDB as logdb
  participant StatsDB as statsdb

  Note over Cliente: Usuario abre el dashboard

  Cliente->>Gateway: GET /api/stats/4Header: Authorization: Bearer 
  Gateway->>StatsService: GET /stats/4

  StatsService->>StatsService: jwt.verify(token, JWT_SECRET)

  Note right of StatsService: stats-service NO accededirectamente a logdb

  StatsService->>LogService: GET http://log-service:3004/logs/4
  LogService->>LogDB: SELECT * FROM logsWHERE user_id = 4ORDER BY created_at DESC
  LogDB-->>LogService: array de logs
  LogService-->>StatsService: 200 [logs...]

StatsService->>StatsService: getMxDateString(new Date())= "2026-04-27" (zona México)

  loop Para cada log
    StatsService->>StatsService: filter logs WHERE date = today
  end

  StatsService->>StatsService: reduce: sumar calorías,proteína, carbs, fat

  StatsService->>StatsDB: INSERT INTO stats_cache(user_id, date, totals...)ON CONFLICT (user_id, date) DO UPDATE
  StatsDB-->>StatsService: row upserted

  StatsService-->>Gateway: 200 { todayCalories: 552,todayProtein: 49.3,mealsToday: 3, ... }
  Gateway-->>Cliente: 200 OK

  Note over Cliente: Dashboard muestralos totales del día
```

### 5.3 Notas técnicas

- El endpoint `GET /logs/:userId` en `log-service` está disponible internamente para que `stats-service` lo consuma. En una iteración futura conviene protegerlo con un token de servicio compartido para evitar que también sea accesible públicamente vía gateway.
- La función `getMxDateString(date)` construye una cadena `YYYY-MM-DD` usando `Intl.DateTimeFormat` con `timeZone: 'America/Mexico_City'`. Este enfoque garantiza que "hoy" se calcule siempre en zona México sin depender de la zona configurada en el contenedor, lo que hace el cálculo robusto frente a despliegues en hosts con cualquier configuración regional.
- El `UPSERT` con la constraint UNIQUE `(user_id, date)` hace que cada usuario tenga exactamente una fila por día en `stats_cache`. Las consultas posteriores actualizan la fila en lugar de duplicarla.

---

## 6. Flujo 4 — Búsqueda y consulta de receta con caché

### 6.1 Descripción

Este flujo cubre los casos de uso **CU-05 Buscar recetas** y **CU-06 Ver detalle de receta**. Es un buen ejemplo de cómo se manejan las dos APIs externas del sistema con caché transparente independiente para listados y para detalles.

Una característica técnica interesante de este flujo es el **procesamiento de los 20 campos de ingredientes** que TheMealDB devuelve por separado. El sistema los unifica en una lista única y legible al momento de cachear, no al momento de leer. Esto garantiza que la transformación se realice una sola vez por receta.

### 6.2 Diagrama

```mermaid
sequenceDiagram
  autonumber
  actor Cliente
  participant Gateway
  participant RecipeService as recipe-service
  participant RecipeDB as recipedb
  participant MealDB as TheMealDB

  Note over Cliente: Usuario busca "chicken"en pantalla de Recetas

  Cliente->>Gateway: GET /api/recipes/search?q=chicken
  Gateway->>RecipeService: GET /recipes/search?q=chicken

  RecipeService->>RecipeDB: SELECT * FROM recipe_searchesWHERE query = 'chicken'

  alt Cache HIT
    RecipeDB-->>RecipeService: cached results
    RecipeService-->>Gateway: 200 { source: "cache", recipes }
  else Cache MISS
    RecipeDB-->>RecipeService: empty
    RecipeService->>MealDB: GET /search.php?s=chicken
    MealDB-->>RecipeService: meals array
    RecipeService->>RecipeService: extraer id, nombre, categoría,área, imagen
    RecipeService->>RecipeDB: INSERT INTO recipe_searches(query, results)
    RecipeService-->>Gateway: 200 { source: "themealdb", recipes }
  end

  Gateway-->>Cliente: 200 { recipes }

  Note over Cliente: Usuario hace clicken una receta

  Cliente->>Gateway: GET /api/recipes/52940
  Gateway->>RecipeService: GET /recipes/52940

  RecipeService->>RecipeDB: SELECT * FROM recipe_detailsWHERE meal_id = '52940'

  alt Cache HIT
    RecipeDB-->>RecipeService: cached detail
    RecipeService-->>Gateway: 200 { source: "cache", ...detail }
  else Cache MISS
    RecipeDB-->>RecipeService: empty
    RecipeService->>MealDB: GET /lookup.php?i=52940
    MealDB-->>RecipeService: meal con 20 strIngredient + 20 strMeasure

    Note right of RecipeService: Loop i=1..20Unificar ingredientes en lista

    RecipeService->>RecipeService: ingredients = ["1 whole Chicken","2 cloves Garlic","1 tbsp Olive Oil", ...]
    RecipeService->>RecipeDB: INSERT INTO recipe_details(meal_id, data)
    RecipeService-->>Gateway: 200 { source: "themealdb", ...detail }
  end

  Gateway-->>Cliente: 200 { recipe detail }

  Note over Cliente: Cliente muestraingredientes e instrucciones
```

### 6.3 Notas técnicas

- TheMealDB devuelve los ingredientes en un formato peculiar con 20 campos separados (`strIngredient1` ... `strIngredient20` y `strMeasure1` ... `strMeasure20`). Muchos están vacíos o nulos. El código del servicio itera con un `for` de 1 a 20, descarta los vacíos, y une medida + ingrediente en strings legibles.
- El caché de búsqueda y el caché de detalle son tablas separadas (`recipe_searches` y `recipe_details`). Esto es deliberado: una búsqueda de "chicken" puede traer N recetas, pero el detalle de cada receta se cachea de forma independiente bajo su propio `meal_id`.

---

## 7. Flujo 5 — Consulta de historial completo (cliente Android)

### 7.1 Descripción

Este flujo cubre el caso de uso **CU-08 Consultar historial** ejecutado desde la app Android. Es equivalente al flujo de la web, pero ilustra una característica importante del cliente móvil: el manejo explícito de la zona horaria al renderizar las marcas de tiempo recibidas del backend.

El backend envía cada `created_at` en formato ISO-8601 con sufijo UTC (`Z`). El cliente Android, mediante un helper basado en `java.time` (`OffsetDateTime` y `ZoneId.of("America/Mexico_City")`), convierte cada timestamp a hora México antes de mostrarlo. Esto garantiza que la pantalla de historial muestre la misma hora que la web, independientemente de la zona configurada en el dispositivo o el emulador.

### 7.2 Diagrama

```mermaid
sequenceDiagram
  autonumber
  actor Usuario
  participant App as App Android
  participant Gateway
  participant LogService as log-service
  participant LogDB as logdb

  Note over Usuario: Usuario abre la pantalla"Meal History"

  Usuario->>App: Tap en card "Meal History"
  App->>App: HistoryScreen montado

  App->>Gateway: GET /api/logsHeader: Authorization: Bearer
  Gateway->>LogService: GET /logs

  LogService->>LogService: jwt.verify(token, JWT_SECRET)extract user_id

  LogService->>LogDB: SELECT * FROM logsWHERE user_id = $1ORDER BY created_at DESC
  LogDB-->>LogService: array de logs(created_at en TIMESTAMPTZ)

  LogService-->>Gateway: 200 [logs con created_at ISO+Z]
  Gateway-->>App: 200 OK

  loop Para cada log
    App->>App: formatTimestamp(log.created_at)convertir UTC → México
  end

  App->>App: agrupar logs por día (zona México)usando getDayKeyMx

  Note over App: LazyColumn renderizalos cards por día

  Usuario->>App: Tap en icono 🗑️ de un log
  App->>Gateway: DELETE /api/logs/:id
  Gateway->>LogService: DELETE /logs/:id

  LogService->>LogDB: DELETE FROM logsWHERE id = $1 AND user_id = $2RETURNING id

  alt El log pertenece al usuario
    LogDB-->>LogService: row deleted
    LogService-->>Gateway: 200 { message: "Log eliminado" }
    Gateway-->>App: 200 OK
    App->>App: optimistic update:remover de la lista localrecargar stats
  else El log no existe o es de otro usuario
    LogDB-->>LogService: 0 rows
    LogService-->>Gateway: 404 Not Found
    Gateway-->>App: 404
  end
```

### 7.3 Notas técnicas

- El cliente Android usa `OffsetDateTime.parse()` para interpretar el timestamp del backend. Este parser reconoce automáticamente el sufijo `Z` (UTC) o cualquier offset explícito como `-06:00`. Tras parsear, `atZoneSameInstant(ZoneId.of("America/Mexico_City"))` realiza la conversión a hora local del negocio.
- La agrupación por día utiliza un helper `getDayKeyMx` que devuelve la clave `YYYY-MM-DD` en zona México, evitando que un registro hecho a las 23:30 hora local aparezca bajo el día siguiente UTC.
- La eliminación es **optimista** en el cliente: la fila se retira de la lista antes de recibir confirmación del servidor. Si el servidor responde con error, se podría revertir el cambio (mejora pendiente para iteración futura).
- Tras una eliminación exitosa, el cliente recarga las estadísticas del día llamando a `GET /api/stats/:userId`, lo que mantiene el dashboard sincronizado con el historial.

---

## 8. Resumen de patrones observables en los flujos

Los cuatro diagramas anteriores muestran de forma concreta varios patrones arquitectónicos discutidos en el documento `04-diseno-servicios.md`:

| Patrón | Flujos donde aparece |
|--------|---------------------|
| **API Gateway centralizado** | 1, 2, 3, 4 (todas las peticiones del cliente entran por aquí) |
| **JWT como fuente única de identidad** | 1 (emisión), 2 (validación en log-service), 3 (validación en stats-service) |
| **Caché transparente sobre fuente externa** | 2 (food-service ↔ USDA), 4 (recipe-service ↔ TheMealDB) |
| **Comunicación HTTP entre microservicios** | 3 (stats-service consume log-service), 5 (cliente Android consume log-service vía gateway) |
| **Zona horaria fijada en el cliente** | 3 (`Intl.DateTimeFormat` en stats-service), 5 (`ZoneId.of("America/Mexico_City")` en Android) |
| **UPSERT para garantizar unicidad lógica** | 3 (stats_cache con `(user_id, date)`) |
| **Transformación al cachear** | 4 (unificación de 20 campos de ingredientes) |

Estos patrones son los que dan al sistema sus propiedades de **escalabilidad** (cada servicio cachea independientemente), **seguridad** (JWT como autoridad central de identidad) y **mantenibilidad** (cada microservicio puede evolucionar sin afectar a los demás mientras mantenga su contrato de API).