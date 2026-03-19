/// <reference types="cypress" />

describe('Testes na Tela de Admin', () => {
  /*it('Verificar fluxo de criação de um edital', () => {

  cy.gerarPessoa().then((dados) => {

    const texto = Math.random().toString(36).substring(2, 10)
    cy.log(`📝 Texto gerado: ${texto}`)

    function selecionarOpcaoAleatoria(selectorOuElemento, nomeCampo) {
      const tentarSelecionar = (tentativa = 1) => {
        cy.log(`🔎 Tentando abrir o dropdown de "${nomeCampo}" (tentativa ${tentativa})`)

        const getElemento = typeof selectorOuElemento === 'string'
          ? cy.get(selectorOuElemento).should('exist').scrollIntoView()
          : cy.wrap(selectorOuElemento).scrollIntoView()

        if (tentativa === 1) {
          getElemento.click({ force: true })
        } else {
          cy.wait(800)
          typeof selectorOuElemento === 'string'
            ? cy.get(selectorOuElemento).closest('.el-select__wrapper').click({ force: true })
            : cy.wrap(selectorOuElemento).closest('.el-select__wrapper').click({ force: true })
        }

        cy.get('body').then(($body) => {
          const dropdownVisivel = $body.find('.el-select__popper:visible').length > 0

          if (!dropdownVisivel) {
            if (tentativa < 8) {
              cy.log(`⚠️ Dropdown "${nomeCampo}" não apareceu, tentando novamente...`)
              tentarSelecionar(tentativa + 1)
            } else {
              throw new Error(`❌ Falha: dropdown de "${nomeCampo}" não abriu após 8 tentativas`)
            }
          } else {
            cy.get('.el-select__popper:visible')
              .find('.el-select-dropdown__item')
              .then(($options) => {
                const total = $options.length
                if (total === 0) {
                  if (tentativa < 8) {
                    cy.log(`⚠️ Nenhuma opção encontrada no campo "${nomeCampo}"`)
                    cy.wait(800)
                    tentarSelecionar(tentativa + 1)
                  } else {
                    throw new Error(`❌ Falha: dropdown de "${nomeCampo}" sem opções após 8 tentativas`)
                  }
                } else {
                  const index = Math.floor(Math.random() * total)
                  const randomText = $options.eq(index).text().trim()
                  cy.log(`✅ "${nomeCampo}": selecionando "${randomText}"`)
                  cy.wrap($options.eq(index)).click({ force: true })
                }
              })
          }
        })
      }
      tentarSelecionar()
    }

    cy.visit('/')
    cy.loginAdmin()

    // Aguarda o menu lateral estar disponível
    cy.contains('.menu-title', 'Cadastros', { timeout: 15000 })
      .should('be.visible')

    // ===== NAVEGAÇÃO =====
    cy.wait(500)
    cy.contains('.menu-title', 'Cadastros').click()
    cy.contains('.menu-title', 'Editais', { timeout: 10000 }).should('be.visible').click()
    cy.contains('button', 'Novo Cadastro', { timeout: 10000 }).should('be.visible').click()

    // Aguarda o formulário carregar
    cy.get('input[name="ativo"]', { timeout: 10000 }).should('exist')

    // ===== ETAPA 1 =====

    // Checkbox Edital Externo (aleatório)
    cy.get('input[name="externo"]').then(($checkbox) => {
      if (Math.random() < 0.5) {
        cy.wrap($checkbox).check({ force: true })
        cy.log('☑️ Edital Externo: marcado')
      } else {
        cy.log('⬜ Edital Externo: não marcado')
      }
    })

    // Checkbox Publicar (sempre marcado)
    cy.get('input[name="ativo"]').check({ force: true })

    // Dropdown Unidade (aleatório) - seletor depende do estado do checkbox
    cy.get('body').then(($body) => {
      const seletor = $body.find('input[name="unidadeExterna"]').length > 0
        ? 'input[name="unidadeExterna"]'
        : 'input[name="unidade_id"]'

      selecionarOpcaoAleatoria(seletor, 'Unidade')
    })

    // Campo Número com retry se inválido
    const preencherNumero = () => {
      const numeroAleatorio = Math.floor(Math.random() * 999) + 1
      const numero = String(numeroAleatorio).padStart(3, '0') + '/2026'
      cy.get('input[name="edital"]').clear().type(numero)
      cy.get('input[name="titulo"]').click()
      cy.get('body').then(($body) => {
        const invalido = $body.find('input[name="edital"]')
          .closest('.el-input__wrapper')
          .hasClass('is-error')
        if (invalido) {
          cy.log('⚠️ Número já existente, gerando novo...')
          preencherNumero()
        }
      })
    }

    preencherNumero()

    // Título
    cy.get('input[name="titulo"]').clear().type('Edital de teste ' + texto)

    // Descrição
    cy.get('textarea[name="descricao"]').clear().type('Este é a descrição de teste para o edital ' + texto)

    // Dropdown Categoria (aleatório)
    selecionarOpcaoAleatoria('input[name="categoria"]', 'Categoria')

    // Contato
    cy.get('input[name="email"]').filter(':visible').clear().type(dados.email)

    // Logomarca
    cy.get('input[name="link_imagem"]').selectFile('assets/logomarcaedital.png', { force: true })

    const hoje = new Date()
    const dia = String(hoje.getDate()).padStart(2, '0')
    const mes = String(hoje.getMonth() + 1).padStart(2, '0')
    const ano = hoje.getFullYear()

    const dataHoje = `${dia}/${mes}/${ano}`
    const dataHojeComHora = `${dia}/${mes}/${ano} 00:00:00`
    const dataFutura = `31/12/2027 00:00:00`

    // Vigência (data futura com hora)
    cy.get('input[name="data_vigencia"]').type(dataFutura)

    // Publicação (data atual)
    cy.get('input[name="data_publicacao"]').type(dataHoje)

    // Período de inscrições (data atual até data futura)
    cy.get('input[name="p"]').type(dataHojeComHora)
    cy.get('input[name="e"]').type(dataFutura)

    // Fecha o calendário clicando fora
    cy.get('body').click(0, 0)

    // ===== CRONOGRAMA =====
    cy.contains('button', 'Adicionar').click()

    cy.get('input[name="cronogramas[0].acao"]', { timeout: 10000 })
      .should('be.visible')
      .type('Inscrição')

    cy.get('input[name="cronogramas[0].inicio"]').type(dataHojeComHora)

    // Data de término = 30 dias no futuro
    const dataTermino = new Date()
    dataTermino.setDate(dataTermino.getDate() + 30)
    const diaT = String(dataTermino.getDate()).padStart(2, '0')
    const mesT = String(dataTermino.getMonth() + 1).padStart(2, '0')
    const anoT = dataTermino.getFullYear()
    const dataTerminoFormatada = `${diaT}/${mesT}/${anoT} 00:00:00`

    cy.get('input[name="cronogramas[0].termino"]').type(dataTerminoFormatada)

    // Aguarda o overlay de loading desaparecer antes de continuar
    cy.get('.loading-overlay', { timeout: 15000 }).should('not.exist')

    cy.get('button.botaoStepperContinuar').click()

    // ===== ETAPA 2 - DADOS DO FORMULÁRIO =====

    // Radio Tipo de Formulário (aleatório)
    cy.get('input[name="tipo_formulario"]').then(($radios) => {
      const index = Math.floor(Math.random() * $radios.length)
      cy.wrap($radios.eq(index)).check({ force: true })
      cy.log(`🔘 Tipo de formulário: ${$radios.eq(index).val()}`)
    })

    // Dropdown Formulário Personalizado (aleatório)
    selecionarOpcaoAleatoria('input[name="formulariosId"]', 'Formulário Personalizado')

    // Dropdown Escolaridade (aleatório)
    selecionarOpcaoAleatoria('input[name="possui_escolaridade"]', 'Escolaridade')

    // Dropdown Dados Específicos (aleatório)
    selecionarOpcaoAleatoria('input[name="dadosEspecificos"]', 'Dados Específicos')

    // Título da Área
    cy.get('input[name="titulo_area"]').clear().type(texto)

    // Toggles (aleatórios)
    cy.get('input[name="habilitar_mudanca_status"]').then(($toggle) => {
      if (Math.random() < 0.5) cy.wrap($toggle).check({ force: true })
    })

    cy.get('input[name="possui_necessidade_especial"]').then(($toggle) => {
      if (Math.random() < 0.5) cy.wrap($toggle).check({ force: true })
    })

    cy.get('input[name="possui_boleto"]').then(($toggle) => {
      if (Math.random() < 0.5) cy.wrap($toggle).check({ force: true })
    })

    // ===== CARGOS =====
    // Remove o cargo padrão clicando no botão de excluir
    cy.get('button.el-button.el-button--danger.is-circle')
      .first()
      .click({ force: true })

    // Aguarda o cargo ser removido
    cy.get('input[name="cargos[0].nome"]').should('not.exist')

    // Verifica se todos os campos obrigatórios da etapa 2 foram preenchidos
    cy.get('input[name="tipo_formulario"]:checked').should('exist')

    cy.get('input[name="formulariosId"]')
      .closest('.el-select')
      .find('.el-select__selected-item:not(.el-select__input-wrapper):not(.is-transparent)')
      .should('exist')

    cy.get('input[name="possui_escolaridade"]')
      .closest('.el-select')
      .find('.el-select__selected-item:not(.el-select__input-wrapper):not(.is-transparent)')
      .should('exist')

    cy.get('input[name="dadosEspecificos"]')
      .closest('.el-select')
      .find('.el-select__selected-item:not(.el-select__input-wrapper):not(.is-transparent)')
      .should('exist')

    cy.get('input[name="titulo_area"]')
      .should('not.have.value', '')

    // Fecha qualquer dropdown aberto antes de continuar
    cy.get('body').click(0, 0)

    // Aguarda o overlay de loading desaparecer antes de continuar
    cy.get('.loading-overlay', { timeout: 15000 }).should('not.exist')

    cy.get('button.botaoStepperContinuar', { timeout: 15000 })
      .scrollIntoView()
      .click({ force: true })

    // ===== ETAPA 3 - ANEXOS =====

    // Dropdown Tipo de Anexo (multiseleção - 1 a 3 opções aleatórias)
    let primeiraOpcao = ''

    cy.get('input[name="anexos[0].tipo_anexo"]')
      .closest('.el-select__wrapper')
      .click({ force: true })

    cy.get('.el-select__popper:visible', { timeout: 10000 })
      .find('.el-select-dropdown__item', { timeout: 10000 })
      .then(($options) => {
        const total = $options.length
        const quantidade = Math.floor(Math.random() * 3) + 1
        cy.log(`🎯 Selecionando ${quantidade} tipo(s) de anexo`)

        for (let i = 0; i < quantidade; i++) {
          const index = Math.floor(Math.random() * total)
          if (i === 0) {
            primeiraOpcao = $options.eq(index).text().trim()
            cy.log(`📎 Primeira opção: ${primeiraOpcao}`)
          }
          cy.wrap($options.eq(index)).click({ force: true })
        }

        cy.get('body').click(0, 0)
      })

    // Nome do Documento (igual à primeira opção selecionada)
    cy.then(() => {
      cy.get('input[name="anexos[0].nome"]')
        .scrollIntoView()
        .clear({ force: true })
        .type(primeiraOpcao, { force: true })
    })

    // Toggle Documento Obrigatório (aleatório)
    cy.get('input[name="anexos[0].obrigatorio"]').then(($toggle) => {
      if (Math.random() < 0.5) cy.wrap($toggle).check({ force: true })
    })

    // Aguarda o overlay de loading desaparecer antes de continuar
    cy.get('.loading-overlay', { timeout: 15000 }).should('not.exist')

    // Avança para a próxima etapa
    cy.get('button.botaoStepperContinuar').click()

    // ===== ENVIAR =====
    cy.get('.loading-overlay', { timeout: 15000 }).should('not.exist')

    cy.get('button.botaoStepperEnviar', { timeout: 15000 })
      .should('be.visible')
      .click()

    // ===== VALIDAÇÃO NA HOME =====
    cy.visit('/')

    cy.get('input[placeholder="Pesquisar editais, processos seletivos e mais"]', { timeout: 15000 })
      .should('be.visible')
      .type(texto)

    cy.get('.input-group-text.mouse_click').click()

    cy.contains(texto, { timeout: 15000 })
      .should('exist')

  })

})*/

  /*it('Verificar criação de um novo formulario', () => {
    cy.visit('https://editais.teste.uneb.br/')
    cy.contains('button', 'ACESSAR').click()
    cy.contains('button', 'Área Restrita').click()
    cy.origin('https://auth.homologacao.uneb.br:8443', () => {   
      cy.get('#username').type('felipepitanga@uneb.br')
      cy.get('#password').type('Kayser19081993@')
      cy.get('#kc-login').click()
    })
  })*/

it('Testa download dos arquivos svg, png e csv do grafico na pagina inicial da tela de admin', () => {

  cy.visit('/')
  cy.loginAdmin()

  // ===== DOWNLOAD SVG =====
  cy.get('.apexcharts-menu-icon').click()
  cy.get('.apexcharts-menu-item.exportSVG[title="Download SVG"]').click()

  cy.task('downloadsList').then((filesBefore) => {
    cy.wait(2000)
    cy.task('downloadsList').then((filesAfter) => {
      expect(filesAfter.length).to.be.greaterThan(filesBefore.length)
    })
  })

  // ===== DOWNLOAD PNG =====
  cy.get('.apexcharts-menu-icon').click()
  cy.get('.apexcharts-menu-item.exportPNG[title="Download PNG"]').click()

  cy.task('downloadsList').then((filesBefore) => {
    cy.wait(2000)
    cy.task('downloadsList').then((filesAfter) => {
      expect(filesAfter.length).to.be.greaterThan(filesBefore.length)
    })
  })

  // ===== DOWNLOAD CSV =====
  cy.get('.apexcharts-menu-icon').click()
  cy.get('.apexcharts-menu-item.exportCSV[title="Download CSV"]').click()

  cy.task('downloadsList').then((filesBefore) => {
    cy.wait(2000)
    cy.task('downloadsList').then((filesAfter) => {
      expect(filesAfter.length).to.be.greaterThan(filesBefore.length)
    })
  })

})


it('Verifica a criação de uma notícia, valida se a mesma foi criada e publicada, faz a exclusão e valida se foi devidamente excluida', () => {

  // Ignora exceções da aplicação não relacionadas ao teste
  Cypress.on('uncaught:exception', () => false)

  const texto = Math.random().toString(36).substring(2, 10)
  cy.log(`📝 Texto gerado: ${texto}`)

  const hoje = new Date()
  const dia = String(hoje.getDate()).padStart(2, '0')
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const ano = hoje.getFullYear()

  const dataHoje = `${dia}/${mes}/${ano}`
  const dataHojeComHora = `${dia}/${mes}/${ano} 00:00:00`
  const dataFutura = `31/12/2027 00:00:00`

  cy.visit('/')
  cy.loginAdmin()

  // Aguarda a página admin carregar completamente
  cy.contains('h3', 'Próximos editais a encerrar inscrições', { timeout: 15000 })
    .should('be.visible')

  // ===== CRIAÇÃO DA NOTÍCIA =====
  cy.contains('Publicações').click()
  cy.contains('Notícias', { timeout: 10000 }).should('be.visible').click()
  cy.contains('button', 'Novo Cadastro', { timeout: 10000 }).should('be.visible').click()

  cy.get('input[placeholder="Descreva aqui o subtítulo da notícia"]', { timeout: 10000 })
    .should('be.visible')
    .type('Esta é uma descrição para uma noticia criada durante o teste automatizado, o nome dessa noticia é ' + texto)

  const campoData = (label) =>
    cy.contains('label', label).parent().find('input.el-input__inner')

  campoData('Data do Título').type(dataHoje)
  campoData('Início da publicação').type(dataHojeComHora)

  cy.contains('.el-select__selected-item span', 'Selecione o edital')
    .closest('.el-select')
    .click()

  cy.get('.el-select__popper:visible')
    .find('.el-select-dropdown__item:not(.is-disabled)')
    .then(($options) => {
      const total = $options.length
      expect(total).to.be.greaterThan(0)
      const index = Math.floor(Math.random() * total)
      cy.log(`🎯 Edital selecionado: ${$options.eq(index).text().trim()}`)
      cy.wrap($options.eq(index)).click()
    })

  campoData('Encerramento da publicação').type(dataFutura)

  cy.get('input[placeholder="Informe o título da notícia"]').type('Noticia Teste ' + texto)

  cy.contains('Inativo').click()
  cy.contains('Ativo').click()

  cy.contains('Arquivo').click()
  cy.get('#formFileMultiple').selectFile('assets/Teste.pdf')

  cy.get('#fileTitle0', { timeout: 10000 })
    .should('be.visible')
    .type('Teste')

  cy.contains('button', 'Cadastrar').click()

  // ===== VALIDAÇÃO DA NOTÍCIA NA HOME =====
  cy.visit('/')
  cy.contains(texto, { timeout: 15000 }).should('exist')

// ===== EXCLUSÃO DA NOTÍCIA =====
cy.visit('/admin')

cy.contains('Publicações', { timeout: 15000 }).should('be.visible').click()
cy.contains('Notícias', { timeout: 10000 }).should('be.visible').click()

  cy.contains('td a', texto, { timeout: 10000 })
    .closest('tr')
    .find('a.btn.btn-icon i.ki-trash')
    .closest('a')
    .click()

  cy.contains('button.swal2-confirm', 'Confirmar', { timeout: 10000 })
    .click()

  // ===== VALIDAÇÃO DA EXCLUSÃO =====
  cy.visit('/')
  cy.contains(texto).should('not.exist')

})
            



})