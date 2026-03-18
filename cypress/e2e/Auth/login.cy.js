describe('Autenticação - Login', () => {

  it('Fluxo de login, redirect dos botões "Minha conta", "Minhas Inscrições", "Meus Recursos" e logout', () => {

    cy.visit('/editais')

    cy.login()

    cy.get('[data-kt-menu-trigger="click"]', { timeout: 10000 }).should('be.visible').click()
    cy.contains('a', 'Minha conta').should('be.visible').click()
    cy.url().should('include', 'usuario/minha-conta')
    cy.get('img[alt="Logo do Seleção"]').click()

    cy.get('[data-kt-menu-trigger="click"]', { timeout: 10000 }).should('be.visible').click()
    cy.contains('a', 'Minhas Inscrições').should('be.visible').click()
    cy.url().should('include', 'minha-inscricao')
    cy.get('img[alt="Logo do Seleção"]').click()

    cy.get('[data-kt-menu-trigger="click"]', { timeout: 10000 }).should('be.visible').click()
    cy.contains('a', 'Meus Recursos').should('be.visible').click()
    cy.url().should('include', 'recurso')
    cy.get('img[alt="Logo do Seleção"]').click()

    cy.get('[data-kt-menu-trigger="click"]', { timeout: 10000 }).should('be.visible').click()
    cy.contains('a', 'Sair').should('be.visible').click()

    cy.origin(Cypress.env('AUTH_URL'), () => {
      cy.url().should('include', 'logout')
      cy.get('#kc-logout').click()
    })

    cy.url().should('include', 'uneb.br/editais')
    cy.contains('ACESSAR').should('be.visible')

  })

  it('Fluxo de login como admin e logout', () => {

    cy.visit('/editais')

    cy.loginAdmin()

  })

  it('Verifica se o botão de mudança de idioma nas telas de cadastro está funcionando', () => {

    cy.visit('/editais')

    cy.contains('NOVO CADASTRO').click()

    cy.origin(Cypress.env('AUTH_URL'), () => {

      cy.get('#kc-current-locale-link').click()
      cy.get('#language-1').click()

      cy.document({ timeout: 10000 })
        .its('documentElement.lang')
        .should('include', 'en')

      cy.contains('Register').should('be.visible')

    })

  })

  it('Verifica se a mensagem de usuário ou senha inválida está sendo exibida', () => {

    cy.visit('/editais')
    cy.contains('button', 'ACESSAR').click()
    cy.contains('button', 'Área Participante').click()

    cy.origin(Cypress.env('AUTH_URL'), () => {
      cy.get('#username').type('fulano@fulano.br')
      cy.get('#password').type('1234567890')
      cy.get('#kc-login').click()
      cy.contains('Nome de usuário ou senha inválida.').should('be.visible')
    })

    cy.visit('/editais')
    cy.contains('button', 'ACESSAR').click()
    cy.contains('button', 'Área Restrita').click()

    cy.origin(Cypress.env('AUTH_URL'), () => {
      cy.get('#username').type('fulano@fulano.br')
      cy.get('#password').type('1234567890')
      cy.get('#kc-login').click()
      cy.contains('Email ou senha inválidos').should('be.visible')
    })

  })

})