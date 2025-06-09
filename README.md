# PurpleLux API

## 📋 Descrição
API RESTful para o sistema PurpleLux, desenvolvida com Node.js e Express.js, fornecendo endpoints para gerenciamento de usuários e eventos.

## 🚀 Tecnologias Utilizadas

- **Node.js**: Runtime JavaScript
- **Express.js**: Framework web para Node.js
- **MongoDB**: Banco de dados NoSQL
- **JWT**: Autenticação via tokens
- **CORS**: Middleware para controle de acesso entre origens
- **dotenv**: Gerenciamento de variáveis de ambiente

## 📁 Estrutura do Projeto

```
src/
├── config/         # Configurações do projeto
├── controllers/    # Controladores da aplicação
├── middleware/     # Middlewares (autenticação, etc)
├── models/         # Modelos do MongoDB
├── routes/         # Rotas da API
├── utils/          # Utilitários
└── server.js       # Arquivo principal
```

## 🔑 Funcionalidades

### Autenticação e Usuários
- Registro de usuários em duas etapas (inicialização e verificação)
- Login com JWT
- Recuperação de senha
- Gerenciamento de usuários (admin)

### Eventos
- CRUD completo de eventos
- Cancelamento de eventos
- Conclusão de eventos
- Listagem de eventos

### Administração
- Gerenciamento de usuários
- Gerenciamento de eventos
- Controle de acesso baseado em roles

## 📡 Rotas da API

### Usuários (`/api/users`)
- `POST /register/init` - Iniciar registro
- `POST /register/verify` - Verificar registro
- `POST /login` - Login
- `POST /password/forgot` - Solicitar reset de senha
- `POST /password/reset` - Resetar senha

### Eventos (`/api/events`)
- `POST /` - Criar evento (admin)
- `GET /` - Listar eventos
- `GET /:id` - Obter evento específico
- `PUT /:id` - Atualizar evento (admin)
- `DELETE /:id` - Deletar evento (admin)
- `PATCH /:id/cancel` - Cancelar evento
- `PATCH /:id/complete` - Concluir evento

### Administração (`/api/admin`)
- `GET /users` - Listar todos os usuários
- `PUT /users/:id` - Atualizar usuário
- `DELETE /users/:id` - Deletar usuário
- `GET /events` - Listar todos os eventos
- `PUT /events/:id` - Atualizar evento
- `DELETE /events/:id` - Deletar evento

## 🔒 Segurança
- Autenticação via JWT
- Middleware de autenticação para rotas protegidas
- Middleware de autorização para rotas administrativas
- CORS configurado para permitir apenas a origem do frontend
- Validação de dados nas requisições

## ⚙️ Configuração

### Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
PORT=5000
MONGODB_URI=sua_uri_mongodb
JWT_SECRET=seu_jwt_secret
```

### Instalação

1. Clone o repositório:

git clone [url-do-repositorio]

2. Instale as dependências:

npm install

3. Configure as variáveis de ambiente no arquivo `.env`

4. Inicie o servidor:

npm start

O servidor estará disponível em `http://localhost:5000` (ou na porta configurada).


<img src="[assets/logo.png](https://icons8.com.br/icon/hsPbhkOH4FMe/node-js)" alt="Logo" width="200"/>
