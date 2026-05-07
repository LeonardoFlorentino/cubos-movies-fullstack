<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">Um framework progressivo de <a href="http://nodejs.org" target="_blank">Node.js</a> para criar aplicacoes de servidor eficientes e escalaveis.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="Versao no NPM" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Licenca do pacote" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="Downloads no NPM" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Apoiadores no Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Patrocinadores no Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Faca uma doacao"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Apoie-nos"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Siga no Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Descricao

Este projeto utiliza [Nest](https://github.com/nestjs/nest) com TypeScript para a API backend da aplicacao.

## Instalacao do projeto

```bash
$ npm install
```

## Compilar e executar o projeto

```bash
# desenvolvimento
$ npm run start

# modo watch
$ npm run start:dev

# modo producao
$ npm run start:prod
```

## Executar testes

```bash
# testes unitarios
$ npm run test

# testes e2e
$ npm run test:e2e

# cobertura de testes
$ npm run test:cov
```

## Configuracao de upload de imagem (S3 ou R2)

Defina as variaveis abaixo em `.env.local` ou `.env`.

### Comum

- `STORAGE_PROVIDER=s3` or `STORAGE_PROVIDER=r2`

### AWS S3

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_S3_BUCKET`
- `AWS_S3_PUBLIC_BASE_URL` (opcional)

Se `AWS_S3_PUBLIC_BASE_URL` nao estiver definida, a API utiliza:
`https://<bucket>.s3.<region>.amazonaws.com/<key>`.

### Cloudflare R2

- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_ACCOUNT_ID` (ou configure `R2_ENDPOINT` diretamente)
- `R2_ENDPOINT` (opcional se `R2_ACCOUNT_ID` estiver definido)
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL` (obrigatorio)

`R2_PUBLIC_BASE_URL` deve ser uma URL publica do seu dominio/CDN,
por exemplo `https://cdn.example.com`.

## Lembrete de estreia e recuperacao de senha

### Lembrete de estreia (mesmo dia)

O backend possui um agendador diario que envia e-mails de lembrete de estreia as 8h.
O lembrete e enviado quando:

- `movie.release_date` e igual ao dia atual
- `movie.release_reminder_sent_at` esta `null`

Apos o envio, `release_reminder_sent_at` e atualizado para evitar lembretes duplicados.
Se a data de estreia do filme for editada, esse campo volta para `null`.

### Fluxo de esqueci minha senha

Endpoints disponiveis:

- `POST /auth/forgot-password`
- `POST /auth/reset-password`

Corpos de requisicao:

```json
{ "email": "user@example.com" }
```

```json
{ "token": "<reset-token>", "password": "new-password" }
```

Observacoes:

- `forgot-password` sempre retorna uma mensagem generica de sucesso para evitar enumeracao de usuarios.
- os tokens de redefinicao sao JWT e expiram conforme configuracao.

### Variaveis de ambiente de autenticacao e e-mail

Defina estas variaveis em `.env.local` ou `.env`:

- `FRONTEND_URL` (usada para montar o link de redefinicao, ex.: `http://localhost:5173`)
- `JWT_RESET_SECRET` (opcional, usa fallback para `JWT_SECRET`)
- `JWT_RESET_EXPIRES_IN` (padrao: `30m`)
- `RESEND_API_KEY`
- `MAIL_FROM` (padrao: `no-reply@cubosmovies.local`)

Se `RESEND_API_KEY` nao estiver configurada, a aplicacao ignora o envio de e-mail e registra um aviso no log.

## Deploy

Quando for publicar sua aplicacao NestJS em producao, siga as boas praticas recomendadas para garantir desempenho e estabilidade. Consulte a [documentacao de deploy](https://docs.nestjs.com/deployment) para mais detalhes.

Se voce quiser uma plataforma em nuvem para deploy de apps NestJS, conheca o [Mau](https://mau.nestjs.com), plataforma oficial para deploy em AWS. O processo e simples e rapido:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

Com o Mau, voce pode fazer deploy em poucos cliques e focar em evoluir funcionalidades.

## Recursos

Alguns recursos uteis para trabalhar com NestJS:

- Visite a [documentacao do NestJS](https://docs.nestjs.com) para aprender mais sobre o framework.
- Para duvidas e suporte, acesse o [canal no Discord](https://discord.gg/G7Qnnhy).
- Para aprofundar na pratica, confira os [cursos oficiais](https://courses.nestjs.com/).
- Faça deploy em AWS com [NestJS Mau](https://mau.nestjs.com) em poucos cliques.
- Visualize o grafo da aplicacao e interaja em tempo real com [NestJS Devtools](https://devtools.nestjs.com).
- Precisa de suporte para seu projeto? Veja o [suporte enterprise](https://enterprise.nestjs.com).
- Para novidades, siga no [X](https://x.com/nestframework) e [LinkedIn](https://linkedin.com/company/nestjs).
- Procura vagas ou quer divulgar uma oportunidade? Veja o [Jobs board](https://jobs.nestjs.com).

## Suporte

Nest e um projeto open source sob licenca MIT. O ecossistema cresce com apoio de patrocinadores e apoiadores. Para contribuir, [saiba mais aqui](https://docs.nestjs.com/support).

## Contato

- Autor - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Site - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## Licenca

Nest utiliza [licenca MIT](https://github.com/nestjs/nest/blob/master/LICENSE).
