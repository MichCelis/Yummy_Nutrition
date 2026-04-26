describe("Flujo 1: Registro y Login", () => {
  it("Registra un usuario nuevo y queda autenticado en el dashboard", () => {
    const timestamp = Date.now();
    const email = `test_${timestamp}@yummy.com`;
    const password = "test1234";

    cy.visit("/register");
    cy.contains("Crear cuenta").should("be.visible");
    cy.wait(800);

    cy.get('input[placeholder="Tu nombre"]').type("Usuario Cypress", { delay: 60 });
    cy.get('input[placeholder="tu@email.com"]').type(email, { delay: 60 });
    cy.get('input[placeholder="Mínimo 6 caracteres"]').type(password, { delay: 60 });
    cy.wait(500);

    cy.contains("button", "Registrarme").click();

    cy.url({ timeout: 10000 }).should("not.include", "/register");
    cy.url().should("not.include", "/login");

    cy.window().then((win) => {
      expect(win.localStorage.getItem("token")).to.exist;
    });

    cy.contains(/totales de hoy|hola|usuario cypress/i, { timeout: 8000 })
      .should("be.visible");
    cy.wait(1000);
  });

  it("Hace login exitoso con usuario existente", () => {
    cy.visit("/login");
    cy.contains(/inicia sesión/i).should("be.visible");
    cy.wait(800);

    cy.get('input[type="email"]').type("demo@yummy.com", { delay: 60 });
    cy.get('input[type="password"]').type("demo1234", { delay: 60 });
    cy.wait(500);

    cy.contains("button", "Iniciar sesión").click();

    cy.url({ timeout: 10000 }).should("not.include", "/login");
    cy.contains(/totales de hoy|hola/i).should("be.visible");

    cy.window().then((win) => {
      expect(win.localStorage.getItem("token")).to.exist;
    });
    cy.wait(1000);
  });

  it("Rechaza login con contraseña incorrecta", () => {
    cy.visit("/login");
    cy.wait(500);

    cy.get('input[type="email"]').type("demo@yummy.com", { delay: 60 });
    cy.get('input[type="password"]').type("password_incorrecto", { delay: 60 });
    cy.wait(500);

    cy.contains("button", "Iniciar sesión").click();

    cy.url().should("include", "/login");
    cy.contains(/contraseña incorrecta|incorrecta|error/i).should("be.visible");
    cy.wait(800);
  });
});