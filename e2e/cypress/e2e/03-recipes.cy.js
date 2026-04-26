describe("Flujo 3: Buscar receta y ver detalle", () => {
  beforeEach(() => {
    cy.loginAs("demo@yummy.com", "demo1234");
  });

  it("Busca una receta cacheada y la encuentra en los resultados", () => {
    cy.wait(1000);
    cy.contains(/recetas/i).click();
    cy.url().should("include", "/recipes");
    cy.wait(800);

    cy.get('input').first().type("chicken", { delay: 100 });
    cy.wait(500);

    cy.contains("button", /buscar/i).click();

    cy.contains(/Brown Stew Chicken/i, { timeout: 10000 }).should("be.visible");
    cy.wait(1500);
  });
});