describe('Autenticação - Esqueci senha', () => {

  it('Verifica comportamento da funcionalidade "Esqueci senha"', () => {

    cy.visit('/editais')
    cy.contains('button', 'ACESSAR').click()
    cy.contains('button', 'Área Participante').click()

    cy.origin(Cypress.env('AUTH_URL'), {
      args: {
        email: Cypress.env('ADMIN_EMAIL'),
        cpf:   Cypress.env('ADMIN_CPF')
      }
    }, ({ email, cpf }) => {

      // O sistema dispara exceções não tratadas nessa página que não
      // estão relacionadas ao fluxo testado, por isso são ignoradas
      Cypress.on('uncaught:exception', () => false)

      // ===== RESET POR EMAIL =====
      cy.contains('Esqueci senha').click()
      cy.url().should('include', 'reset-credentials?')

      cy.get('input[onclick="handleSelect(\'email\')"]').click()
      cy.get('#email', { timeout: 10000 }).should('be.visible').type(email)
      cy.get('#submitBtn').click()
      cy.contains('Você deverá receber um e-mail em breve com mais instruções.')
        .should('be.visible')

      // ===== RESET POR CPF =====
      cy.contains('Esqueci senha').click()
      cy.url().should('include', 'reset-credentials?')

      cy.get('input[onclick="handleSelect(\'cpf\')"]').click()
      cy.get('#cpf', { timeout: 10000 }).should('be.visible').type(cpf)
      cy.get('#btnVerificarIdentidade').click()
      cy.contains('Identidade verificada!').should('be.visible')

    })

  })

})