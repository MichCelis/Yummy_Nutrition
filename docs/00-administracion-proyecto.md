# 📋 Administración del Proyecto

**Nombre del proyecto:** YummyNutrition
**Materia:** Proyecto Integrador para Aplicaciones Empresariales (COB-2406)
**Profesor:** Ing. José Luis Fernando Suárez y Gómez
**Institución:** Instituto Tecnológico de León — Tecnológico Nacional de México
**Periodo académico:** Semestre 2026-1
**Repositorio:** https://github.com/MichCelis/Yummy_Nutrition

---

## 1. Descripción general

YummyNutrition es un sistema distribuido para el seguimiento nutricional de los usuarios. Permite registrar comidas consumidas, consultar información nutricional de alimentos provista por la base de datos USDA FoodData Central, descubrir recetas a través de TheMealDB, y visualizar estadísticas de consumo diario y por periodo. El sistema se compone de un backend basado en microservicios, una aplicación web SPA y una aplicación móvil nativa Android, todos orquestados mediante contenedores Docker y comunicados a través de un API Gateway centralizado.

## 2. Integrantes y roles

El proyecto se desarrolló bajo un esquema de **co-liderazgo**, donde ambos integrantes participamos en la toma de decisiones técnicas, en la planeación de iteraciones y en la defensa del proyecto. La asignación de responsabilidades se distribuyó según la fortaleza técnica de cada integrante, garantizando que cada componente del sistema tuviera una persona principal pero con conocimiento compartido del conjunto.

| Integrante | Carrera | Semestre | Rol |
|------------|---------|----------|-----|
| Ángel Israel Becerra Camarillo | Ingeniería en Sistemas Computacionales | 9° | Co-líder técnico |
| Frida Michelle Milagros Celis Torres | Ingeniería en Sistemas Computacionales | 8° | Co-líder técnica |

## 3. Distribución de responsabilidades

| Componente / Tarea | Responsable principal |
|--------------------|----------------------|
| Diseño de microservicios, bases de datos y API Gateway | Frida Michelle Milagros Celis Torres |
| Aplicación móvil nativa Android (Kotlin + Jetpack Compose, arquitectura MVVM) | Frida Michelle Milagros Celis Torres |
| Infraestructura y orquestación con Docker y Docker Compose | Ángel Israel Becerra Camarillo |
| Aplicación web SPA (React + Vite + Tailwind CSS, despliegue con Nginx) | Ángel Israel Becerra Camarillo |
| Pruebas unitarias del backend (Jest), pruebas end-to-end (Cypress) y seeders de datos | Ángel Israel Becerra Camarillo |
| Documentación técnica, diagramas y manuales | Ángel Israel Becerra Camarillo y Frida Michelle Milagros Celis Torres |

A pesar de la asignación principal, varias tareas se trabajaron de forma colaborativa durante sesiones conjuntas; en esos casos los commits aparecen registrados desde una sola cuenta de GitHub aunque el trabajo fue compartido.

## 4. Cronograma del proyecto

El desarrollo del proyecto siguió las fechas y entregables marcados en el documento de la materia:

| Fecha | Entregable | Estado |
|-------|------------|--------|
| 26 de marzo de 2026 | Definición del proyecto, integrantes y responsabilidades | Cumplido |
| 30 de abril de 2026 | Requerimientos, análisis y diseño completo | Cumplido |
| 14 de mayo de 2026 | Primer avance de implementación, pruebas unitarias y diseño de BD | Cumplido |
| 2 de junio de 2026 | Segundo avance: pruebas de integración, infraestructura, datos de prueba, versión final desplegada | Cumplido |
| 2, 4, 9 y 11 de junio de 2026 | Presentación del proyecto | Programado |

## 5. Características arquitectónicas del sistema

El proyecto cumple con las siguientes características exigidas en el documento del proyecto final:

| Característica | Implementación |
|----------------|----------------|
| Orientado a Objetos | Todos los servicios se desarrollaron con principios POO; cada microservicio encapsula su propio modelo de datos y lógica |
| En capas | Cada microservicio separa la capa de rutas, la capa de lógica de negocio y la capa de acceso a datos |
| Centrado en el dominio | Cada microservicio representa un bounded context del dominio (autenticación, alimentos, recetas, registros, estadísticas) |
| Orientado a microservicios | Sistema compuesto por 5 microservicios independientes coordinados por un API Gateway |
| Bases de datos distribuidas | Patrón Database per Service: cada microservicio posee su propia instancia de PostgreSQL |
| Multiplataforma de desarrollo | Cliente web (React) y cliente móvil (Android nativo en Kotlin) |
| Despliegue | 12 contenedores Docker orquestados con Docker Compose en una red aislada |

## 6. Tecnologías empleadas

**Backend:**
- Node.js 20 con Express 5 para los microservicios
- PostgreSQL 16 como motor de bases de datos
- JSON Web Tokens (JWT) para autenticación
- bcryptjs para hashing de contraseñas
- http-proxy-middleware para el API Gateway

**Frontend web:**
- React 18 con Vite como bundler
- Tailwind CSS v4 para estilos
- React Router v6 para navegación
- Axios como cliente HTTP

**Frontend móvil:**
- Kotlin con Jetpack Compose
- Arquitectura MVVM
- Retrofit como cliente HTTP

**Infraestructura:**
- Docker y Docker Compose para orquestación
- Nginx como servidor web del frontend en producción
- Imágenes Alpine Linux para minimizar el tamaño de los contenedores

**Pruebas:**
- Jest y Supertest para pruebas unitarias del backend (39 pruebas)
- Cypress para pruebas end-to-end (6 pruebas)

**APIs externas integradas:**
- USDA FoodData Central (información nutricional)
- TheMealDB (recetas)

## 7. Metodología de trabajo

El equipo trabajó bajo una metodología iterativa con revisiones frecuentes. Cada componente del sistema se desarrolló en un ciclo de **diseño → implementación → integración → pruebas → documentación**, completando las funcionalidades pieza por pieza antes de avanzar a la siguiente. La comunicación se mantuvo continua mediante mensajería instantánea y sesiones conjuntas presenciales en las que se resolvieron dependencias entre componentes y se acordaron decisiones técnicas conjuntas.

El control de versiones se gestionó con Git y el repositorio se alojó en GitHub. Los commits siguen el estándar de **conventional commits** para mantener un historial limpio y auditable, agrupando los cambios por área funcional (`feat`, `test`, `fix`, `chore`, `docs`).

## 8. Estructura del repositorio

```
Yummy_Nutrition/
├── backend/              # 5 microservicios + API Gateway
│   ├── auth-service/
│   ├── food-service/
│   ├── recipe-service/
│   ├── log-service/
│   ├── stats-service/
│   └── gateway/
├── web/                  # Frontend React + Vite
├── app/                  # Aplicación Android (Kotlin)
├── e2e/                  # Pruebas end-to-end con Cypress
├── seeders/              # Scripts de carga de datos de prueba
├── docs/                 # Documentación del proyecto
├── docker-compose.yml    # Orquestación de los 12 contenedores
└── README.md
```