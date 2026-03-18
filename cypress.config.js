const { defineConfig } = require('cypress')
const fs = require('fs')

module.exports = defineConfig({

  e2e: {

    baseUrl: 'https://editais.teste.uneb.br',

    chromeWebSecurity: false,

    experimentalOriginDependencies: true,


    env: {
      SISTEMA_URL:  'https://editais.teste.uneb.br',
      AUTH_URL:     'https://auth.homologacao.uneb.br:8443',
      GERADOR_URL:  'https://geradornv.com.br/gerador-pessoas/',
      ADMIN_EMAIL:  'felipepitanga@uneb.br',
      ADMIN_SENHA:  'Teste@12345',
      ADMIN_CPF:    '06449009543'
    },

    setupNodeEvents(on, config) {
      on('task', {
        downloadsList() {
          return fs.readdirSync('cypress/downloads')
        }
      })
    }

  }

})