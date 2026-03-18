describe('Cadastro - Toggle e navegação', () => {

  it('Botão de voltar no form de cadastro e de login', () => {

    cy.visit('/editais')

    cy.contains('NOVO CADASTRO').click()

    cy.origin(Cypress.env('AUTH_URL'), () => {
      cy.url().should('include', 'auth')
      cy.contains('Voltar').click()
    })

    cy.url().should('include', '/editais')

    cy.contains('ACESSAR').click()
    cy.contains('Área Participante').click()

    cy.origin(Cypress.env('AUTH_URL'), () => {
      cy.contains('Voltar').click()
    })

    cy.url().should('include', '/editais')

  })

  it('Deve exibir campo Passaporte ao marcar "É estrangeiro?"', () => {

    cy.visit('/editais')

    cy.contains('button', 'NOVO CADASTRO')
      .should('be.visible')
      .click()

    cy.origin(Cypress.env('AUTH_URL'), () => {

      cy.contains('Registre-se')
        .should('be.visible')

      cy.contains('É estrangeiro?')
        .parent()
        .find('input[type="checkbox"]')
        .check({ force: true })

      cy.contains('Passaporte')
        .should('be.visible')

    })

  })

})