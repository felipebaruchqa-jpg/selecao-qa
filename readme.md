# selecao-qa

Projeto de automação de testes do sistema de editais da Universidade do Estado da Bahia (UNEB), desenvolvido como colaborador da NETRA, empresa prestadora de serviços à UNEB.

## 🛠️ Tecnologias

- [Node.js](https://nodejs.org/) v24.10
- [Cypress](https://www.cypress.io/) v15.11

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

- Node.js v24.10 ou superior
- npm (incluído com o Node.js)

## 🚀 Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/felipebaruchqa-jpg/selecao-qa/
cd selecao-qa
npm install
```

## ▶️ Executando os testes

### Abrindo a interface do Cypress (modo interativo)

```bash
npx cypress open
```

### Executando os testes em modo headless (linha de comando)

```bash
npx cypress run
```

### Executando com slowMo para debug

```bash
npx cypress open --config slowMo=500
```

## 📁 Estrutura do projeto

```
selecao-qa/
├── assets/                         # Arquivos usados nos testes (imagens, PDFs)
├── cypress/
│   ├── e2e/
│   │   ├── Admin/                  # Testes da área administrativa
│   │   ├── Auth/                   # Testes de autenticação
│   │   ├── Cadastro/               # Testes de cadastro de usuário
│   │   ├── Home/                   # Testes da página inicial
│   │   └── MinhaConta/             # Testes da área do participante
│   ├── fixtures/                   # Dados estáticos utilizados nos testes
│   └── support/
│       ├── commands/               # Comandos customizados do Cypress
│       └── utils/                  # Funções utilitárias
├── cypress.config.js               # Configuração do Cypress
├── package.json
└── README.md
```

## 🧪 Cobertura de testes

| Módulo | Testes |
|--------|--------|
| Autenticação | Login participante, Login admin, Recuperação de senha |
| Cadastro | Cadastro de usuário, Validações de formulário, Toggles |
| Homepage | Instruções de inscrição, Alteração de cadastro, Fluxo de inscrição |
| Minha Conta | Alteração de senha |
| Admin | Download de gráficos, Gestão de notícias, Criação de editais |

## ⚙️ Configuração

As variáveis de ambiente estão configuradas no arquivo `cypress.config.js`:

```javascript
env: {
  SISTEMA_URL: 'https://editais.teste.uneb.br',
  AUTH_URL:    'https://auth.homologacao.uneb.br:8443',
  GERADOR_URL: 'https://geradornv.com.br/gerador-pessoas/'
}
```

## 📧 Contato

**Felipe Baruch**
felipebaruchqa@gmail.com
