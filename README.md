# Cubos Movies Fullstack

Aplicação fullstack para autenticação de usuários e gerenciamento de filmes.

## Visão geral

Este repositório está organizado em monorepo com dois apps principais:

- Backend em NestJS + TypeScript + TypeORM
- Frontend em React + TypeScript + Vite

Infra de desenvolvimento local:

- PostgreSQL via Docker Compose

## Tecnologias utilizadas

| Camada            | Tecnologias                                                                         |
| ----------------- | ----------------------------------------------------------------------------------- |
| Backend           | NestJS, TypeScript, TypeORM, class-validator, JWT, Passport, Nodemailer, AWS SDK S3 |
| Frontend          | React 19, TypeScript, Vite 8, Zustand, Zod, React Router, Sonner                    |
| Banco             | PostgreSQL 16                                                                       |
| Infra e qualidade | Docker Compose, ESLint, Jest, Vitest, TypeScript (`tsc --noEmit`)                   |

## Estrutura do projeto

```text
.
|-- backend/
|   |-- src/
|   |   |-- auth/
|   |   |-- movies/
|   |   |-- mail/
|   |   |-- database/
|   |   `-- common/
|   `-- test/
|-- frontend/
|   `-- src/
|       |-- components/
|       |-- lib/
|       |-- pages/
|       |-- store/
|       `-- types/
|-- docker-compose.yml
|-- package.json
`-- README.md
```

## READMEs específicos

- Backend (detalhes técnicos da API): [backend/README.md](backend/README.md)
- Frontend (detalhes técnicos da SPA): [frontend/README.md](frontend/README.md)

## Funcionalidades implementadas

- Registro, login e perfil autenticado com JWT.
- Fluxo completo de recuperação de senha por e-mail.
- CRUD de filmes com upload de imagem.
- Paginação, busca e filtros na listagem.
- Lembrete automático de estreia por e-mail.
- Tema claro/escuro e melhorias de UX em autenticação e listagem.

## Modificações em relação ao escopo base

As alterações abaixo foram implementadas para melhorar usabilidade e robustez sem quebrar os requisitos centrais do desafio.

| Modificação                                       | Justificativa funcional                | Justificativa técnica                                                                                                                                                                          |
| ------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Link “Criar conta” na tela de login               | Reduz fricção para novos usuários      | Evita dead-end de navegação e melhora descoberta da rota de cadastro já suportada pela API                                                                                                     |
| Ícone de olho em campos de senha                  | Melhora conferência de senha digitada  | Reduz erros de digitação e tentativas de login inválidas sem alterar validação de segurança                                                                                                    |
| Tela de “Esqueci minha senha” com envio de e-mail | Permite autoatendimento de recuperação | Fluxo com token JWT de reset, expiração configurável e resposta genérica para evitar enumeração de usuários                                                                                    |
| Ano + duração + gênero no card de filme           | Acelera decisão do usuário na listagem | Reaproveita dados já carregados do modelo (`releaseDate`, `durationMinutes`, `genres`) sem novas requisições                                                                                   |
| Botões com cantos mais arredondados               | Torna a interface mais amigável        | Ajuste de `border-radius` em ações primárias/secundárias para aumentar affordance visual, reduzir percepção de rigidez e manter consistência com um design system de linguagem mais acolhedora |

## Requisitos de ambiente

- Node.js >= 20
- npm >= 10
- Docker e Docker Compose

## Como executar localmente

### 1) Instalar dependências

```bash
npm run install:all
```

### 2) Configurar ambiente do backend

Linux/macOS:

```bash
cp backend/.env.example backend/.env
```

Windows PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
```

### 3) Subir PostgreSQL

```bash
docker compose up -d
```

### 4) Subir aplicações

Em terminais separados:

```bash
# backend
cd backend
npm run start:dev

# frontend
cd frontend
npm run dev
```

URLs padrão:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Scripts úteis

Na raiz:

```bash
npm run install:all
npm run dev:backend
npm run dev:frontend
npm run build
npm run lint
npm run test
```

Validação técnica recomendada antes da entrega:

```bash
cd backend
npm run lint:check
npm run test:ci
npx tsc --noEmit

cd ../frontend
npm run lint
npm run test
npx tsc --noEmit
```

## API (resumo)

Auth:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/me` (Bearer Token)

Movies (rotas autenticadas):

- `POST /movies/upload`
- `POST /movies`
- `GET /movies?page=1&limit=10&search=...&genre=...`
- `GET /movies/:id`
- `PATCH /movies/:id`
- `DELETE /movies/:id`

## Observações de entrega

- O projeto está versionado em repositório Git e contém documentação de execução e validação.
- As modificações funcionais adicionais estão justificadas técnica e funcionalmente neste documento.
