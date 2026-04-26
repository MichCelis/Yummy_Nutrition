const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:8080",
    viewportWidth: 1280,
    viewportHeight: 800,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 8000,
    env: {
      // Velocidad para demos: aumenta este número para ir más lento
      DEMO_DELAY: 600
    },
    setupNodeEvents(on, config) {},
  },
});