/// <reference types="cypress" />

/** Erros conhecidos da app em homolog que quebram o runner sem refletir falha do teste */
const ignorarExcecaoApp = (err) => {
  if (
    err.message.includes('Internal Server Error') ||
    err.message.includes('ResizeObserver loop completed') ||
    err.message.includes("Cannot read properties of null (reading 'cep')") ||
    err.message.includes('Bad Request')
  ) {
    return false
  }
}

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

  cy.on('uncaught:exception', ignorarExcecaoApp)

  cy.gerarPessoa().then((dados) => {

    cy.visit('/editais')

    cy.login()

    cy.origin(Cypress.env('SISTEMA_URL'), { args: { dados } }, ({ dados }) => {

      cy.on('uncaught:exception', (err) => {
        if (
          err.message.includes('Internal Server Error') ||
          err.message.includes('ResizeObserver loop completed') ||
          err.message.includes("Cannot read properties of null (reading 'cep')") ||
          err.message.includes('Bad Request')
        ) {
          return false
        }
      })

      function garantirSemErroCarregamentoPagina(maxTentativas = 4, tentativa = 0) {
        cy.wait(800)
        cy.get('body').then(($body) => {
          if ($body.text().includes('Erro carregando formulário') && tentativa < maxTentativas) {
            cy.log(`⚠️ Erro carregando página — reload (${tentativa + 1}/${maxTentativas})`)
            cy.reload()
            cy.wait(3500)
            garantirSemErroCarregamentoPagina(maxTentativas, tentativa + 1)
          }
        })
      }

      function aguardarSemOverlayLoading() {
        cy.get('body').then(($b) => {
          if ($b.find('.loading-overlay').length) {
            cy.get('.loading-overlay', { timeout: 20000 }).should('not.exist')
          }
        })
      }

      function selecionarOpcaoAleatoria(selectorOuElemento, nomeCampo) {
        const maxTentativas = 12
        const tentarSelecionar = (tentativa = 1) => {
          cy.log(`🔎 Tentando abrir o dropdown de "${nomeCampo}" (tentativa ${tentativa})`)

          if (typeof selectorOuElemento === 'string') {
            cy.get(selectorOuElemento).should('exist').scrollIntoView()
            if (tentativa % 2 === 1) {
              cy.get(selectorOuElemento).closest('.el-select').find('.el-select__wrapper').first().click({ force: true })
            } else {
              cy.wait(500)
              cy.get(selectorOuElemento).closest('.el-select__wrapper').click({ force: true })
            }
          } else {
            cy.wrap(selectorOuElemento).scrollIntoView()
            cy.wrap(selectorOuElemento).closest('.el-select').find('.el-select__wrapper').first().click({ force: true })
          }

          cy.wait(400)
          cy.get('body').then(($body) => {
            const dropdownVisivel =
              $body.find('.el-select__popper:visible').length > 0 ||
              $body.find('.el-popper.el-select__popper[aria-hidden="false"]').length > 0

            if (!dropdownVisivel) {
              if (tentativa < maxTentativas) {
                cy.log(`⚠️ Dropdown "${nomeCampo}" não apareceu, tentando novamente...`)
                tentarSelecionar(tentativa + 1)
              } else {
                throw new Error(`❌ Falha: dropdown de "${nomeCampo}" não abriu após ${maxTentativas} tentativas`)
              }
            } else {
              cy.get('.el-select__popper:visible, .el-popper.el-select__popper[aria-hidden="false"]', { timeout: 5000 })
                .first()
                .find('.el-select-dropdown__item')
                .then(($options) => {
                  const total = $options.length
                  if (total === 0) {
                    if (tentativa < maxTentativas) {
                      cy.log(`⚠️ Nenhuma opção encontrada no campo "${nomeCampo}"`)
                      cy.wait(800)
                      tentarSelecionar(tentativa + 1)
                    } else {
                      throw new Error(`❌ Falha: dropdown de "${nomeCampo}" sem opções após ${maxTentativas} tentativas`)
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

      cy.contains('div.btn.btn-primary', /faça sua inscrição/i, { timeout: 20000 })
        .should('be.visible')
        .then(($el) => $el[0].click())

      cy.contains('button', 'Desejo alterar meus dados')
        .should('exist')
        .then(($el) => $el[0].click())

      cy.url({ timeout: 20000 }).should('include', 'alterar-cadastro')

      garantirSemErroCarregamentoPagina()
      aguardarSemOverlayLoading()

      // ===== INFORMAÇÕES PESSOAIS =====
      cy.get('input[name="nome"]', { timeout: 20000 })
        .should('be.visible')
        .clear()
        .type(dados.nome)

      cy.get('input[name="nome_mae"]').clear().type(dados.nomeMae)
      cy.get('input[name="nome_pai"]').clear().type(dados.nomePai)

      cy.contains('label', 'Sexo', { timeout: 20000 })
        .closest('div')
        .find('input.el-select__input')
        .then(($input) => {
          selecionarOpcaoAleatoria($input, 'Sexo')
        })

      cy.contains('label', 'Escolaridade')
        .closest('div')
        .find('input.el-select__input')
        .then(($input) => {
          selecionarOpcaoAleatoria($input, 'Escolaridade')
        })

      cy.contains('label', 'Nacionalidade', { timeout: 20000 })
        .closest('div')
        .find('input.el-select__input')
        .then(($input) => {
          selecionarOpcaoAleatoria($input, 'Nacionalidade')
        })

      cy.get('input[name="naturalidade"]').clear().type('Salvador')

      // ===== DOCUMENTOS =====
      cy.get('input[name="rg"]').clear().type(dados.rg)

      cy.get('input[name="data_emissao"]').clear().type(
        dados.dataEmissaoRg.split('/').reverse().join('-')
      )

      cy.contains('label', 'Órgão expedidor', { timeout: 20000 })
        .closest('div')
        .find('input.el-select__input')
        .then(($input) => {
          selecionarOpcaoAleatoria($input, 'Órgão expedidor')
        })

      cy.contains('label', 'UF expedidor', { timeout: 20000 })
        .closest('div')
        .find('input.el-select__input')
        .then(($input) => {
          selecionarOpcaoAleatoria($input, 'UF expedidor')
        })

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

// BUG homolog (reportar ao time de dev, sem alteração de ambiente pelo QA):
// Em editais com passo "Dados Complementares" por formularioId, o nav do stepper lista o passo
// mas o conteúdo Step3 só é montado com formulario_personalizado — índice do stepper não chega
// na última etapa e o botão "Salvar" não aparece (loop em "Continue"). Evidência: screenshots +
// URL permanece em …/inscricao/edital_* .
// Reativar este teste após correção deployada (alinhamento computedSteps x v-if do Step3, ou equivalente).
it('Verificar fluxo de inscrição em processo aberto', () => {

  cy.on('uncaught:exception', ignorarExcecaoApp)

  cy.gerarPessoa().then((dados) => {

    cy.fixture('cpfteste.pdf', 'base64').then((fileContent) => {

      cy.visit('/editais')

      cy.login()

      cy.origin(Cypress.env('SISTEMA_URL'), { args: { dados, fileContent } }, ({ dados, fileContent }) => {

        cy.on('uncaught:exception', (err) => {
          if (
            err.message.includes('Internal Server Error') ||
            err.message.includes('ResizeObserver loop completed') ||
            err.message.includes("Cannot read properties of null (reading 'cep')") ||
            err.message.includes('Bad Request')
          ) {
            return false
          }
        })

        function garantirFormularioInscricaoCarregado(tentativa = 0) {
          const max = 4
          cy.wait(800)
          cy.get('body').then(($body) => {
            const texto = $body.text()
            if (texto.includes('Erro carregando formulário') && tentativa < max) {
              cy.log(`⚠️ Erro carregando formulário — reload (${tentativa + 1}/${max})`)
              cy.reload()
              cy.wait(3500)
              garantirFormularioInscricaoCarregado(tentativa + 1)
            }
          })
        }

        function selecionarOpcaoAleatoria(selectorOuElemento, nomeCampo) {
          const maxTentativas = 12
          const tentarSelecionar = (tentativa = 1) => {
            cy.log(`🔎 Tentando abrir o dropdown de "${nomeCampo}" (tentativa ${tentativa})`)

            if (typeof selectorOuElemento === 'string') {
              cy.get(selectorOuElemento).should('exist').scrollIntoView()
              if (tentativa % 2 === 1) {
                cy.get(selectorOuElemento).closest('.el-select').find('.el-select__wrapper').first().click({ force: true })
              } else {
                cy.wait(500)
                cy.get(selectorOuElemento).closest('.el-select__wrapper').click({ force: true })
              }
            } else {
              cy.wrap(selectorOuElemento).scrollIntoView()
              cy.wrap(selectorOuElemento).closest('.el-select').find('.el-select__wrapper').first().click({ force: true })
            }

            cy.wait(400)
            cy.get('body').then(($body) => {
              const dropdownVisivel =
                $body.find('.el-select__popper:visible').length > 0 ||
                $body.find('.el-popper.el-select__popper[aria-hidden="false"]').length > 0

              if (!dropdownVisivel) {
                if (tentativa < maxTentativas) {
                  cy.log(`⚠️ Dropdown "${nomeCampo}" não apareceu, tentando novamente...`)
                  tentarSelecionar(tentativa + 1)
                } else {
                  throw new Error(`❌ Falha: dropdown de "${nomeCampo}" não abriu após ${maxTentativas} tentativas`)
                }
              } else {
                cy.get('.el-select__popper:visible, .el-popper.el-select__popper[aria-hidden="false"]', { timeout: 5000 })
                  .first()
                  .find('.el-select-dropdown__item')
                  .then(($options) => {
                    const total = $options.length
                    if (total === 0) {
                      if (tentativa < maxTentativas) {
                        cy.log(`⚠️ Nenhuma opção encontrada no campo "${nomeCampo}"`)
                        cy.wait(800)
                        tentarSelecionar(tentativa + 1)
                      } else {
                        throw new Error(`❌ Falha: dropdown de "${nomeCampo}" sem opções após ${maxTentativas} tentativas`)
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

        function selecionarOpcaoSeCampoExistir(seletor, nomeCampo) {
          cy.get('body').then(() => {
            const visivel = Cypress.$(seletor).filter(':visible').length > 0
            if (visivel) {
              selecionarOpcaoAleatoria(seletor, nomeCampo)
            } else {
              cy.log(`⏭️ Campo "${nomeCampo}" ausente ou oculto — ignorando`)
            }
          })
        }

        function preencherCampoSeExistir(seletor, texto) {
          cy.get('body').then(() => {
            if (Cypress.$(seletor).filter(':visible').length > 0) {
              cy.get(seletor).first().clear({ force: true }).type(texto, { force: true })
            }
          })
        }

        /** Clica Continue até o stepper exibir Salvar (última etapa), depois envia. */
        const rodapeStepper = '#kt_create_account_form .d-flex.flex-stack.pt-15'

        function ateSalvar(cliquesRestantes = 24) {
          if (cliquesRestantes <= 0) {
            throw new Error('Salvar não apareceu: fluxo pode estar com validação pendente')
          }
          return cy.get('body').then(($b) => {
            const $salvar = $b.find('#kt_create_account_form [data-kt-stepper-action="submit"]')
            if ($salvar.length > 0) {
              return cy.get('#kt_create_account_form [data-kt-stepper-action="submit"]').first()
                .scrollIntoView()
                .should('not.be.disabled')
                .click({ force: true })
            }
            return cy.get(rodapeStepper, { timeout: 20000 })
              .contains('button', 'Continue')
              .should('be.visible')
              .click({ force: true })
              .wait(400)
              .then(() => ateSalvar(cliquesRestantes - 1))
          })
        }

        cy.contains('a', 'Inscreva-se', { timeout: 15000 })
          .should('exist')
          .then(($el) => $el[0].click())

        cy.contains('div.btn.btn-primary', /faça sua inscrição/i, { timeout: 20000 })
          .should('be.visible')
          .then(($el) => $el[0].click())

        cy.contains('button', 'Não').click()

        garantirFormularioInscricaoCarregado()
        cy.get('body').then(($b) => {
          if ($b.find('.loading-overlay').length) {
            cy.get('.loading-overlay', { timeout: 20000 }).should('not.exist')
          }
        })

        cy.get('body', { timeout: 5000 }).should('not.contain', 'Erro carregando formulário')

        // Schemas/async do stepper (complementares, declarações) — reduz corrida com getMeusDados
        cy.wait(2500)

        // ===== INFORMAÇÕES PESSOAIS =====
        cy.get('input[name="nascimento"]', { timeout: 15000 }).then(($n) => {
          if ($n.length && (!$n.val() || String($n.val()).trim() === '')) {
            const iso = dados.birthday.split('/').reverse().join('-')
            return cy.wrap($n).clear({ force: true }).type(iso, { force: true })
          }
        })

        cy.get('input[name="nome"]', { timeout: 20000 })
          .scrollIntoView()
          .should('be.visible')
          .clear({ force: true })
          .type(dados.nome, { force: true })

        cy.get('input[name="nome_mae"]').clear({ force: true }).type(dados.nomeMae, { force: true })
        cy.get('input[name="nome_pai"]').clear({ force: true }).type(dados.nomePai, { force: true })

        selecionarOpcaoAleatoria('input[name="sexo"]', 'Sexo')
        selecionarOpcaoAleatoria('input[name="escolaridade"]', 'Escolaridade')
        selecionarOpcaoAleatoria('input[name="nacionalidade"]', 'Nacionalidade')
        selecionarOpcaoSeCampoExistir('input[name="cor"]', 'Cor')
        selecionarOpcaoSeCampoExistir('input[name="estadoCivilId"]', 'Estado Civil')
        selecionarOpcaoSeCampoExistir('input[name="estadoNascimentoId"]', 'Estado Nascimento')

        cy.get('input[name="naturalidade"]').clear().type('Salvador')

        // ===== DADOS PROFISSIONAIS (opcionais conforme edital) =====
        preencherCampoSeExistir('input[name="profissao"]', dados.profissao)
        preencherCampoSeExistir('input[name="formacao"]', dados.formacao)

        // ===== DOCUMENTOS =====
        cy.get('input[name="rg"]').clear().type(dados.rg)
        cy.get('input[name="data_emissao"]').clear().type(
          dados.dataEmissaoRg.split('/').reverse().join('-')
        )

        selecionarOpcaoAleatoria('input[name="orgao_expedidor"]', 'Orgão Expedidor')
        selecionarOpcaoAleatoria('input[name="uf_expedidor"]', 'UF Expedidor')

        // ===== TÍTULO DE ELEITOR (opcional) =====
        preencherCampoSeExistir('input[name="titulo_eleitor"]', dados.tituloEleitor)
        preencherCampoSeExistir('input[name="zona"]', dados.zonaEleitoral)
        preencherCampoSeExistir('input[name="secao"]', dados.secaoEleitoral)
        preencherCampoSeExistir('input[name="emissao_titulo"]', dados.dataEmissaoTitulo)
        selecionarOpcaoSeCampoExistir('input[name="uf_titulo"]', 'UF do Título')

        // ===== PIS/PASEP (opcional) =====
        preencherCampoSeExistir('input[name="numero_pis_pasep"]', dados.pis)
        preencherCampoSeExistir('input[name="registro_pis_pasep"]', dados.dataPis)

        // ===== CNH (opcional) =====
        preencherCampoSeExistir('input[name="cnh"]', dados.cnh)
        preencherCampoSeExistir('input[name="emissao_cnh"]', dados.dataEmissaoCnh)
        preencherCampoSeExistir('input[name="validade_cnh"]', dados.dataValidadeCnh)
        selecionarOpcaoSeCampoExistir('input[name="categoria_cnh"]', 'Categoria CNH')

        // ===== CARTEIRA DE TRABALHO (opcional) =====
        preencherCampoSeExistir('input[name="numero_ctps"]', dados.ctps)
        preencherCampoSeExistir('input[name="numero_serie_ctps"]', dados.serieCTPS)

        cy.get('body').then(($body) => {
          if ($body.find('input[name="emissao_ctps"]').length > 0) {
            cy.get('input[name="emissao_ctps"]')
              .should('be.visible')
              .clear({ force: true })
              .type(dados.dataEmissaoCtps, { force: true })
            cy.get('input[name="numero_serie_ctps"]').click({ force: true })
          }
        })

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
        preencherCampoSeExistir('input[name="complemento"]', '—')

        // Força o Vue a registrar o valor do último campo
        cy.get('input[name="cep"]').click()

        cy.get(rodapeStepper, { timeout: 15000 })
          .contains('button', 'Continue')
          .should('be.visible')
          .then(($el) => $el[0].click())

        // Próxima etapa varia por edital (dados específicos, anexos ou declarações)
        cy.get('body', { timeout: 30000 }).should(($b) => {
          const $ = Cypress.$
          const texto = $b.text()
          const tem =
            $('input[name="funcao"]:visible').length ||
            $('input[name="necessidade_especial"]:visible').length ||
            $('input[name="cota_deficiente"]:visible').length ||
            $('input[type="file"][name^="anexo_"]').length ||
            $('input[name^="declaracao_"]:visible').length ||
            /Dados específicos/i.test(texto) ||
            /Declara(ç|c)ões/i.test(texto) ||
            /Anexo/i.test(texto)
          expect(tem).to.be.true
        })

        // ===== DADOS ESPECÍFICOS (campos variam por edital) =====
        selecionarOpcaoSeCampoExistir('input[name="funcao"]', 'Teste')
        cy.wait(1000)
        selecionarOpcaoSeCampoExistir('input[name="necessidade_especial"]', 'Necessidade Especial')
        cy.wait(1000)
        selecionarOpcaoSeCampoExistir('input.el-select__input[name="funcao"]', 'Função')

        // Se uma necessidade especial foi selecionada, preenche a descrição
        cy.get('body').then(($body) => {
          if ($body.find('input[name="descricao_necessidade_especial"]').length > 0) {
            return cy.get('input[name="descricao_necessidade_especial"]')
              .type('Deficiencia Teste', { force: true })
          }
        })

        cy.get('body').then(() => {
          if (Cypress.$('input[name="cota_deficiente"]:visible').length === 0) {
            cy.log('⏭️ Cotas não exibidas neste edital — avançando')
            return cy.get(rodapeStepper, { timeout: 15000 })
              .contains('button', 'Continue')
              .should('be.visible')
              .then(($el) => $el[0].click())
          }

          // Regra da app: no máximo uma entre cota negro / deficiente / sobrevaga — toggles aleatórios travavam o stepper
          cy.log('⏭️ Cotas exibidas — mantendo estado padrão do edital')
          return cy.get(rodapeStepper, { timeout: 15000 })
            .contains('button', 'Continue')
            .should('be.visible')
            .then(($el) => $el[0].click())
        })

        // ===== ANEXOS (id do campo varia por edital) =====
        cy.get('body').then(() => {
          const fileInputs = Cypress.$('input[type="file"][name^="anexo_"]')
          if (fileInputs.length === 0) {
            cy.log('⏭️ Nenhum anexo no DOM — seguindo')
            return undefined
          }
          const nameAttr = fileInputs.first().attr('name')
          return cy.get(`input[type="file"][name="${nameAttr}"]`).selectFile({
            contents: Cypress.Buffer.from(fileContent, 'base64'),
            fileName: 'cpfteste.pdf',
            mimeType: 'application/pdf'
          }, { force: true })
        })

        cy.get(rodapeStepper, { timeout: 15000 })
          .contains('button', 'Continue')
          .should('be.visible')
          .then(($el) => $el[0].click())

        // ===== DECLARAÇÃO =====
        cy.wait(1000)

        cy.get('body', { timeout: 15000 }).then(($body) => {
          const $inputs = $body.find('#kt_create_account_form input[name^="declaracao_"][type="checkbox"]')
          if ($inputs.length === 0) {
            cy.log('⚠️ Nenhuma declaração (checkbox) no DOM')
            return undefined
          }
          cy.log(`✅ Marcando ${$inputs.length} declaração(ões)`)
          let c = cy.wrap(null)
          for (let i = 0; i < $inputs.length; i++) {
            const el = $inputs[i]
            c = c.then(() => cy.wrap(el).check({ force: true }))
          }
          return c
        })

        // Campos de texto em Declarações: nunca usar seletor global (preenche complemento/contato vazio)
        const campoDeclaracaoVazio = (el) => {
          const $e = Cypress.$(el)
          const val = $e.is('[contenteditable="true"]') ? $e.text() : $e.val()
          return !val || String(val).trim() === ''
        }

        const nomeCampoObrigatorioOutraEtapa = (el) => {
          const nome = (Cypress.$(el).attr('name') || '').toLowerCase()
          if (!nome) return false
          const bloqueados = new Set([
            'complemento', 'email', 'celular', 'telefone', 'cep', 'rua', 'numero_endereco', 'bairro',
            'cidade', 'estado', 'nome', 'nome_mae', 'nome_pai', 'naturalidade', 'rg', 'data_emissao',
            'profissao', 'formacao', 'titulo_eleitor', 'zona', 'secao', 'numero_pis_pasep', 'cnh',
            'numero_ctps', 'descricao_necessidade_especial', 'funcao', 'necessidade_especial',
            'emissao_cnh', 'validade_cnh', 'registro_pis_pasep', 'emissao_titulo', 'emissao_ctps',
            'numero_serie_ctps', 'data_nascimento'
          ])
          if (bloqueados.has(nome)) return true
          if (/^anexo_/.test(nome)) return true
          return /^orgao_expedidor|^uf_|^sexo|^escolaridade|^nacionalidade|^cor|^estado/i.test(nome)
        }

        cy.then(() => {
          const $primeiro = Cypress.$('#kt_create_account_form input[name^="declaracao_"][type="checkbox"]').first()
          if (!$primeiro.length) return

          const candidatos = []
          const marcarSeServe = (el) => {
            const $e = Cypress.$(el)
            const t = $e.attr('type')
            if (t === 'checkbox' || t === 'file' || t === 'radio' || t === 'hidden') return
            if (!campoDeclaracaoVazio(el)) return
            if (nomeCampoObrigatorioOutraEtapa(el)) return
            if (!candidatos.includes(el)) candidatos.push(el)
          }

          Cypress.$('#kt_create_account_form input[name^="declaracao_"][type="checkbox"]').each((_, chk) => {
            let $item = Cypress.$(chk).closest('.el-form-item')
            for (let s = 0; s < 6 && $item.length; s++) {
              $item.find('.el-textarea__inner:visible, textarea:visible, input.el-input__inner:visible, [contenteditable="true"]:visible').each((__, el) => marcarSeServe(el))
              $item = $item.next('.el-form-item')
            }
          })

          let chain = cy.wrap(null)
          candidatos.forEach((el) => {
            const $e = Cypress.$(el)
            if ($e.is('[contenteditable="true"]')) {
              chain = chain
                .then(() => cy.wrap(el).click({ force: true }))
                .then(() => cy.wrap(el).type('Preenchimento E2E — declaração.', { force: true }))
            } else {
              chain = chain.then(() => cy.wrap(el).clear({ force: true }).type('Preenchimento E2E — declaração.', { force: true }))
            }
          })
          return chain
        })

        ateSalvar()

        // Navegação pós-sucesso (formulariosSteps.vue: toast 1s + router.push comprovante)
        cy.url({ timeout: 120000 }).should('include', 'visualizacao-inscricao')
        cy.get('h1.titulo', { timeout: 60000 })
          .should('be.visible')
          .and('contain', 'Comprovante de Inscrição')

      })

      cy.url({ timeout: 10000 }).should('include', 'visualizacao-inscricao')

    })

  })

})
})