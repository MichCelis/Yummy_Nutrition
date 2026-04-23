# 🛠️ Comandos útiles del proyecto

## 🚀 Arrancar el sistema

```bash
docker compose up -d
docker ps
```

## 🛑 Apagar

```bash
docker compose down
```

## 🔨 Después de cambios en código

```bash
docker compose up -d --build
```

## 🔍 Debugging

```bash
# Ver logs de un servicio
docker logs yummy-auth-service

# Ver logs en vivo
docker compose logs -f

# Reiniciar un servicio
docker restart yummy-food-service
```

## 🧹 Reset total (borra datos)

```bash
docker compose down -v
```

## 🧪 Pruebas rápidas (PowerShell)

```powershell
# Login y guardar token
$login = Invoke-RestMethod -Method POST -Uri http://localhost:3000/api/auth/login -ContentType "application/json" -Body '{"email":"angel@itl.edu.mx","password":"test1234"}'
$token = $login.token

# Ver logs con el token
Invoke-RestMethod http://localhost:3000/api/logs -Headers @{Authorization="Bearer $token"}
```

## 🌿 Git

```bash
git status
git add .
git commit -m "mensaje"
git push
git pull
```