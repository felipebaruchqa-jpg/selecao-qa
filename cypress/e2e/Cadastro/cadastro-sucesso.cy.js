describe('Cadastro - Fluxo completo', () => {

  beforeEach(() => {
    // O sistema dispara uma exceção de JSON inválido durante o redirecionamento
    // pós-cadastro. Como não está relacionada ao fluxo testado, é ignorada.
    cy.on('uncaught:exception', (err) => {
      if (err.message.includes('Unexpected end of JSON input')) {
        return false
      }
    })
  })

  it('Cadastro com sucesso', () => {

    cy.gerarPessoa().then((dados) => {

      cy.abrirCadastro()

      cy.authOrigin(dados)

      cy.origin(Cypress.env('AUTH_URL'), () => {
        cy.contains('Cadastro realizado com sucesso.')
          .should('be.visible')
      })

      // Aguarda o redirecionamento automático de volta para o sistema
      cy.location('hostname', { timeout: 20000 })
        .should('eq', 'editais.teste.uneb.br')

      cy.origin(Cypress.env('SISTEMA_URL'), { args: { dados } }, ({ dados }) => {

        cy.on('uncaught:exception', (err) => {
          if (err.message.includes('Unexpected end of JSON input')) {
            return false
          }
        })

        cy.contains('Minha conta').click()

        cy.contains(dados.nome, { timeout: 10000 })
          .should('be.visible')

      })

    })

  })

})