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

1.1 Configurar variaveis de ambiente do backend

```bash
cd backend
cp .env.example .env
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

- Backend: install, lint, type-check e testes
- Frontend: install, lint, type-check e testes

## Troubleshooting do backend

Se o backend encerrar com codigo 1 ao iniciar, valide na ordem abaixo:

1. Banco ativo no Docker (`docker compose up -d`)
2. Variaveis do backend em `backend/.env`
3. Porta da API livre (`3000` por padrao)

Para verificar conflito de porta no Windows:

```powershell
Get-NetTCPConnection -LocalPort 3000
```

Se houver processo ocupando a porta, encerre-o ou inicie o backend com outra porta:

```powershell
$env:PORT=3001
cd backend
npm run start:dev
```

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
