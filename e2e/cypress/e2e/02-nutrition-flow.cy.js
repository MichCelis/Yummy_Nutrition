describe("Flujo 2: Buscar alimento, registrarlo y verlo en stats", () => {
  beforeEach(() => {
    cy.loginAs("demo@yummy.com", "demo1234");
  });

  it("Busca un alimento y aparece en los resultados (cache hit del seeder)", () => {
    cy.wait(1000);
    cy.contains(/alimentos/i).click();
    cy.url().should("include", "/foods");
    cy.wait(800);

    cy.get('input').first().type("banana", { delay: 100 });
    cy.wait(500);

    cy.contains("button", /buscar/i).click();

    cy.contains(/banana/i, { timeout: 10000 }).should("be.visible");
    cy.wait(1500);
  });

  it("El dashboard muestra los totales del usuario demo", () => {
    cy.wait(800);
    cy.contains(/dashboard/i).click();

    cy.contains(/totales de hoy/i, { timeout: 10000 }).should("be.visible");
    cy.contains(/comidas registradas hoy/i).should("be.visible");
    cy.wait(1500);
  });
});