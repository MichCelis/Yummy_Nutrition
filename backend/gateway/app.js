const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { createProxyMiddleware } = require("http-proxy-middleware");

function createApp({ logging = true } = {}) {
  const app = express();

  app.use(cors());
  if (logging) app.use(morgan("dev"));

  const AUTH_URL    = process.env.AUTH_SERVICE_URL    || "http://auth-service:3001";
  const FOOD_URL    = process.env.FOOD_SERVICE_URL    || "http://food-service:3002";
  const RECIPE_URL  = process.env.RECIPE_SERVICE_URL  || "http://recipe-service:3003";
  const LOG_URL     = process.env.LOG_SERVICE_URL     || "http://log-service:3004";
  const STATS_URL   = process.env.STATS_SERVICE_URL   || "http://stats-service:3005";

  app.get("/", (req, res) => {
    res.json({
      message: "YummyNutrition API Gateway 🌐",
      version: "1.0.0",
      services: {
        auth:    "/api/auth/*",
        foods:   "/api/foods/*",
        recipes: "/api/recipes/*",
        logs:    "/api/logs/*",
        stats:   "/api/stats/*"
      }
    });
  });

  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/auth", createProxyMiddleware({
    target: AUTH_URL,
    changeOrigin: true
  }));

  app.use("/api/foods", createProxyMiddleware({
    target: `${FOOD_URL}/foods`,
    changeOrigin: true
  }));

  app.use("/api/recipes", createProxyMiddleware({
    target: `${RECIPE_URL}/recipes`,
    changeOrigin: true
  }));

  app.use("/api/logs", createProxyMiddleware({
    target: `${LOG_URL}/logs`,
    changeOrigin: true
  }));

  app.use("/api/stats", createProxyMiddleware({
    target: `${STATS_URL}/stats`,
    changeOrigin: true
  }));

  app.use((req, res) => {
    res.status(404).json({
      error: "Ruta no encontrada",
      path: req.originalUrl
    });
  });

  return app;
}

module.exports = { createApp };