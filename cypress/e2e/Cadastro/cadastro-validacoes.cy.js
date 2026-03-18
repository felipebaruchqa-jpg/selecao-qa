describe('Cadastro - Validações de campos', () => {

  it('Verificar se os campos obrigatórios estão devidamente bloqueando o cadastro', () => {

    cy.abrirCadastro()

    cy.authOriginValidacoes()

  })

})