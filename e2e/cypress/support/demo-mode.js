// Modo demo simplificado: solo loguea que está activo.
// El slowdown real se hace con cy.wait() y { delay } dentro de los tests.

const isDemo = Cypress.env("demo") === true || Cypress.env("demo") === "true";

if (isDemo) {
  console.log("🎬 Cypress en MODO DEMO");
}

// Puedes usar cy.demoPause() en tests si quieres pausas adicionales
Cypress.Commands.add("demoPause", (ms = 800) => {
  cy.wait(ms, { log: false });
});