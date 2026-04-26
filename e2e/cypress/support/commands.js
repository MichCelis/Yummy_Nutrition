// Login programático: pega directo al API y guarda token + user en localStorage
// del CONTEXTO de la app. Esto evita pasar por el formulario y es ~10x más rápido.
//
// IMPORTANTE: tu app guarda 2 cosas en localStorage:
//   - token: el JWT
//   - user:  objeto {id, name, email}
// Ambas son requeridas por el ProtectedRoute para considerarte autenticado.
Cypress.Commands.add("loginAs", (email = "demo@yummy.com", password = "demo1234") => {
  cy.request("POST", "http://localhost:3000/api/auth/login", { email, password })
    .then((res) => {
      const token = res.body.token;
      const user = res.body.user;

      // Visitamos primero para tener una window de la app, y le inyectamos
      // las dos keys ANTES de que el JS de React arranque y revise sesión.
      cy.visit("/", {
        onBeforeLoad(win) {
          win.localStorage.setItem("token", token);
          win.localStorage.setItem("user", JSON.stringify(user));
        },
      });
    });
});