# 📋 Requerimientos Funcionales y No Funcionales

**Proyecto:** YummyNutrition
**Versión del documento:** 1.0
**Fecha:** Abril 2026

---

## 1. Introducción

Este documento describe los requerimientos funcionales y no funcionales del sistema YummyNutrition. Los requerimientos funcionales detallan las capacidades concretas que el sistema debe ofrecer a sus usuarios, mientras que los no funcionales describen las cualidades transversales que el sistema debe cumplir, como rendimiento, seguridad, mantenibilidad y escalabilidad.

## 2. Alcance del sistema

### 2.1 Lo que el sistema hace

YummyNutrition es una plataforma de seguimiento nutricional que permite a sus usuarios registrar las comidas que consumen, consultar información nutricional sobre alimentos a partir de fuentes oficiales como USDA FoodData Central, descubrir recetas a través de TheMealDB, y visualizar estadísticas de su consumo diario y por periodos. El sistema está disponible tanto en una aplicación web responsiva como en una aplicación móvil nativa para Android, ambas conectadas al mismo backend distribuido.

### 2.2 Lo que el sistema no hace

El sistema no realiza recomendaciones personalizadas de dietas ni planeación alimentaria automatizada. No incluye integración con dispositivos de salud (smartwatches, balanzas inteligentes), ni cálculo de macronutrientes objetivo según la complexión del usuario. Tampoco ofrece comunicación entre usuarios, redes sociales internas, ni mensajería. La funcionalidad se limita a registro, consulta, búsqueda y reporte estadístico individual.

### 2.3 Supuestos

- Los usuarios cuentan con conexión a internet estable durante el uso de la aplicación.
- Los usuarios poseen un dispositivo con un navegador moderno (versiones actuales de Chrome, Firefox, Edge o Safari) o un dispositivo Android con versión 7.0 (API 24) o superior.
- Las APIs externas (USDA FoodData Central y TheMealDB) están disponibles. En caso de no estarlo, el sistema responde desde el caché local de búsquedas previamente realizadas.
- El servidor que ejecuta el sistema cuenta con Docker y Docker Compose instalados, y dispone de al menos 2 GB de memoria RAM y 4 GB de espacio en disco.

## 3. Actores del sistema

| Actor | Descripción |
|-------|-------------|
| **Usuario no autenticado** | Persona que aún no tiene cuenta o no ha iniciado sesión. Solo puede registrarse o iniciar sesión. |
| **Usuario autenticado** | Persona con cuenta activa y sesión iniciada. Tiene acceso a todas las funcionalidades del sistema. |
| **API Gateway** | Componente intermediario que centraliza las peticiones desde los clientes hacia los microservicios. |
| **USDA FoodData Central** | Servicio externo que provee información nutricional de alimentos. |
| **TheMealDB** | Servicio externo que provee información de recetas culinarias. |

## 4. Requerimientos funcionales

Los requerimientos funcionales se identifican con el prefijo `RF-` y se agrupan por módulo del sistema.

### 4.1 Módulo de autenticación

#### RF-01 — Registro de usuario

- **Descripción:** El sistema debe permitir que un usuario no autenticado cree una nueva cuenta proporcionando su nombre, correo electrónico y contraseña.
- **Actor principal:** Usuario no autenticado.
- **Precondiciones:** El correo electrónico no debe estar registrado previamente.
- **Flujo principal:**
  1. El usuario accede al formulario de registro.
  2. El usuario ingresa su nombre, correo y contraseña.
  3. El sistema valida que el correo no exista en la base de datos.
  4. El sistema almacena el usuario con la contraseña cifrada (bcrypt).
  5. El sistema responde con confirmación y autentica al usuario automáticamente.
- **Flujo alternativo:**
  - Si el correo ya existe, el sistema rechaza el registro con un mensaje de error.

#### RF-02 — Inicio de sesión

- **Descripción:** El sistema debe permitir que un usuario registrado inicie sesión usando sus credenciales y reciba un token JWT válido por 24 horas.
- **Actor principal:** Usuario no autenticado.
- **Precondiciones:** El usuario debe estar previamente registrado.
- **Flujo principal:**
  1. El usuario ingresa su correo y contraseña.
  2. El sistema verifica que el correo exista.
  3. El sistema compara la contraseña con el hash almacenado.
  4. El sistema genera un JWT firmado con vigencia de 24 horas.
  5. El sistema entrega el token y los datos públicos del usuario al cliente.
- **Flujos alternativos:**
  - Si el correo no existe, el sistema responde con error 404.
  - Si la contraseña no coincide, el sistema responde con error 401.

#### RF-03 — Consulta de perfil propio

- **Descripción:** El sistema debe permitir que un usuario autenticado consulte la información asociada a su sesión actual a partir de su token JWT.
- **Actor principal:** Usuario autenticado.
- **Precondiciones:** El usuario debe estar autenticado con un token vigente.
- **Flujo principal:**
  1. El cliente envía la petición con el token JWT en el encabezado `Authorization`.
  2. El sistema valida la firma y vigencia del token.
  3. El sistema entrega los datos del usuario codificados en el token.

### 4.2 Módulo de búsqueda de alimentos

#### RF-04 — Búsqueda de alimentos por nombre

- **Descripción:** El sistema debe permitir buscar alimentos por nombre y devolver su información nutricional (calorías, proteína, carbohidratos, grasas).
- **Actor principal:** Usuario autenticado.
- **Precondiciones:** Ninguna específica además de la disponibilidad del sistema.
- **Flujo principal:**
  1. El usuario ingresa un término de búsqueda.
  2. El sistema verifica si el término existe en su caché local.
  3. Si existe en caché, el sistema responde con los resultados almacenados.
  4. Si no existe, el sistema consulta la API de USDA FoodData Central, normaliza la respuesta, la almacena en caché y la entrega al cliente.
- **Flujo alternativo:**
  - Si la API externa no responde y no hay caché disponible, el sistema responde con un error 500 controlado.

### 4.3 Módulo de búsqueda de recetas

#### RF-05 — Búsqueda de recetas por nombre

- **Descripción:** El sistema debe permitir buscar recetas culinarias por nombre y devolver una lista con su título, categoría, área geográfica y fotografía.
- **Actor principal:** Usuario autenticado.
- **Flujo principal:**
  1. El usuario ingresa un término de búsqueda de recetas.
  2. El sistema verifica si la búsqueda existe en caché.
  3. Si existe, responde desde caché.
  4. Si no, consulta a TheMealDB, normaliza la respuesta, la cachea y la entrega.

#### RF-06 — Consulta de detalle de receta

- **Descripción:** El sistema debe permitir consultar el detalle completo de una receta, incluyendo lista de ingredientes con cantidades, instrucciones de preparación y enlace al video de YouTube si está disponible.
- **Actor principal:** Usuario autenticado.
- **Precondiciones:** El identificador de receta debe corresponder a una receta válida en TheMealDB.
- **Flujo principal:**
  1. El usuario selecciona una receta de los resultados de búsqueda.
  2. El sistema verifica si el detalle existe en caché.
  3. Si existe, responde desde caché.
  4. Si no, consulta TheMealDB por el identificador de la receta, parsea los 20 campos de ingredientes que entrega la API y los unifica en una lista legible.
- **Flujo alternativo:**
  - Si la receta no existe, el sistema responde con error 404.

### 4.4 Módulo de registro de comidas

#### RF-07 — Registrar una comida consumida

- **Descripción:** El sistema debe permitir que un usuario autenticado registre el consumo de un alimento o platillo, incluyendo sus valores nutricionales y la fecha y hora del registro.
- **Actor principal:** Usuario autenticado.
- **Precondiciones:** El usuario debe estar autenticado.
- **Flujo principal:**
  1. El usuario selecciona un alimento de los resultados de búsqueda o ingresa uno manualmente.
  2. El cliente envía los datos al backend con el token JWT.
  3. El sistema extrae el `id` del usuario directamente del token JWT, ignorando cualquier `user_id` enviado en el cuerpo de la petición (medida de seguridad contra suplantación).
  4. El sistema almacena el registro con la marca de tiempo del servidor.
- **Flujo alternativo:**
  - Si falta el campo `food`, el sistema responde con error 400.
  - Si el token es inválido o no se envía, el sistema responde con error 401.

#### RF-08 — Listar el historial personal de comidas

- **Descripción:** El sistema debe permitir que un usuario autenticado consulte su historial completo de comidas registradas, ordenado del más reciente al más antiguo.
- **Actor principal:** Usuario autenticado.
- **Flujo principal:**
  1. El cliente solicita el historial con el token JWT.
  2. El sistema filtra los registros por el `id` del usuario contenido en el token.
  3. El sistema entrega los registros ordenados por fecha descendente.

#### RF-09 — Eliminar un registro propio

- **Descripción:** El sistema debe permitir que un usuario elimine un registro de comida que le pertenezca.
- **Actor principal:** Usuario autenticado.
- **Precondiciones:** El registro a eliminar debe pertenecer al usuario autenticado.
- **Flujo principal:**
  1. El usuario selecciona un registro y solicita su eliminación.
  2. El sistema valida que el registro exista y que pertenezca al usuario del token.
  3. El sistema elimina el registro de la base de datos.
- **Flujo alternativo:**
  - Si el registro no existe o no pertenece al usuario, el sistema responde con error 404 sin revelar si el registro existe pero pertenece a otro usuario.

### 4.5 Módulo de estadísticas

#### RF-10 — Calcular totales nutricionales del día actual

- **Descripción:** El sistema debe calcular y entregar la suma de calorías, proteínas, carbohidratos y grasas consumidos por el usuario en el día actual, junto con el número total de comidas registradas.
- **Actor principal:** Usuario autenticado.
- **Flujo principal:**
  1. El cliente solicita las estadísticas del día.
  2. El microservicio de estadísticas consulta al microservicio de registros vía HTTP interno (respetando el principio de bounded context entre microservicios).
  3. El sistema filtra los registros por la fecha actual del servidor.
  4. El sistema agrega los valores nutricionales y los redondea a dos decimales.
  5. El sistema almacena el resultado en su caché propio (`statsdb`) para acelerar consultas repetidas.
  6. El sistema entrega los totales calculados.

#### RF-11 — Consultar el historial de totales por día

- **Descripción:** El sistema debe permitir consultar los totales nutricionales agregados de los últimos N días para análisis de tendencias.
- **Actor principal:** Usuario autenticado.
- **Flujo principal:**
  1. El cliente solicita el historial indicando un número de días (por defecto 7).
  2. El sistema consulta directamente su caché `statsdb`.
  3. El sistema entrega la lista de totales por día, ordenada del día más reciente al más antiguo.

## 5. Requerimientos no funcionales

Los requerimientos no funcionales se identifican con el prefijo `RNF-` y se agrupan por categoría de calidad.

### 5.1 Seguridad

#### RNF-01 — Cifrado de contraseñas

Todas las contraseñas deben almacenarse cifradas en la base de datos utilizando el algoritmo bcrypt con un factor de costo (salt rounds) mínimo de 10. El sistema nunca debe almacenar ni transmitir contraseñas en texto plano.

#### RNF-02 — Autenticación basada en tokens

El sistema debe utilizar JSON Web Tokens (JWT) firmados con HMAC-SHA256 para validar la identidad de los usuarios en cada petición. Los tokens deben tener una vigencia máxima de 24 horas. Los servicios protegidos deben rechazar peticiones con tokens expirados, malformados o ausentes.

#### RNF-03 — Prevención de suplantación de usuario

Los servicios que reciban datos del usuario (como el registro de comidas) deben extraer el identificador del usuario exclusivamente del token JWT, ignorando cualquier valor de `user_id` que pudiera venir en el cuerpo de la petición.

#### RNF-04 — Aislamiento de bases de datos

Cada microservicio debe tener acceso exclusivo a su propia base de datos. Ningún microservicio debe leer ni escribir directamente en la base de datos de otro microservicio. La única forma de obtener datos de otro dominio es a través de su API HTTP.

### 5.2 Rendimiento

#### RNF-05 — Caché de fuentes externas

Las consultas a APIs externas (USDA y TheMealDB) deben ser cacheadas en la base de datos del microservicio correspondiente. Las búsquedas o detalles ya consultados deben responderse desde caché para reducir la latencia y el consumo de cuota de las APIs externas.

#### RNF-06 — Caché de cálculos agregados

Los cálculos de estadísticas diarias deben almacenarse en una tabla dedicada y reutilizarse, recalculándose únicamente cuando los datos de origen cambien o cuando expire un periodo razonable de validez.

#### RNF-07 — Tiempo de respuesta esperado

Las peticiones que se respondan desde caché deben tardar menos de 200 ms en condiciones normales. Las peticiones que requieran consultar APIs externas deben responder en menos de 3 segundos en el 95% de los casos.

### 5.3 Disponibilidad y resiliencia

#### RNF-08 — Reintento de conexión a base de datos

Cada microservicio debe implementar una política de reintento al iniciar la conexión a su base de datos PostgreSQL, con un máximo de 10 intentos espaciados 3 segundos cada uno, antes de declararse en estado de fallo. Esto garantiza arranque correcto cuando los contenedores de bases de datos tardan en estar listos.

#### RNF-09 — Persistencia de datos

Las bases de datos deben usar volúmenes Docker dedicados para garantizar que los datos persistan entre reinicios y reconstrucciones de los contenedores.

#### RNF-10 — Tolerancia a fallos de APIs externas

Si una API externa falla y existe información cacheada, el sistema debe responder con la información cacheada. Si no existe caché, el sistema debe responder con un mensaje de error claro al cliente sin colapsar.

### 5.4 Mantenibilidad y calidad del código

#### RNF-11 — Cobertura de pruebas unitarias

El backend debe contar con pruebas unitarias automatizadas que cubran al menos los caminos principales (happy path) y los principales caminos alternativos (manejo de errores) de cada microservicio.

#### RNF-12 — Pruebas end-to-end

El sistema debe contar con pruebas end-to-end que validen la integración completa de los flujos críticos atravesando cliente, gateway, microservicios y bases de datos.

#### RNF-13 — Datos de prueba reproducibles

El sistema debe contar con scripts (seeders) que permitan poblar las bases de datos con datos deterministas para fines de demostración, pruebas y desarrollo.

#### RNF-14 — Estandarización de zona horaria

Todos los contenedores del sistema (bases de datos, microservicios, gateway) deben operar en la zona horaria America/Mexico_City para garantizar que los cálculos de "día actual" sean consistentes y coincidan con la percepción del usuario final.

### 5.5 Usabilidad

#### RNF-15 — Compatibilidad multiplataforma

El sistema debe ofrecer experiencia equivalente entre la versión web y la versión móvil. Ambas plataformas deben permitir acceso a las mismas funcionalidades principales: autenticación, búsqueda, registro y consulta de estadísticas.

#### RNF-16 — Diseño responsivo del frontend web

La aplicación web debe adaptarse a viewports desde 320 píxeles de ancho (móvil) hasta resoluciones de escritorio, manteniendo legibilidad y usabilidad sin pérdida de información.

#### RNF-17 — Idioma

La interfaz de usuario en ambas plataformas debe estar en español. Los datos provenientes de fuentes externas (USDA, TheMealDB) pueden mostrarse en su idioma original (inglés) cuando no exista traducción disponible.

### 5.6 Despliegue y portabilidad

#### RNF-18 — Despliegue en contenedores

Todo el sistema debe poder levantarse con un único comando (`docker compose up -d`) en cualquier máquina con Docker y Docker Compose instalados, sin necesidad de configuración manual adicional.

#### RNF-19 — Configuración por variables de entorno

Las credenciales, llaves de API y URLs entre servicios deben configurarse mediante variables de entorno en el archivo `docker-compose.yml`, sin valores sensibles incrustados en el código fuente.

#### RNF-20 — Aislamiento de red

Los contenedores deben comunicarse a través de una red Docker dedicada (`yummy-net`). El único contenedor que expone puertos al host es el API Gateway (en el puerto 3000) y el frontend web (en el puerto 8080). Los puertos de las bases de datos se exponen únicamente cuando es necesario para tareas de seeding o administración.

## 6. Trazabilidad de requerimientos

| Requerimiento | Componente que lo implementa | Prueba que lo valida |
|---------------|-----------------------------|---------------------|
| RF-01 Registro | auth-service `POST /register` | `auth.test.js` (unit) + Cypress `01-auth.cy.js` |
| RF-02 Login | auth-service `POST /login` | `auth.test.js` + Cypress `01-auth.cy.js` |
| RF-03 Perfil | auth-service `GET /profile` | `auth.test.js` |
| RF-04 Buscar alimento | food-service `GET /foods/search` | `food.test.js` + Cypress `02-nutrition-flow.cy.js` |
| RF-05 Buscar receta | recipe-service `GET /recipes/search` | `recipe.test.js` + Cypress `03-recipes.cy.js` |
| RF-06 Detalle receta | recipe-service `GET /recipes/:id` | `recipe.test.js` |
| RF-07 Registrar comida | log-service `POST /logs` | `log.test.js` |
| RF-08 Historial | log-service `GET /logs` | `log.test.js` |
| RF-09 Eliminar comida | log-service `DELETE /logs/:id` | `log.test.js` |
| RF-10 Stats del día | stats-service `GET /stats/:userId` | `stats.test.js` + Cypress `02-nutrition-flow.cy.js` |
| RF-11 Stats por día | stats-service `GET /stats/:userId/history` | `stats.test.js` |
| RNF-01 Bcrypt | auth-service `server.js` | Inspección de código + `auth.test.js` |
| RNF-02 JWT | auth-service + middlewares | `auth.test.js`, `log.test.js`, `stats.test.js` |
| RNF-03 No suplantación | log-service middleware | `log.test.js` test "ignora user_id del body" |
| RNF-04 BD aisladas | docker-compose.yml | Inspección de arquitectura |
| RNF-05/06 Caché | food-service, recipe-service, stats-service | Tests con mock de cache hit/miss |
| RNF-08 Reintento | `db.js` `connectWithRetry` | Inspección de código |
| RNF-11 Pruebas unitarias | 39 tests con Jest | `npm test` en cada servicio |
| RNF-12 E2E | 6 tests con Cypress | `npm run test` en `e2e/` |
| RNF-13 Seeders | carpeta `seeders/` | `npm run seed` |
| RNF-14 Zona horaria | `docker-compose.yml` + Dockerfiles | `docker exec <servicio> date` |