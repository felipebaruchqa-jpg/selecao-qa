const GERADOR = Cypress.env('GERADOR_URL')

// ===========================
// FUNÇÕES AUXILIARES
// ===========================

const aleatorio = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min

const numeroComZeros = (numero, digitos) =>
  String(numero).padStart(digitos, '0')

const dataAleatoria = (anoMin, anoMax) => {
  const ano = aleatorio(anoMin, anoMax)
  const mes = numeroComZeros(aleatorio(1, 12), 2)
  const dia = numeroComZeros(aleatorio(1, 28), 2)
  return `${dia}/${mes}/${ano}`
}

// ===========================
// COMMAND
// ===========================

Cypress.Commands.add('gerarPessoa', () => {

  cy.visit(GERADOR)

  cy.get('#nv-new-generator-people').click()

  return cy.get('#nv-field-name').invoke('text').then((nome) => {
    return cy.get('#nv-field-email').invoke('text').then((email) => {
      return cy.get('#nv-field-cpf').invoke('text').then((cpf) => {
        return cy.get('#nv-field-birthday').invoke('text').then((birthday) => {
          return cy.get('#nv-field-cellphone').invoke('text').then((cellphone) => {
            return cy.get('#nv-field-dad').invoke('text').then((nomePai) => {
              return cy.get('#nv-field-mom').invoke('text').then((nomeMae) => {
                return cy.get('#nv-field-rg').invoke('text').then((rg) => {
                  return cy.get('#nv-field-cep').invoke('text').then((cep) => {
                    return cy.get('#nv-field-occupation').invoke('text').then((profissao) => {
                      return cy.get('#nv-field-voter-registration').invoke('text').then((tituloEleitor) => {
                        return cy.get('#nv-field-pis-pasep').invoke('text').then((pis) => {
                          return cy.get('#nv-field-cnh').invoke('text').then((cnh) => {

                            const dataPis = dataAleatoria(2000, 2009)

                            const dados = {
                              // Dados do gerador
                              nome, email, cpf,
                              cellphone, nomePai, nomeMae,
                              rg, cep, profissao,
                              tituloEleitor, pis, cnh,

                              // Dados gerados programaticamente
                              senha:              'Teste@123',
                              formacao:           profissao,
                              birthday:           dataAleatoria(1990, 1999),

                              // RG
                              dataEmissaoRg:      dataAleatoria(2000, 2009),

                              // Título de eleitor
                              zonaEleitoral:      numeroComZeros(aleatorio(1, 999), 3),
                              secaoEleitoral:     numeroComZeros(aleatorio(1, 9999), 4),
                              dataEmissaoTitulo:  dataAleatoria(2000, 2009),

                              // PIS/PASEP
                              dataPis,

                              // CNH
                              dataEmissaoCnh:     dataAleatoria(2010, 2019),
                              dataValidadeCnh:    dataAleatoria(2020, 2026),

                              // Carteira de trabalho
                              ctps:               pis,
                              serieCTPS:          numeroComZeros(aleatorio(1, 5), 4),
                              dataEmissaoCtps:    dataPis,
                            }

                            cy.log('👤 Pessoa gerada:', JSON.stringify(dados))

                            return cy.wrap(dados)

                          })
                        })
                      })
                    })
                  })
                })
              })
            })
          })
        })
      })
    })
  })

})