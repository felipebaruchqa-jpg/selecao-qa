// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands/cadastro.commands'
import './commands/geradores.commands'
import './commands/auth.commands'

// =========================
// IGNORAR ERROS DO SISTEMA
// =========================

Cypress.on('uncaught:exception', (err) => {

  if (err.message.includes('Internal Server Error')) {
    return false
  }

  if (err.message.includes('Unexpected end of JSON input')) {
    return false
  }

})