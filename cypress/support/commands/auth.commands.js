const AUTH = Cypress.env('AUTH_URL')

Cypress.Commands.add('login', () => {

  cy.fixture('usuario').then((usuario) => {

    cy.contains('button', 'ACESSAR').click()
    cy.contains('button', 'Área Participante').click()

    cy.origin(AUTH, { args: { usuario } }, ({ usuario }) => {
      cy.get('#username').type(usuario.email)
      cy.get('#password').type(usuario.senha)
      cy.get('#kc-login').click()
    })

    // Aguarda o dropdown do usuário para garantir que o login foi concluído
    cy.get('[data-kt-menu-trigger="click"]', { timeout: 15000 })
      .should('be.visible')

  })

})

Cypress.Commands.add('loginAdmin', () => {

  cy.contains('button', 'ACESSAR').click()
  cy.contains('button', 'Área Restrita').click()

  cy.origin(AUTH, {
    args: {
      email: Cypress.env('ADMIN_EMAIL'),
      senha: Cypress.env('ADMIN_SENHA')
    }
  }, ({ email, senha }) => {
    cy.get('#username').type(email)
    cy.get('#password').type(senha)
    cy.get('#kc-login').click()
  })

  cy.url({ timeout: 15000 }).should('include', '/admin')

})