# 🌱 Seeders

Scripts para poblar las bases de datos con datos de prueba.

## Prerrequisitos

- `docker compose up -d` corriendo
- Puertos de las BDs expuestos en 5433-5437
- `npm install` ejecutado en este directorio

## Uso

```bash
# Seed completo de las 4 BDs (auth, food, recipe, log)
npm run seed

# Seed individual
npm run seed:auth
npm run seed:food
npm run seed:recipe
npm run seed:log
```

## Credenciales generadas

| Email | Password | Notas |
|-------|----------|-------|
| `demo@yummy.com`    | `demo1234`  | Usuario principal con 15 logs en 7 días |
| `angel@itl.edu.mx`  | `angel1234` | Usuario secundario vacío |