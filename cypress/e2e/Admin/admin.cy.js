/// <reference types="cypress" />

describe('Testes na Tela de Admin', () => {
it('Verificar fluxo de criação de um edital', () => {
  cy.gerarPessoa().then((dados) => {
    const texto = Math.random().toString(36).substring(2, 10)
    cy.log(`📝 Texto gerado: ${texto}`)

    function selecionarOpcaoAleatoria(selectorOuElemento, nomeCampo) {
      const tentarSelecionar = (tentativa = 1) => {
        cy.log(`🔎 Tentando abrir o dropdown de "${nomeCampo}" (tentativa ${tentativa})`)

        const getElemento =
          typeof selectorOuElemento === 'string'
            ? cy.get(selectorOuElemento).should('exist').scrollIntoView()
            : cy.wrap(selectorOuElemento).scrollIntoView()

        // abre o dropdown
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
              return tentarSelecionar(tentativa + 1)
            }
            throw new Error(`❌ Falha: dropdown de "${nomeCampo}" não abriu após 8 tentativas`)
          }

          // pega opções válidas (não desabilitadas) e com texto
          cy.get('.el-select__popper:visible', { timeout: 10000 })
            .should('be.visible')
            .find('.el-select-dropdown__item:not(.is-disabled)', { timeout: 10000 })
            .should('have.length.greaterThan', 0)
            .then(($options) => {
              const opcoesValidas = Cypress._.filter($options.toArray(), (el) => {
                const txt = (el.innerText || '').trim()
                return txt.length > 0
              })

              if (opcoesValidas.length === 0) {
                if (tentativa < 8) {
                  cy.log(`⚠️ Nenhuma opção válida (com texto) em "${nomeCampo}", tentando novamente...`)
                  cy.wait(800)
                  return tentarSelecionar(tentativa + 1)
                }
                throw new Error(
                  `❌ Falha: dropdown de "${nomeCampo}" sem opções válidas após 8 tentativas`
                )
              }

              const index = Math.floor(Math.random() * opcoesValidas.length)
              const randomText = (opcoesValidas[index].innerText || '').trim()

              cy.log(`✅ "${nomeCampo}": selecionando "${randomText}"`)

              // clica na opção garantindo foco e clique real
              cy.wrap(opcoesValidas[index]).scrollIntoView().click({ force: true })

              // fecha o dropdown de forma confiável (serve para single e multi)
              cy.get('body').type('{esc}', { force: true })
              cy.get('body').click(0, 0, { force: true })

              // ✅ validação real: o select refletiu o texto escolhido
              const campo =
                typeof selectorOuElemento === 'string'
                  ? cy.get(selectorOuElemento)
                  : cy.wrap(selectorOuElemento)

              campo.closest('.el-select__wrapper').should('contain', randomText)

              // ✅ salva o texto selecionado para validação futura (se quiser)
              const alias = `${nomeCampo
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, '')}Selecionado`

              cy.wrap(randomText).as(alias)
            })
        })
      }

      tentarSelecionar()
    }

    cy.visit('/')
    cy.loginAdmin()

    // Aguarda o menu lateral estar disponível
    cy.contains('.menu-title', 'Cadastros', { timeout: 15000 }).should('be.visible')

    // ===== NAVEGAÇÃO =====
    cy.wait(500)

    // Clica em Cadastros (forçado + seguro)
    cy.contains('.menu-title', 'Cadastros')
      .should('be.visible')
      .then(($el) => $el[0].click())

    // 🔥 GARANTE que o menu expandiu (ESSENCIAL)
    cy.contains('.menu-title', 'Editais', { timeout: 10000 })
      .should('be.visible')
      .should('not.have.css', 'display', 'none')

    // Pequeno respiro pra animação (Vue)
    cy.wait(500)

    // Clique robusto
    cy.contains('.menu-title', 'Editais').then(($el) => $el[0].click())

    // Agora sim valida navegação
    cy.url({ timeout: 20000 }).should('include', 'cadastros/editais')

    // Aguarda o overlay de loading desaparecer
    cy.get('.loading-overlay', { timeout: 15000 }).should('not.exist')

    cy.contains('button', 'Novo Cadastro', { timeout: 15000 }).should('be.visible').click()

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
      const seletor =
        $body.find('input[name="unidadeExterna"]').length > 0
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
        const invalido = $body
          .find('input[name="edital"]')
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
    cy.get('textarea[name="descricao"]')
      .clear()
      .type('Este é a descrição de teste para o edital ' + texto)

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

    // ===== VALIDAÇÃO ESTÁVEL DOS SELECTS (SUBSTITUI SELETORES FRÁGEIS) =====
    cy.get('input[name="tipo_formulario"]:checked').should('exist')

    cy.get('@FormularioPersonalizadoSelecionado').then((txt) => {
      cy.get('input[name="formulariosId"]').closest('.el-select').should('contain', txt)
    })

    cy.get('@EscolaridadeSelecionado').then((txt) => {
      cy.get('input[name="possui_escolaridade"]').closest('.el-select').should('contain', txt)
    })

    cy.get('@DadosEspecificosSelecionado').then((txt) => {
      cy.get('input[name="dadosEspecificos"]')
        .parents('.el-form-item')
        .first()
        .should('contain', txt)
    })

    cy.get('input[name="titulo_area"]').should('not.have.value', '')

    // Fecha qualquer dropdown aberto antes de continuar
    cy.get('body').click(0, 0)

    // Aguarda o overlay de loading desaparecer antes de continuar
    cy.get('.loading-overlay', { timeout: 15000 }).should('not.exist')

    // ===== PENDÊNCIAS OBRIGATÓRIAS (CARGOS) - preencher antes de continuar =====

    const preencherSeExistirESetiverVazio = (selector, valor, nomeCampo) => {
      cy.get('body').then(($body) => {
        if ($body.find(selector).length) {
          cy.get(selector).then(($el) => {
            const atual = ($el.val() ?? '').toString().trim()
            if (!atual) {
              cy.log(`🛠️ Preenchendo: ${nomeCampo}`)
              cy.wrap($el)
                .scrollIntoView()
                .clear({ force: true })
                .type(valor, { force: true })
            } else {
              cy.log(`✅ Já preenchido: ${nomeCampo}`)
            }
          })
        }
      })
    }

    const selecionarSeExistir = (selector, nomeCampo) => {
      cy.get('body').then(($body) => {
        if ($body.find(selector).length) {
          cy.log(`🛠️ Selecionando: ${nomeCampo}`)
          selecionarOpcaoAleatoria(selector, nomeCampo)
        }
      })
    }

    // Inputs obrigatórios do cargo
    preencherSeExistirESetiverVazio(
      'input[name="cargos[0].nome"]',
      `Cargo ${texto}`,
      'Cargo - Nome'
    )
    preencherSeExistirESetiverVazio('input[name="cargos[0].valor"]', '10', 'Cargo - Valor')

    // Selects obrigatórios/relacionados do cargo
    selecionarSeExistir('input[name="cargos[0].cidadesCargo"]', 'Cargo - Cidades')
    selecionarSeExistir('input[name="cargos[0].departamentosCargo"]', 'Cargo - Departamento')
    selecionarSeExistir('input[name="cargos[0].campusCargo"]', 'Cargo - Campus')
    selecionarSeExistir('input[name="cargos[0].cursosCargo"]', 'Cargo - Curso')
    selecionarSeExistir('input[name="cargos[0].disciplinasCargo"]', 'Cargo - Disciplina')

    cy.get('button.botaoStepperContinuar', { timeout: 15000 }).scrollIntoView().click({
      force: true
    })

    // ===== ETAPA 3 - ANEXOS =====

    // Dropdown Tipo de Anexo (multiseleção - 1 a 3 opções aleatórias)
    let primeiraOpcao = ''

    cy.get('input[name="anexos[0].tipo_anexo"]').closest('.el-select__wrapper').click({ force: true })

    cy.get('.el-select__popper:visible', { timeout: 10000 })
      .find('.el-select-dropdown__item:not(.is-disabled)', { timeout: 10000 })
      .should('have.length.greaterThan', 0)
      .then(($options) => {
        // filtra opções que tenham texto (evita escolher item vazio)
        const opcoesValidas = Cypress._.filter($options.toArray(), (el) => {
          const txt = (el.innerText || '').trim()
          return txt.length > 0
        })

        expect(opcoesValidas.length, 'opções válidas com texto').to.be.greaterThan(0)

        const total = opcoesValidas.length
        const quantidade = Math.floor(Math.random() * 3) + 1
        cy.log(`🎯 Selecionando ${quantidade} tipo(s) de anexo`)

        for (let i = 0; i < quantidade; i++) {
          const index = Math.floor(Math.random() * total)
          const textoOpcao = (opcoesValidas[index].innerText || '').trim()

          if (i === 0) {
            primeiraOpcao = textoOpcao
            cy.log(`📎 Primeira opção: ${primeiraOpcao}`)
          }

          cy.wrap(opcoesValidas[index]).click({ force: true })
        }

        cy.get('body').click(0, 0)
      })
      .then(() => {
        // garante que primeiraOpcao não ficou vazia
        expect(primeiraOpcao, 'primeiraOpcao não pode ser vazia').to.not.equal('')
        cy.wrap(primeiraOpcao).as('primeiroAnexoSelecionado')
      })

    // Nome do Documento (igual à primeira opção selecionada)
    cy.get('@primeiroAnexoSelecionado').then((nomeDoc) => {
      cy.get('input[name="anexos[0].nome"]')
        .scrollIntoView()
        .clear({ force: true })
        .type(nomeDoc, { force: true })
    })

    cy.get('input[name="anexos[0].obrigatorio"]').then(($toggle) => {
      if (Math.random() < 0.5) cy.wrap($toggle).check({ force: true })
    })

    cy.get('.loading-overlay', { timeout: 15000 }).should('not.exist')
    cy.get('button.botaoStepperContinuar').click()

    // ===== ENVIAR (ROBUSTO) =====
    cy.get('.loading-overlay', { timeout: 20000 }).should('not.exist')

    cy.get('body').then(($body) => {
      const selectors = [
        'button.botaoStepperEnviar',
        'button[data-kt-stepper-action="submit"]',
        'button[type="submit"]',
        'button:contains("Enviar")',
        'button:contains("Cadastrar")',
        'button:contains("Finalizar")',
        'button:contains("Salvar")'
      ]

      const foundSelector = selectors.find((sel) => $body.find(sel).length > 0)

      if (!foundSelector) {
        const possiveis = $body
          .find('button')
          .toArray()
          .map((b) => b.innerText?.trim())
          .filter(Boolean)
          .slice(0, 30)

        throw new Error(
          `❌ Nenhum botão final encontrado (Enviar/Submit/Cadastrar/Finalizar). ` +
            `Botões visíveis (amostra): ${possiveis.join(' | ')}`
        )
      }

      cy.log(`✅ Botão final encontrado via: ${foundSelector}`)

      cy.get(foundSelector, { timeout: 15000 })
        .filter(':visible')
        .first()
        .scrollIntoView()
        .should('not.be.disabled')
        .click({ force: true })
    })

    cy.wait(2000)

    // ===== VALIDAÇÃO NA HOME =====
    cy.visit('/')

    cy.get('input[placeholder="Pesquisar editais, processos seletivos e mais"]', { timeout: 15000 })
      .should('be.visible')
      .type(texto)

    cy.get('.input-group-text.mouse_click').click()

    cy.contains(texto, { timeout: 15000 }).should('exist')
  })
})

//O teste abaixo ainda precisa ser finalizado
  it.skip('Verificar criação de um novo formulario', () => {
    cy.visit('https://editais.teste.uneb.br/')
    cy.contains('button', 'ACESSAR').click()
    cy.contains('button', 'Área Restrita').click()
    cy.origin('https://auth.homologacao.uneb.br:8443', () => {   
      cy.get('#username').type('felipepitanga@uneb.br')
      cy.get('#password').type('Kayser19081993@')
      cy.get('#kc-login').click()
    })
  })

it('Testa download dos arquivos svg, png e csv do grafico na pagina inicial da tela de admin', () => {
  cy.visit('/')
  cy.loginAdmin()
  cy.task('clearDownloads')

  const esperarDownloadAumentar = (antes, tentativas = 10) => {
    cy.task('downloadsList').then((depois) => {
      if (depois.length > antes.length) return
      if (tentativas <= 0) throw new Error('Download não apareceu a tempo')
      cy.wait(500)
      esperarDownloadAumentar(antes, tentativas - 1)
    })
  }

  const baixar = (menuSelector) => {
    cy.get('.apexcharts-menu-icon', { timeout: 10000 })
      .should('be.visible')
      .click({ force: true })

    cy.get(menuSelector, { timeout: 10000 })
      .should('be.visible')
      .click({ force: true })
  }

  // ===== DOWNLOAD SVG =====
  cy.task('downloadsList').then((filesBefore) => {
    baixar('.apexcharts-menu-item.exportSVG[title="Download SVG"]')
    esperarDownloadAumentar(filesBefore)
  })

  // ===== DOWNLOAD PNG =====
  cy.task('downloadsList').then((filesBefore) => {
    baixar('.apexcharts-menu-item.exportPNG[title="Download PNG"]')
    esperarDownloadAumentar(filesBefore)
  })

  // ===== DOWNLOAD CSV =====
  cy.task('downloadsList').then((filesBefore) => {
    baixar('.apexcharts-menu-item.exportCSV[title="Download CSV"]')
    esperarDownloadAumentar(filesBefore)
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

  const campoData = (label) =>
    cy.contains('label', label).parent().find('input.el-input__inner')

  // ===== HELPER: BUSCA NA HOME COM HARD RELOAD + RETRY =====
  const validarNaHomePorBuscaComRetry = (termo, deveExistir = true, tentativa = 1, maxTentativas = 6) => {
    cy.log(`🔎 Validação na Home (tentativa ${tentativa}/${maxTentativas})`)

    cy.visit('/')

    // força refresh real (equivalente ao F5 que você testou manualmente)
    cy.reload(true)

    // se existir overlay de loading na home, espera sair
    cy.get('body').then(($body) => {
      if ($body.find('.loading-overlay').length) {
        cy.get('.loading-overlay', { timeout: 20000 }).should('not.exist')
      }
    })

    // digita com delay para respeitar debounce do front
    cy.get('input[placeholder="Pesquisar avisos"]', { timeout: 15000 })
      .should('be.visible')
      .scrollIntoView()
      .click({ force: true })
      .clear({ force: true })
      .type(termo, { delay: 80 })
      .should('have.value', termo)

    // pequena janela para o filtro aplicar (debounce/client-side)
    cy.wait(800)

    cy.get('body').then(($body) => {
      const achou = $body.text().includes(termo)

      if (deveExistir) {
        if (achou) {
          cy.contains(termo, { timeout: 15000 }).should('exist')
        } else if (tentativa < maxTentativas) {
          cy.wait(1500)
          validarNaHomePorBuscaComRetry(termo, true, tentativa + 1, maxTentativas)
        } else {
          throw new Error(`❌ Não encontrei "${termo}" na Home após ${maxTentativas} tentativas`)
        }
      } else {
        // deve NÃO existir
        if (!achou) {
          cy.contains(termo).should('not.exist')
        } else if (tentativa < maxTentativas) {
          cy.wait(1500)
          validarNaHomePorBuscaComRetry(termo, false, tentativa + 1, maxTentativas)
        } else {
          throw new Error(`❌ "${termo}" ainda aparece na Home após ${maxTentativas} tentativas`)
        }
      }
    })
  }

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

  campoData('Data do Título').type(dataHoje)
  campoData('Início da publicação').type(dataHojeComHora)

  cy.contains('.el-select__selected-item span', 'Selecione o edital')
    .closest('.el-select')
    .click()

  cy.get('.el-select__popper:visible', { timeout: 10000 })
    .find('.el-select-dropdown__item:not(.is-disabled)', { timeout: 10000 })
    .should('have.length.greaterThan', 0)
    .then(($options) => {
      const total = $options.length
      expect(total).to.be.greaterThan(0)
      const index = Math.floor(Math.random() * total)
      cy.log(`🎯 Edital selecionado: ${$options.eq(index).text().trim()}`)
      cy.wrap($options.eq(index)).click({ force: true })
    })

  campoData('Encerramento da publicação').type(dataFutura)

  // ✅ Mantém o mesmo texto aleatório no título (identificador único)
  cy.get('input[placeholder="Informe o título da notícia"]')
    .type('Noticia Teste ' + texto)

  cy.contains('Inativo').click()
  cy.contains('Ativo').click()

  cy.contains('Arquivo').click()
  cy.get('#formFileMultiple').selectFile('assets/Teste.pdf')

  cy.get('#fileTitle0', { timeout: 10000 })
    .should('be.visible')
    .type('Teste')

  cy.contains('button', 'Cadastrar').click()

  // ===== VALIDAÇÃO DA NOTÍCIA NA HOME =====
  cy.wait(2000) // Pequena espera para garantir que a notícia foi publicada
  validarNaHomePorBuscaComRetry(texto, true)

  // ===== EXCLUSÃO DA NOTÍCIA =====
  cy.visit('/admin')

  cy.contains('Publicações', { timeout: 15000 }).should('be.visible').click()
  cy.contains('Notícias', { timeout: 10000 }).should('be.visible').click()

  // Busca novamente pelo texto antes de excluir (evita pegar a linha errada)
  cy.get('.input-group > .form-control', { timeout: 10000 })
    .should('be.visible')
    .clear({ force: true })
    .type(texto, { delay: 80 })
    .should('have.value', texto)

  // ✅ Encontra a linha que contém o texto e clica na lixeira dentro dela
  cy.contains('tr', texto, { timeout: 15000 })
    .should('exist')
    .within(() => {
      cy.get('a.btn.btn-icon i.ki-trash')
        .closest('a')
        .click({ force: true })
    })

  cy.contains('button.swal2-confirm', 'Confirmar', { timeout: 10000 })
    .click()

  // ===== VALIDAÇÃO DA EXCLUSÃO =====
  cy.wait(1000) // pequena espera para a exclusão refletir
  validarNaHomePorBuscaComRetry(texto, false)

})

            



})