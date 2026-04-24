const { defineConfig } = require('cypress')
const fs = require('fs')
const path = require('path')

require('dotenv').config()

module.exports = defineConfig({


  e2e: {

    baseUrl: process.env.CYPRESS_BASE_URL,
    chromeWebSecurity: false,
    experimentalOriginDependencies: true,

    env: {
      SISTEMA_URL: process.env.CYPRESS_SISTEMA_URL,
      AUTH_URL: process.env.CYPRESS_AUTH_URL,
      GERADOR_URL: process.env.CYPRESS_GERADOR_URL,
      ADMIN_EMAIL: process.env.CYPRESS_ADMIN_EMAIL,
      ADMIN_SENHA: process.env.CYPRESS_ADMIN_SENHA,
      ADMIN_CPF: process.env.CYPRESS_ADMIN_CPF
    },


    setupNodeEvents(on, config) {

      const downloadsPath = config.downloadsFolder

      on('task', {

        clearDownloads() {
          if (!fs.existsSync(downloadsPath)) return null

          fs.readdirSync(downloadsPath).forEach(file => {
            fs.unlinkSync(path.join(downloadsPath, file))
          })

          return null
        },

        downloadsList() {
          if (!fs.existsSync(downloadsPath)) return []
          return fs.readdirSync(downloadsPath)
        }

      })
    }

  }

})