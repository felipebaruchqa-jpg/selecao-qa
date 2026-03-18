/// <reference types="cypress" />

describe('Homepage', () => {

  it('Verificar se as instruções para inscrição estão abrindo e exibindo o conteúdo correto', () => {

    cy.visit('/editais')

    cy.contains('Instruções para inscrição dos concursos').click()

    cy.get('#kt_accordion_1_body_2').within(() => {

      cy.get('span.text-emphasis')
        .should('contain', 'Prezado candidato, para efetuar sua inscrição é necessário:')

      cy.get('ul.text-emphasis').within(() => {
        cy.contains('li', 'Escolher o concurso desejado;').should('exist')
        cy.contains('li', 'Preencher e revisar corretamente o formulário de inscrição;').should('exist')
        cy.contains('li', 'Manter-se informado sobre o andamento do processo seletivo;').should('exist')
        cy.contains('li', 'Verificar se há pendências na inscrição para possíveis recursos;').should('exist')
      })

      cy.get('p.text-emphasis')
        .should('contain', 'ATENÇÃO: As inscrições serão aceitas exclusivamente durante o período pré-estabelecido.')

    })

  })




it('Verificar alteração de cadastro pelo fluxo de inscrição em edital', () => {

  // Ignora exceções da aplicação não relacionadas ao teste
  cy.on('uncaught:exception', (err) => {
    if (
      err.message.includes('Internal Server Error') ||
      err.message.includes('ResizeObserver loop completed')
    ) {
      return false
    }
  })

  cy.gerarPessoa().then((dados) => {

    cy.visit('/editais')

    cy.login()

    cy.origin(Cypress.env('SISTEMA_URL'), { args: { dados } }, ({ dados }) => {

      // Ignora exceções internas da aplicação não relacionadas ao teste
      cy.on('uncaught:exception', (err) => {
        if (
          err.message.includes('Internal Server Error') ||
          err.message.includes('ResizeObserver loop completed')
        ) {
          return false
        }
      })

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

      cy.contains('a', 'Inscreva-se', { timeout: 15000 })
        .should('exist')
        .then(($el) => $el[0].click())

      cy.contains('button', 'Faça sua inscrição', { timeout: 10000 })
        .should('be.visible')
        .then(($el) => $el[0].click())

      cy.contains('button', 'Desejo alterar meus dados')
        .should('exist')
        .then(($el) => $el[0].click())

      // ===== INFORMAÇÕES PESSOAIS =====
      cy.get('input[name="nome"]', { timeout: 10000 })
        .should('be.visible')
        .clear()
        .type(dados.nome)

      cy.get('input[name="nome_mae"]').clear().type(dados.nomeMae)
      cy.get('input[name="nome_pai"]').clear().type(dados.nomePai)

      selecionarOpcaoAleatoria('input[name="sexo"]', 'Sexo')

      cy.contains('label', 'Escolaridade')
        .closest('div')
        .find('input.el-select__input')
        .then(($input) => {
          selecionarOpcaoAleatoria($input, 'Escolaridade')
        })

      selecionarOpcaoAleatoria('input[name="nacionalidade"]', 'Nacionalidade')

      cy.get('input[name="naturalidade"]').clear().type('Salvador')

      // ===== DOCUMENTOS =====
      cy.get('input[name="email"]').clear().type(dados.email)
      cy.get('input[name="rg"]').clear().type(dados.rg)

      cy.get('input[name="data_emissao"]').clear().type(
        dados.dataEmissaoRg.split('/').reverse().join('-')
      )

      selecionarOpcaoAleatoria('input[name="orgao_expedidor"]', 'Orgão Expedidor')
      selecionarOpcaoAleatoria('input[name="uf_expedidor"]', 'UF Expedidor')

      // ===== ENDEREÇO =====
      cy.get('input[name="cep"]').clear().type(dados.cep)

      // Aguarda um tempo para o preenchimento automático via API de CEP
      cy.wait(3000)

      cy.get('input[name="rua"]').then(($rua) => {
        if ($rua.val() === '') {
          cy.log('⚠️ CEP gerado inválido, usando CEP de fallback')
          cy.get('input[name="cep"]').clear().type('40728235')
          cy.get('input[name="rua"]', { timeout: 15000 })
            .should('not.have.value', '')
        }
      })

      cy.get('input[name="numero_endereco"]').clear().type('1')

      cy.contains('button', 'SALVAR', { timeout: 10000 })
        .should('be.visible')
        .then(($el) => $el[0].click())

      // Valida mensagem de sucesso
      cy.contains('Alteração realizada com sucesso.', { timeout: 15000 })
        .should('be.visible')

    })

  })

})

it('Verificar fluxo de inscrição em processo aberto', () => {

  // Ignora exceções da aplicação não relacionadas ao teste
  cy.on('uncaught:exception', (err) => {
    if (
      err.message.includes('Internal Server Error') ||
      err.message.includes('ResizeObserver loop completed')
    ) {
      return false
    }
  })

  cy.gerarPessoa().then((dados) => {

    cy.fixture('cpfteste.pdf', 'base64').then((fileContent) => {

      cy.visit('/editais')

      cy.login()

      cy.origin(Cypress.env('SISTEMA_URL'), { args: { dados, fileContent } }, ({ dados, fileContent }) => {

        // Ignora exceções internas da aplicação não relacionadas ao teste
        cy.on('uncaught:exception', (err) => {
          if (
            err.message.includes('Internal Server Error') ||
            err.message.includes('ResizeObserver loop completed')
          ) {
            return false
          }
        })

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

        cy.contains('a', 'Inscreva-se', { timeout: 15000 })
          .should('exist')
          .then(($el) => $el[0].click())

        cy.contains('button', 'Faça sua inscrição', { timeout: 10000 })
          .should('be.visible')
          .then(($el) => $el[0].click())

        cy.contains('button', 'Não').click()

        // ===== INFORMAÇÕES PESSOAIS =====
        cy.get('input[name="nome"]', { timeout: 10000 })
          .should('be.visible')
          .clear()
          .type(dados.nome)

        cy.get('input[name="nome_mae"]').clear().type(dados.nomeMae)
        cy.get('input[name="nome_pai"]').clear().type(dados.nomePai)

        selecionarOpcaoAleatoria('input[name="sexo"]', 'Sexo')
        selecionarOpcaoAleatoria('input[name="escolaridade"]', 'Escolaridade')
        selecionarOpcaoAleatoria('input[name="nacionalidade"]', 'Nacionalidade')
        selecionarOpcaoAleatoria('input[name="cor"]', 'Cor')
        selecionarOpcaoAleatoria('input[name="estadoCivilId"]', 'Estado Civil')
        selecionarOpcaoAleatoria('input[name="estadoNascimentoId"]', 'Estado Nascimento')

        cy.get('input[name="naturalidade"]').clear().type('Salvador')

        // ===== DADOS PROFISSIONAIS =====
        cy.get('input[name="profissao"]').clear().type(dados.profissao)
        cy.get('input[name="formacao"]').clear().type(dados.formacao)

        // ===== DOCUMENTOS =====
        cy.get('input[name="rg"]').clear().type(dados.rg)
        cy.get('input[name="data_emissao"]').clear().type(dados.dataEmissaoRg)

        selecionarOpcaoAleatoria('input[name="orgao_expedidor"]', 'Orgão Expedidor')
        selecionarOpcaoAleatoria('input[name="uf_expedidor"]', 'UF Expedidor')

        // ===== TÍTULO DE ELEITOR =====
        cy.get('input[name="titulo_eleitor"]').clear().type(dados.tituloEleitor)
        cy.get('input[name="zona"]').clear().type(dados.zonaEleitoral)
        cy.get('input[name="secao"]').clear().type(dados.secaoEleitoral)
        cy.get('input[name="emissao_titulo"]').clear().type(dados.dataEmissaoTitulo)
        selecionarOpcaoAleatoria('input[name="uf_titulo"]', 'UF do Título')

        // ===== PIS/PASEP =====
        cy.get('input[name="numero_pis_pasep"]').clear().type(dados.pis)
        cy.get('input[name="registro_pis_pasep"]').clear().type(dados.dataPis)

        // ===== CNH =====
        cy.get('input[name="cnh"]').clear().type(dados.cnh)
        cy.get('input[name="emissao_cnh"]').clear().type(dados.dataEmissaoCnh)
        cy.get('input[name="validade_cnh"]').clear().type(dados.dataValidadeCnh)
        selecionarOpcaoAleatoria('input[name="categoria_cnh"]', 'Categoria CNH')

        // ===== CARTEIRA DE TRABALHO =====
        cy.get('input[name="numero_ctps"]').clear().type(dados.ctps)
        cy.get('input[name="numero_serie_ctps"]').clear().type(dados.serieCTPS)

        cy.get('input[name="emissao_ctps"]')
          .should('be.visible')
          .clear()
          .type(dados.dataEmissaoCtps)

        // Força o Vue a registrar o valor do último campo
        cy.get('input[name="numero_serie_ctps"]').click()

        // ===== ENDEREÇO =====
        cy.get('input[name="cep"]').clear().type(dados.cep)

        cy.get('input[name="rua"]', { timeout: 15000 }).then(($rua) => {
          if ($rua.val() === '') {
            cy.log('⚠️ CEP gerado inválido, usando CEP de fallback')
            cy.get('input[name="cep"]').clear().type('40728235')
            cy.get('input[name="rua"]', { timeout: 15000 })
              .should('not.have.value', '')
          }
        })

        cy.get('input[name="numero_endereco"]').clear().type('1')

        // Força o Vue a registrar o valor do último campo
        cy.get('input[name="cep"]').click()

        cy.contains('button', 'Continue', { timeout: 15000 })
          .should('be.visible')
          .then(($el) => $el[0].click())

        // Aguarda a etapa de dados específicos carregar
        cy.get('input[name="funcao"]', { timeout: 15000 })
          .should('exist')

        // ===== DADOS ESPECÍFICOS =====
        selecionarOpcaoAleatoria('input[name="funcao"]', 'Teste')
        selecionarOpcaoAleatoria('input[name="necessidade_especial"]', 'Necessidade Especial')

        // Se uma necessidade especial foi selecionada, preenche a descrição
        cy.get('body').then(($body) => {
          if ($body.find('input[name="descricao_necessidade_especial"]').length > 0) {
            cy.get('input[name="descricao_necessidade_especial"]')
              .type('Deficiencia Teste', { force: true })
          }
        })

        cy.get('input[name="cota_deficiente"]').then(($toggle) => {
          const vezes = Math.floor(Math.random() * 11)
          const deficienteAtivado = vezes % 2 !== 0
          cy.log(`🔀 Clicando ${vezes}x no toggle Cota Deficiente - Estado: ${deficienteAtivado ? 'Ativado' : 'Desativado'}`)

          for (let i = 0; i < vezes; i++) {
            cy.wrap($toggle).click({ force: true })
          }

          cy.get('input[name="cota_negro"]').then(($toggleNegro) => {
            let vezesNegro = Math.floor(Math.random() * 11)
            if (deficienteAtivado) {
              if (vezesNegro % 2 !== 0) vezesNegro++
            }
            const negroAtivado = vezesNegro % 2 !== 0
            cy.log(`🔀 Clicando ${vezesNegro}x no toggle Cota Negro - Estado: ${negroAtivado ? 'Ativado' : 'Desativado'}`)

            for (let i = 0; i < vezesNegro; i++) {
              cy.wrap($toggleNegro).click({ force: true })
            }

            // Clica em Continue somente após ambos os toggles serem processados
            cy.contains('button', 'Continue', { timeout: 15000 })
              .should('be.visible')
              .then(($el) => $el[0].click())
          })
        })

        // ===== ANEXOS =====
        cy.get('input[type="file"][name="anexo_711"]')
          .selectFile({
            contents: Cypress.Buffer.from(fileContent, 'base64'),
            fileName: 'cpfteste.pdf',
            mimeType: 'application/pdf'
          }, { force: true })

        cy.contains('button', 'Continue', { timeout: 15000 })
          .should('be.visible')
          .then(($el) => $el[0].click())

        // ===== DECLARAÇÃO =====
        cy.wait(1000)

        cy.get('body').then(($body) => {
          if ($body.find('input[name="declaracao_52521"]').length > 0) {
            cy.get('input[name="declaracao_52521"]').check({ force: true })
          }
        })

        cy.get('body').then(($body) => {
          if ($body.find('input[name="declaracao_52522"]').length > 0) {
            cy.get('input[name="declaracao_52522"]').check({ force: true })
          }
        })

        cy.get('input[name="declaracao_52520"]').check({ force: true })

        cy.contains('button', 'Continue', { timeout: 15000 })
          .should('be.visible')
          .click()

        // ===== RESUMO =====
        // Volta duas vezes para garantir registro do anexo
        cy.get('[data-kt-stepper-action="previous"]', { timeout: 15000 })
          .click({ force: true })

        cy.get('[data-kt-stepper-action="previous"]', { timeout: 15000 })
          .click({ force: true })

        // Avança pelo fluxo até o final
        cy.contains('button', 'Continue', { timeout: 15000 })
          .should('be.visible')
          .click()

        cy.contains('button', 'Continue', { timeout: 15000 })
          .should('be.visible')
          .click()

        // Clica em Salvar ou Continue dependendo do que estiver disponível
        cy.get('body').then(($body) => {
          if ($body.find('[data-kt-stepper-action="submit"]').length > 0) {
            cy.get('[data-kt-stepper-action="submit"]', { timeout: 15000 })
              .should('be.visible')
              .then(($el) => $el[0].click())
          } else {
            cy.contains('button', 'Continue', { timeout: 15000 })
              .should('be.visible')
              .then(($el) => $el[0].click())
          }
        })

      })

      // Valida confirmação da inscrição
      cy.contains('Inscrição realizada', { timeout: 15000 })
        .should('be.visible')

    })

  })

})
})