describe('Minha Conta', () => {

  afterEach(() => {
    cy.get('[data-kt-menu-trigger="click"]', { timeout: 15000 })
      .should('be.visible')
      .click()

    cy.contains('a', 'Minha conta').click()
    cy.contains('ALTERAR SENHA').click()

    cy.origin(Cypress.env('AUTH_URL'), () => {
      cy.get('#password-new').clear().type('Teste@123')
      cy.get('#password-confirm').clear().type('Teste@123')
      // tenta achar qualquer botão de submit possível (input ou button) e clicar
      cy.get('body').then(($body) => {
        const temInputSubmit = $body.find('input[type="submit"]').length > 0
        const temButtonSubmit = $body.find('button[type="submit"]').length > 0

       if (temInputSubmit) {
        cy.get('input[type="submit"]')
          .first()
          .click({ force: true })
        } else if (temButtonSubmit) {
        cy.get('button[type="submit"]')
          .first()
          .click({ force: true })
  } else {
    // fallback por texto em PT/EN, caso o tema use button sem type=submit
    cy.contains('button, input', /ok|confirmar|salvar|save|submit/i, { timeout: 10000 })
      .click({ force: true })
  }
})

    })
  })

  it('Fluxo de alteração de senha', () => {

    const gerarSenha = () => {
      const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      const lower = 'abcdefghijklmnopqrstuvwxyz'
      const numbers = '0123456789'
      const special = '~!@#$%^&*_-=+?<>'

      const pick = str => str[Math.floor(Math.random() * str.length)]

      const senha =
        pick(upper) +
        pick(lower) +
        pick(numbers) +
        pick(numbers) +
        pick(numbers) +
        pick(numbers) +
        pick(numbers) +
        pick(numbers) +
        pick(special)

      return senha.split('').sort(() => Math.random() - 0.5).join('')
    }

    const senhaGerada = gerarSenha()
    cy.log(`🔑 Senha gerada: ${senhaGerada}`)

    cy.visit('/editais')
    cy.login()

    cy.get('[data-kt-menu-trigger="click"]', { timeout: 10000 })
      .should('be.visible')
      .click()

    cy.contains('a', 'Minha conta').click()
    cy.contains('ALTERAR SENHA').click()

    cy.origin(Cypress.env('AUTH_URL'), { args: { senhaGerada } }, ({ senhaGerada }) => {
      cy.get('#password-new').clear().type(senhaGerada)
      cy.get('#password-confirm').clear().type(senhaGerada)
      // tenta achar qualquer botão de submit possível (input ou button) e clicar
      cy.get('body').then(($body) => {
          const temInputSubmit = $body.find('input[type="submit"]').length > 0
          const temButtonSubmit = $body.find('button[type="submit"]').length > 0

          if (temInputSubmit) {
            cy.get('input[type="submit"]')
              .first()
              .click({ force: true })
          } else if (temButtonSubmit) {
            cy.get('button[type="submit"]')
              .first()
              .click({ force: true })
          } else {
    // fallback por texto em PT/EN, caso o tema use button sem type=submit
            cy.contains('button, input', /ok|confirmar|salvar|save|submit/i, { timeout: 10000 })
              .click({ force: true })
          }
})

    })

    cy.get('[data-kt-menu-trigger="click"]', { timeout: 10000 })
      .should('be.visible')
      .click()

    cy.contains('a', 'Sair').click()

    cy.origin(Cypress.env('AUTH_URL'), () => {
      cy.get('#kc-logout').click()
    })

    cy.contains('button', 'ACESSAR').click()
    cy.contains('button', 'Área Participante').click()

    cy.origin(Cypress.env('AUTH_URL'), { args: { senhaGerada } }, ({ senhaGerada }) => {
      cy.fixture('usuario').then((usuario) => {
        cy.get('#username').type(usuario.email)
        cy.get('#password').type(senhaGerada)
        cy.get('#kc-login').click()
      })
    })
  })

it('Fluxo de atualização de cadastro', () => {
  // Handler global (fora e dentro do fluxo) para erros conhecidos do sistema
  Cypress.on('uncaught:exception', (err) => {
    if (
      err.message.includes('Internal Server Error') ||
      err.message.includes('ResizeObserver loop completed') ||
      err.message.includes("Cannot read properties of null (reading 'cep')") ||
      err.message.includes('Bad Request')
    ) {
      return false
    }
  })

  cy.gerarPessoa().then((dados) => {
    cy.visit('/editais')
    cy.login()

    // Captura unhandled promise rejection no contexto da aplicação (mesmo origin)
    cy.window().then((win) => {
      win.addEventListener('unhandledrejection', (event) => {
        const msg = event.reason?.message || String(event.reason || '')
        if (msg.includes("Cannot read properties of null (reading 'cep')")) {
          event.preventDefault()
        }
      })
    })

    const cepsFallback = ['40728235', '41820020', '40301110']

    const aguardarSemOverlayLoading = () => {
      cy.get('body').then(($b) => {
        if ($b.find('.loading-overlay').length) {
          cy.get('.loading-overlay', { timeout: 20000 }).should('not.exist')
        }
      })
    }

    const tentarCep = (cep, index = 0) => {
      cy.get('input[name="cep"]').clear().type(cep)
      cy.wait(1500)

      cy.get('input[name="rua"]', { timeout: 15000 }).then(($rua) => {
        if (($rua.val() || '').toString().trim() === '') {
          if (index < cepsFallback.length) {
            cy.log(`⚠️ CEP ${cep} inválido, tentando fallback: ${cepsFallback[index]}`)
            tentarCep(cepsFallback[index], index + 1)
          } else {
            throw new Error('Nenhum CEP válido encontrado após todas as tentativas')
          }
        } else {
          cy.log(`✅ CEP ${cep} válido e carregado`)
        }
      })
    }

    const selectRandomByLabel = (labelText) => {
      cy.contains('label', labelText)
        .closest('.mb-10')
        .find('input.el-select__input')
        .click({ force: true })

      cy.get('.el-popper.el-select__popper[aria-hidden="false"]', { timeout: 10000 })
        .should('be.visible')
        .within(() => {
          cy.get('li.el-select-dropdown__item')
            .not('.is-disabled')
            .then(($options) => {
              const randomIndex = Math.floor(Math.random() * $options.length)
              cy.wrap($options[randomIndex]).click({ force: true })
            })
        })

      cy.get('body').type('{esc}', { force: true })
      cy.get('body').click(0, 0, { force: true })
    }

    // ===== ATUALIZAÇÃO =====
cy.get('[data-kt-menu-trigger="click"]', { timeout: 20000 })
  .should('be.visible')
  .then(($el) => $el[0].click())

    cy.contains('a', 'Minha conta', { timeout: 15000 })
      .should('be.visible')
      .click()

    cy.contains('ALTERAR CADASTRO', { timeout: 15000 })
      .should('be.visible')
      .click()

    aguardarSemOverlayLoading()

    // garante que o form carregou
    cy.get('input[name="nome"]', { timeout: 20000 }).should('be.visible')

    cy.get('input[name="nome"]').clear().type(dados.nome)
    cy.get('input[name="nome_mae"]').clear().type(dados.nomeMae)
    cy.get('input[name="nome_pai"]').clear().type(dados.nomePai)
    cy.get('input[name="naturalidade"]').clear().type('Salvador')

    tentarCep(dados.cep, 0)

    cy.get('input[name="numero_endereco"]').clear().type('1')

    // espera processamento do CEP
    aguardarSemOverlayLoading()

    cy.get('input[name="rg"]').clear().type(dados.rg)
    cy.get('input[name="data_emissao"]').clear().type('2012-02-10')

    selectRandomByLabel('Sexo')
    selectRandomByLabel('Nacionalidade')
    selectRandomByLabel('Escolaridade')
    selectRandomByLabel('Órgão expedidor')
    selectRandomByLabel('UF expedidor')

    cy.contains('button', 'SALVAR', { timeout: 15000 })
      .should('be.visible')
      .click({ force: true })

    // espera final (ESSENCIAL)
    aguardarSemOverlayLoading()

    // se existir toast de sucesso, valida (não quebra se o texto variar)
    cy.contains(/alteração realizada com sucesso|sucesso/i, { timeout: 20000 }).should('exist')
  })
})

})