# Cubos Movies Fullstack

Monorepo base para o desafio Fullstack da Cubos Tecnologia.

## Objetivo

Construir uma aplicacao de gerenciamento de filmes com:

- Backend em NestJS (TypeScript)
- Frontend em React + Vite (TypeScript)
- Banco de dados PostgreSQL via Docker Compose

## Estrutura do projeto

```text
.
|-- backend/        # API NestJS
|-- frontend/       # App React
|-- .github/
|   `-- workflows/
|       `-- ci.yml  # Pipeline de lint e testes
|-- docker-compose.yml
`-- README.md
```

## Requisitos

- Node.js 20+
- npm 10+
- Docker + Docker Compose

## Primeiros passos

1. Instalar dependencias dos projetos

```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
```

2. Subir o PostgreSQL

```bash
docker compose up -d
```

3. Rodar backend e frontend em terminais separados

```bash
# terminal 1
cd backend
npm run start:dev

# terminal 2
cd frontend
npm run dev
```

## Comandos principais

### Backend

```bash
cd backend
npm run lint:check
npm run test:ci
```

### Frontend

```bash
cd frontend
npm run lint
npm run test
```

## CI (GitHub Actions)

O workflow em `.github/workflows/ci.yml` executa em push e pull request:

- Backend: install, lint e testes
- Frontend: install, lint e testes

## Banco de dados (Docker)

`docker-compose.yml` sobe um PostgreSQL com:

- Host: `localhost`
- Porta: `5432`
- Database: `cubos_movies`
- User: `cubos`
- Password: `cubos`

## Proximas etapas

- Fase 2: Setup completo da camada de persistencia no backend (ORM + models + migrations)
- Fase 3: Design system e fluxo de autenticacao no frontend
