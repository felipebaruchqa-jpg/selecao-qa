const SISTEMA = Cypress.env('SISTEMA_URL')
const AUTH    = Cypress.env('AUTH_URL')

Cypress.Commands.add('abrirCadastro', () => {

  cy.visit('/editais')

  cy.contains('button', 'NOVO CADASTRO', { timeout: 15000 })
    .should('be.visible')
    .click()

})

Cypress.Commands.add('authOrigin', (dados) => {

  cy.origin(AUTH, { args: { dados } }, ({ dados }) => {

    cy.get('#firstName')
      .should('be.visible')
      .type(dados.nome)

    cy.get('#lastName')
      .type('Dos Santos')

    cy.get('#user\\.attributes\\.nome_social')
      .type(dados.nome)

    cy.get('#email')
      .type(dados.email)

    cy.get('#CPF1')
      .type(dados.cpf)

    cy.get('#user\\.attributes\\.nascimento')
      .type('1993-08-19')

    cy.get('#celular')
      .type(dados.cellphone)

    cy.get('#password')
      .type(dados.senha)

    cy.get('#password-confirm')
      .type(dados.senha)

    cy.get('input[value="Cadastrar"]')
      .click()

  })

})

Cypress.Commands.add('authOriginValidacoes', () => {

  cy.origin(AUTH, () => {

    const clicarCadastrar = () => {
      cy.get('input[value="Cadastrar"]')
        .should('be.visible')
        .click()
    }

    const validarCampoObrigatorio = (selector) => {
      clicarCadastrar()
      cy.get(selector)
        .should('exist')
        .then(($campo) => {
          expect($campo[0].checkValidity()).to.be.false
        })
    }

    const preencherCampo = (selector, valor) => {
      cy.get(selector)
        .should('be.visible')
        .clear()
        .type(valor)
    }

    validarCampoObrigatorio('#firstName')
    preencherCampo('#firstName', 'Testador')

    validarCampoObrigatorio('#lastName')
    preencherCampo('#lastName', 'Silva')

    validarCampoObrigatorio('#email')
    preencherCampo('#email', 'teste@email.com')

    validarCampoObrigatorio('#CPF1')
    preencherCampo('#CPF1', '49805250830')

    validarCampoObrigatorio('#user\\.attributes\\.nascimento')
    preencherCampo('#user\\.attributes\\.nascimento', '1990-10-10')

    validarCampoObrigatorio('#celular')
    preencherCampo('#celular', '71999999999')

    validarCampoObrigatorio('#password')
    preencherCampo('#password', 'Teste@123')

    validarCampoObrigatorio('#password-confirm')

  })

})