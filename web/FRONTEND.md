# 🌐 Frontend Web — YummyNutrition

Stack: **React 18 + Vite + Tailwind CSS v4 + React Router + Axios**

---

## 🚀 Cómo levantar el proyecto

### Opción 1 — Desarrollo (con hot reload)

```bash
cd web
npm install        # solo la primera vez
npm run dev
```

Abre http://localhost:5173

### Opción 2 — Producción (Docker, recomendado para demos)

Desde la raíz del proyecto:

```bash
docker compose up -d
```

Abre http://localhost:8080

Si es la primera vez o hiciste cambios:

```bash
docker compose up -d --build web
```

---

## 📁 Estructura

```
web/
├── Dockerfile, nginx.conf      ← Producción
├── vite.config.js              ← Config del bundler
└── src/
    ├── App.jsx                 ← Ruteo
    ├── main.jsx                ← Entry point
    ├── index.css               ← Tailwind + estilos
    ├── components/             ← Navbar, MacroCard, ProtectedRoute
    ├── pages/                  ← Login, Register, Dashboard, Foods, Recipes, History
    ├── services/               ← Llamadas al backend (axios)
    └── context/                ← AuthContext (sesión + JWT)
```

---

## 🔑 Flujo de autenticación

1. Usuario hace login → backend devuelve JWT
2. Token se guarda en `localStorage`
3. Axios lo agrega automáticamente en cada petición como `Authorization: Bearer <token>`
4. Si expira (401) → redirect automático a `/login`

---

## 🛠️ Comandos esenciales

| Tarea | Comando |
|-------|---------|
| Dev server | `cd web && npm run dev` |
| Instalar librería | `cd web && npm install <nombre>` |
| Build producción | `cd web && npm run build` |
| Levantar todo en Docker | `docker compose up -d` |
| Rebuild del frontend Docker | `docker compose up -d --build web` |
| Ver logs del frontend | `docker logs yummy-web` |
| Apagar todo | `docker compose down` |

---

## 🌐 URLs

| URL | Qué es |
|-----|--------|
| http://localhost:5173 | Frontend en dev (Vite) |
| http://localhost:8080 | Frontend en producción (Docker + Nginx) |
| http://localhost:3000 | API Gateway (backend) |

---

## 🐛 Problemas comunes

**"Pantalla en blanco tras hacer cambios":** `Ctrl + Shift + R` (hard reload).

**"Error 401 en todas las peticiones":** el JWT expiró (24h). Logout y login.

**"Cambios no aparecen en http://localhost:8080":** rebuild Docker:
```bash
docker compose up -d --build web
```

**"ECONNREFUSED":** el backend no está corriendo. Levántalo:
```bash
docker compose up -d
```

---

## 📚 Referencias

- API Contract: ver `API_CONTRACT.md` en la raíz
- Estado del proyecto: ver `ESTADO.md` en la raíz