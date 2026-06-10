# Sistema de Gerenciamento de Ocorrências Escolares

Aplicação web **Next.js 14** (App Router) + **Prisma (PostgreSQL)** + **NextAuth** (JWT + credenciais) com RBAC para **Professor/Agente** e **Gestão**. Pronto para deploy na **Vercel** com `vercel.json` e migrações versionadas.

## Requisitos

- Node.js 20+
- npm

## Configuração (desenvolvimento)

1. Crie um banco **PostgreSQL** (local, [Neon](https://neon.tech) ou [Supabase](https://supabase.com)) e copie a `DATABASE_URL`.
2. Na pasta do projeto:

```bash
cd escola-ocorrencias
cp .env.example .env
# Edite .env: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL=http://localhost:3000
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

**Build local (sem migrar):** `npm run build` — só compila o Next. Em produção na Vercel o comando é `npm run vercel-build` (migra + build), configurado em `vercel.json`.

## GitHub e automação (CI + deploy)

Sim: você coloca o código no **GitHub** e automatiza **verificação** (CI) e **publicação** (deploy).

### 1. Repositório no GitHub

1. Crie um repositório vazio em [https://github.com/new](https://github.com/new).
2. Na pasta do projeto: `git init`, `git remote add origin ...`, commit e `git push -u origin main` (ou `master`).

### 2. Deploy na Vercel (recomendado)

O repositório já inclui **`vercel.json`** com `buildCommand`: `npm run vercel-build` (= `prisma migrate deploy && next build`).

1. Crie um projeto PostgreSQL em [Neon](https://neon.tech) ou [Supabase](https://supabase.com) e copie a **connection string** (`sslmode=require` quando o provedor pedir SSL).
2. Em [vercel.com](https://vercel.com) → **Add New → Project** → importe o repositório do GitHub.
3. Em **Settings → Environment Variables**, adicione para **Production** (e Preview, se quiser):
   - `DATABASE_URL` — URL do Postgres
   - `NEXTAUTH_URL` — URL final do site (`https://wanda-ocorrencias.vercel.app`)
   - `NEXTAUTH_SECRET` — segredo longo (ex.: `openssl rand -base64 32`)
4. Faça o **primeiro deploy**. O build aplica as migrações em `prisma/migrations/`.
5. **Dados iniciais (seed)** não rodam no deploy. No seu PC, com `DATABASE_URL` apontando para o **mesmo** banco de produção (cuidado), rode **uma vez**: `npx prisma db seed` — ou crie usuários pela sua rotina interna. **Não** deixe o seed em pipeline de deploy; troque as senhas padrão em produção.
6. **Anexos:** arquivos em `uploads/` **não persistem** na Vercel. Para produção séria, use storage externo (Supabase Storage, S3, etc.).

### 3. CI no GitHub Actions (já incluído neste projeto)

O arquivo `.github/workflows/ci.yml` sobe um **PostgreSQL 16** de serviço, roda `prisma migrate deploy`, `npm run lint` e `npm run build`.

Recomendação: rode `npm install` localmente e **commite o `package-lock.json`** para builds mais reproduzíveis; depois você pode trocar `npm install` por `npm ci` no workflow.

## Usuários de demonstração (após seed)

| Perfil    | E-mail                 | Senha           |
|-----------|------------------------|-----------------|
| Gestão    | gestao@escola.local    | Gestao123!      |
| Professor | professor@escola.local | Professor123!   |

## Funcionalidades recentes

- **Gestão** também registra ocorrências em `/gestao/ocorrencias/nova`.
- **Relatórios** (`/gestao/relatorios`): filtros por período (data da ocorrência), turma, aluno e tipo; painel com gráficos simples; exportação Excel em modo **total** (uma aba) ou **por aluno** (resumo + abas por aluno, limite de abas).
- **Ficha com assinaturas**: na visualização da ocorrência ou em `/api/occurrences/{id}/ficha` (HTML para imprimir / salvar em PDF), com linhas para gestão, professor/agente e responsável.

## Hospedagem gratuita (recomendações)

O app grava **anexos em pasta no disco** (`uploads/`). Na **Vercel** isso **não é persistente** entre deploys; use **object storage** em produção (Supabase Storage, S3, Cloudinary, etc.).

### Vercel + Postgres (Neon / Supabase)

O projeto já está em **PostgreSQL** com migrações em `prisma/migrations/` e `vercel.json` para build com `prisma migrate deploy`.

### Opção B — Render (Web Service + Postgres grátis)
[https://render.com](https://render.com) oferece instância web e Postgres com **tier gratuito** (com **cold start**: o site “dorme” após inatividade e demora a acordar). Ajustes são os mesmos: Postgres no Prisma, variáveis de ambiente e cuidado com **disco efêmero** para anexos (use storage externo).

### Opção C — Uma VPS com “free tier” (Oracle Cloud, AWS Free Tier, etc.)

Você instala Node, clona o projeto, usa **PostgreSQL** (ou outro banco suportado pelo Prisma) e persiste `uploads/` no disco da máquina. Exige mais administração (SSL, firewall, backups).

### Resumo prático

| Onde | Banco | Anexos em `uploads/` |
|------|--------|----------------------|
| Vercel / Netlify (serverless) | **Postgres** (Neon, Supabase, etc.) | **Não** — use storage na nuvem |
| VPS / VM | Postgres | **Sim** (disco da VM) |
| Render free | Postgres | **Não** confiar no disco — storage externo |

Troque senhas dos usuários seed em produção e não publique `.env` no repositório.

## Produção

- **URL:** [https://wanda-ocorrencias.vercel.app](https://wanda-ocorrencias.vercel.app)
- Troque senhas, use banco PostgreSQL (`DATABASE_URL`), defina `NEXTAUTH_URL` e um `NEXTAUTH_SECRET` forte.
- Armazene anexos em **object storage** (S3, Supabase Storage, Cloudinary, etc.): o modo atual grava em `uploads/` no disco do servidor.
