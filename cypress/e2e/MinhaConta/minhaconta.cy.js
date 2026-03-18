describe('Minha Conta', () => {

afterEach(() => {
  // Usuário já está logado com a nova senha ao final do teste
  cy.get('[data-kt-menu-trigger="click"]', { timeout: 15000 })
    .should('be.visible')
    .click()

  cy.contains('a', 'Minha conta').click()
  cy.contains('ALTERAR SENHA').click()

  cy.origin(Cypress.env('AUTH_URL'), () => {
    cy.get('#password-new').clear().type('Teste@123')
    cy.get('#password-confirm').clear().type('Teste@123')
    cy.get('input[type="submit"][value="Ok"]').click()
  })
})

  it('Fluxo de alteração de senha', () => {

    // ===== GERAR SENHA ALEATÓRIA =====
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

    // ===== LOGIN =====
    cy.visit('/editais')
    cy.login()

    // ===== ACESSO À ALTERAÇÃO DE SENHA =====
    cy.get('[data-kt-menu-trigger="click"]', { timeout: 10000 })
      .should('be.visible')
      .click()

    cy.contains('a', 'Minha conta').click()
    cy.contains('ALTERAR SENHA').click()

    // ===== ALTERA A SENHA =====
    cy.origin(Cypress.env('AUTH_URL'), { args: { senhaGerada } }, ({ senhaGerada }) => {
      cy.get('#password-new').clear().type(senhaGerada)
      cy.get('#password-confirm').clear().type(senhaGerada)
      cy.get('input[type="submit"][value="Ok"]').click()
    })

    // ===== LOGOUT =====
    cy.get('[data-kt-menu-trigger="click"]', { timeout: 10000 })
      .should('be.visible')
      .click()

    cy.contains('a', 'Sair').click()

    cy.origin(Cypress.env('AUTH_URL'), () => {
      cy.get('#kc-logout').click()
    })

    // ===== LOGIN COM A NOVA SENHA =====
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





  // ===== GERADOR DE PESSOA =====
  cy.visit('https://geradornv.com.br/gerador-pessoas/')
  cy.get('#nv-new-generator-people').click()

  cy.then(() => {

    const dados = {}

    cy.get('#nv-field-name').invoke('text').then(v => dados.nome = v)
    cy.get('#nv-field-email').invoke('text').then(v => dados.email = v)
    cy.get('#nv-field-cpf').invoke('text').then(v => dados.cpf = v)
    cy.get('#nv-field-birthday').invoke('text').then(v => dados.birthday = v)
    cy.get('#nv-field-dad').invoke('text').then(v => dados.nomePai = v)
    cy.get('#nv-field-mom').invoke('text').then(v => dados.nomeMae = v)
    cy.get('#nv-field-rg').invoke('text').then(v => dados.rg = v)

    // ===== GERADOR DE CEP (OUTRO DOMÍNIO) =====
    cy.origin('https://www.geradordecep.com.br', () => {

      cy.visit('/')

      cy.get('#campoEstado').select('Bahia')
      cy.contains('button', 'Gerar CEP').click()

      cy.get('input.form-control-borderless[type="search"]')
        .should('not.have.value', '')
        .invoke('val')
        .then(cep => {
          Cypress.env('cepGerado', cep)
        })
    })

    // ===== RECUPERA CEP E SALVA DADOS =====
    cy.then(() => {
      dados.cep = Cypress.env('cepGerado')

      cy.log('Dados gerados:', JSON.stringify(dados))
      cy.wrap(dados).as('dadosGerados')
    })

  })

  // ===== LOGIN =====
  cy.visit('https://editais.teste.uneb.br/editais')
  cy.origin('https://editais.teste.uneb.br/editais', () => {
  cy.contains('button', 'ACESSAR').click()
  cy.contains('button', 'Área Participante').click()
  })

  cy.origin('https://auth.homologacao.uneb.br:8443', () => {
    cy.get('#username').type('testador@dasilva.com')
    cy.get('#password').type('Teste@123')
    cy.get('#kc-login').click()
  })

  // ===== ATUALIZA CADASTRO =====
  cy.get('@dadosGerados').then((dados) => {
    cy.origin('https://editais.teste.uneb.br/editais', { args: { dados } }, ({ dados }) => {

        Cypress.Commands.add('selectRandomByLabel', (labelText) => {
  // Encontra o dropdown pelo texto do label
  cy.contains('label', labelText)
    .closest('.mb-10')
    .find('input.el-select__input')
    .click({ force: true })

  // Aguarda o dropdown abrir e seleciona uma opção aleatória válida
  cy.get('.el-popper.el-select__popper[aria-hidden="false"]')
    .should('be.visible')
    .within(() => {
      cy.get('li.el-select-dropdown__item')
        .not('.is-disabled')
        .then($options => {
          const randomIndex = Math.floor(Math.random() * $options.length)
          cy.wrap($options[randomIndex]).click()
        })
    })
})
    cy.get('button[data-bs-toggle="dropdown"]').click()
    cy.contains('a', 'Minha conta').click()
    cy.contains('ALTERAR CADASTRO').click()

    cy.get('input[name="nome"]').clear().type(dados.nome)
    cy.get('input[name="nome_mae"]').clear().type(dados.nomeMae)
    cy.get('input[name="nome_pai"]').clear().type(dados.nomePai)
    cy.get('input[name="naturalidade"]').clear().type('Salvador')
    cy.get('input[name="cep"]').clear().type(dados.cep)
    cy.get('input[name="email"]').clear().type(dados.email)
    cy.get('input[name="rg"]').clear().type(dados.rg)
    cy.get('input[name="data_emissao"]').clear().type('2012-02-10')
    cy.get('input[name="numero_endereco"]').clear().type('1')
    cy.selectRandomByLabel('Sexo')
    cy.selectRandomByLabel('Nacionalidade')
    cy.selectRandomByLabel('Escolaridade')
    cy.selectRandomByLabel('Orgão expedidor')
    cy.selectRandomByLabel('UF expedidor')

    cy.contains('button', 'SALVAR').click()
    })
  })
})
})


