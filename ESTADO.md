# 📋 ESTADO DEL PROYECTO YummyNutrition

**Última actualización:** 22 de abril 2026  
**Equipo:**
- **Ángel** — Backend, infraestructura, frontend web
- **Michelle** — Aplicación móvil Android

---

## 🎯 CONTEXTO DEL PROYECTO

**Materia:** Proyecto Integrador de Aplicaciones Empresariales (9no semestre, ITL)

**Arquitectura:** Sistema distribuido basado en microservicios con 5 servicios independientes en Node.js + Express, una instancia de PostgreSQL por servicio (patrón Database per Service), API Gateway como único punto de entrada usando Express + http-proxy-middleware, autenticación JWT compartida entre servicios. Despliegue completo orquestado con Docker Compose.

**Plataformas del cliente:**
- 📱 **Mobile:** Aplicación Android nativa (Kotlin + Jetpack Compose, arquitectura MVVM)
- 🌐 **Web:** Aplicación web SPA (React + Vite) — **en desarrollo**

---

## ✅ BACKEND — COMPLETADO

### Servicios en producción

1. **5 microservicios corriendo en contenedores Docker:**
   - `auth-service` (puerto interno 3001) — registro, login, JWT, hashing con bcrypt
   - `food-service` (puerto interno 3002) — búsqueda nutricional vía USDA FoodData Central + caché
   - `recipe-service` (puerto interno 3003) — búsqueda de recetas vía TheMealDB + caché
   - `log-service` (puerto interno 3004) — CRUD de registros de comidas protegido con JWT
   - `stats-service` (puerto interno 3005) — cálculo de totales nutricionales diarios + historial

2. **5 bases de datos PostgreSQL independientes** (Database per Service):
   - `authdb` → usuarios registrados
   - `fooddb` → caché de alimentos USDA
   - `recipedb` → caché de recetas TheMealDB
   - `logdb` → registros de comidas de los usuarios
   - `statsdb` → caché de resúmenes nutricionales precalculados

3. **API Gateway** (único punto de entrada en puerto **3000**):
   - `/api/auth/*` → auth-service
   - `/api/foods/*` → food-service
   - `/api/recipes/*` → recipe-service
   - `/api/logs/*` → log-service (requiere JWT)
   - `/api/stats/*` → stats-service (requiere JWT)

4. **Seguridad implementada:**
   - Validación JWT en log-service y stats-service (middleware de autenticación)
   - Hashing de passwords con bcrypt (salt rounds: 10)
   - JWT_SECRET compartido entre servicios que requieren validación
   - Expiración de tokens en 24 horas
   - userId extraído del token (no del body) para prevenir suplantación

5. **Decisiones arquitectónicas clave:**
   - stats-service NO accede a la base de datos de logs directamente. Consulta al log-service mediante HTTP respetando el bounded context del microservicio.
   - Todos los servicios que consumen APIs externas implementan caché en su propia base de datos (reducción de latencia y consumo de cuota externa).
   - Resiliencia en el arranque: los servicios implementan retry automático de conexión a PostgreSQL (hasta 10 intentos con 3 segundos de espera entre cada uno).
   - Volúmenes de Docker para persistencia de datos entre reinicios.

### Comandos de operación

```bash
# Levantar todo el sistema
docker compose up -d

# Ver estado de los contenedores
docker ps

# Ver logs de un servicio específico
docker logs yummy-auth-service

# Ver logs en vivo de todos los servicios
docker compose logs -f

# Reconstruir después de cambios de código
docker compose up -d --build

# Detener sin borrar datos
docker compose down

# Detener y eliminar datos (reset total)
docker compose down -v
```

### Estructura del repositorio

```
Yummy_Nutrition/
├── docker-compose.yml           ← Orquestador de 11 contenedores
├── ESTADO.md                    ← Este documento
├── README.md
├── API_CONTRACT.md              ← Especificación de endpoints
├── backend/
│   ├── auth-service/
│   │   ├── Dockerfile
│   │   ├── .dockerignore
│   │   ├── db.js                ← Helper de conexión resiliente
│   │   ├── server.js
│   │   └── package.json
│   ├── food-service/
│   ├── recipe-service/
│   ├── log-service/
│   ├── stats-service/
│   └── gateway/
│       ├── Dockerfile
│       ├── server.js
│       └── package.json
└── app/                         ← Aplicación Android (Kotlin)
```

---


## ✅ FRONTEND WEB — COMPLETADO

Aplicación web SPA que consume los 5 microservicios a través del API Gateway.

**Stack:**
- React 18 + Vite + Tailwind CSS v4
- React Router v6 + Axios
- Nginx (producción)

**Pantallas implementadas:**
1. ✅ Login / Registro (con JWT persistente en localStorage)
2. ✅ Dashboard (totales del día + últimas comidas)
3. ✅ Búsqueda de alimentos (USDA vía food-service)
4. ✅ Búsqueda de recetas (TheMealDB vía recipe-service, con detalle completo)
5. ✅ Historial personal (agrupado por fecha, con eliminar)

**URLs:**
- Desarrollo: http://localhost:5173 (Vite con hot reload)
- Producción: http://localhost:8080 (Nginx en Docker)

**Containerización:**
- `web/Dockerfile` (multi-stage build: Node para compilar + Nginx para servir)
- Integrado en `docker-compose.yml` como servicio `yummy-web`
- Documentación: `web/FRONTEND.md`

---

## 📱 APLICACIÓN MÓVIL — INTEGRACIÓN PENDIENTE

La app Android actualmente consume directamente el food-service (puerto 3002 sin pasar por gateway y sin autenticación JWT). 

**Trabajos pendientes de integración:**
- Migrar `baseURL` de Retrofit a `http://10.0.2.2:3000/api/`
- Implementar flujo de login/registro
- Almacenamiento seguro del JWT
- Inclusión del header `Authorization: Bearer <token>` en peticiones protegidas
- Reemplazar llamadas directas a TheMealDB por el recipe-service del backend

**Archivo principal a modificar:**  
`app/src/main/java/com/example/yummynutrition/data/api/RetrofitClient.kt`

---

## 📋 TAREAS POR ENTREGAR

### Implementación
- [ ] Frontend web completo
- [ ] Integración de la app Android con el gateway
- [ ] Pruebas unitarias (Jest para backend, mínimo 3-4 tests por servicio)
- [ ] Pruebas de integración end-to-end
- [ ] Datos de prueba (seeders)

### Documentación
- [ ] README.md profesional con diagramas
- [ ] API_CONTRACT.md completo
- [ ] Documento de requerimientos funcionales y no funcionales
- [ ] Diagrama de casos de uso
- [ ] Diagrama de dominio
- [ ] Diagrama de arquitectura del sistema
- [ ] Maquetación de vistas
- [ ] Documentación del proceso de despliegue

---

## 🔑 CONFIGURACIÓN TÉCNICA

### Credenciales internas

- **PostgreSQL** (todas las instancias): usuario `postgres`, password `1234`
- **JWT_SECRET**: definido en `docker-compose.yml`
- **USDA API Key**: definida como variable de entorno en food-service

### Endpoints principales (vía gateway en `localhost:3000`)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Crear cuenta de usuario |
| POST | `/api/auth/login` | ❌ | Obtener JWT |
| GET | `/api/auth/profile` | ✅ | Información del usuario autenticado |
| GET | `/api/foods/search?q=` | ❌ | Buscar alimento (USDA) |
| GET | `/api/recipes/search?q=` | ❌ | Buscar receta (TheMealDB) |
| GET | `/api/recipes/:id` | ❌ | Detalle de receta |
| POST | `/api/logs` | ✅ | Registrar comida consumida |
| GET | `/api/logs` | ✅ | Historial del usuario autenticado |
| DELETE | `/api/logs/:id` | ✅ | Eliminar registro |
| GET | `/api/stats/:userId` | ✅ | Totales nutricionales del día |
| GET | `/api/stats/:userId/history` | ✅ | Historial de totales por día |

### Red interna de Docker

Los servicios se comunican entre sí usando nombres de contenedor como hostname (`auth-service`, `food-service`, `log-service`, etc.), no `localhost`. La red `yummy-net` definida en `docker-compose.yml` aísla el tráfico interno del exterior.

---

## 📊 CUMPLIMIENTO DE REQUISITOS

| Requisito | Estado | Implementación |
|-----------|--------|----------------|
| Orientado a objetos | ✅ | Arquitectura modular en todos los servicios |
| En capas | ✅ | Separación de rutas, lógica de negocio y acceso a datos |
| Centrado en el dominio | ✅ | Cada microservicio encapsula un dominio del negocio |
| Microservicios (SOA) | ✅ | 5 servicios independientes + API Gateway |
| Bases de datos distribuidas | ✅ | 5 instancias PostgreSQL (una por servicio) |
| Multiplataforma (mín. 2) | ✅ | Android ✅ / Web ✅ |
| Despliegue en contenedores | ✅ | Docker Compose con 11 contenedores |

---

## 🚀 ARRANQUE RÁPIDO

Para levantar el sistema completo desde cero:

```bash
# 1. Clonar el repositorio
git clone https://github.com/MichCelis/Yummy_Nutrition.git
cd Yummy_Nutrition

# 2. Levantar toda la infraestructura
docker compose up -d

# 3. Verificar que todos los contenedores están activos
docker ps

# 4. Probar el gateway
curl http://localhost:3000/
```

El sistema estará completamente funcional en `http://localhost:3000` con todos los endpoints disponibles.