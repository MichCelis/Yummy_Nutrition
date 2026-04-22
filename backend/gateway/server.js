const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

app.use(cors());

app.get("/", (req, res) => {
  res.json({
    message: "API Gateway funcionando 🌐"
  });
});

/* AUTH */
app.use("/auth", createProxyMiddleware({
  target: "http://localhost:3001",
  changeOrigin: true,
  pathRewrite: {
    "^/auth": ""
  }
}));

/* FOOD */
app.use("/foods", createProxyMiddleware({
  target: "http://localhost:3002",
  changeOrigin: true
}));

/* RECIPES */
app.use("/recipes", createProxyMiddleware({
  target: "http://localhost:3003",
  changeOrigin: true
}));

/* LOGS */
app.use("/logs", createProxyMiddleware({
  target: "http://localhost:3004",
  changeOrigin: true
}));

/* STATS */
app.use("/stats", createProxyMiddleware({
  target: "http://localhost:3005",
  changeOrigin: true
}));

app.listen(3000, () => {
  console.log("Gateway corriendo en puerto 3000");
});