const { createApp } = require("./app");

const app = createApp();

const AUTH_URL    = process.env.AUTH_SERVICE_URL    || "http://auth-service:3001";
const FOOD_URL    = process.env.FOOD_SERVICE_URL    || "http://food-service:3002";
const RECIPE_URL  = process.env.RECIPE_SERVICE_URL  || "http://recipe-service:3003";
const LOG_URL     = process.env.LOG_SERVICE_URL     || "http://log-service:3004";
const STATS_URL   = process.env.STATS_SERVICE_URL   || "http://stats-service:3005";

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 API Gateway corriendo en http://localhost:${PORT}`);
  console.log(`🔀 Redirigiendo a:`);
  console.log(`   auth:    ${AUTH_URL}`);
  console.log(`   food:    ${FOOD_URL}`);
  console.log(`   recipe:  ${RECIPE_URL}`);
  console.log(`   log:     ${LOG_URL}`);
  console.log(`   stats:   ${STATS_URL}`);
});