function selecionarOpcaoAleatoria(selectorOuElemento, nomeCampo) {
  const tentarSelecionar = (tentativa = 1) => {
    cy.log(`🔎 Tentando abrir o dropdown de "${nomeCampo}" (tentativa ${tentativa})`)

    const getElemento = typeof selectorOuElemento === 'string'
      ? cy.get(selectorOuElemento).should('exist').scrollIntoView()
      : cy.wrap(selectorOuElemento).scrollIntoView()

    if (tentativa === 1) {
      getElemento.click({ force: true })
    } else {
      // Nas tentativas seguintes aguarda um pouco mais antes de tentar
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

module.exports = selecionarOpcaoAleatoria