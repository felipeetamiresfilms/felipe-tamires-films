# Supabase — configuração, migrations e seed

Guia curto para ligar o projeto ao banco. A ordem é: criar projeto →
`.env.local` → aplicar o schema → rodar o seed → `npm run dev`.

## 1. Criar o projeto no Supabase

1. Acesse <https://supabase.com/dashboard> e crie um projeto (região mais
   próxima; guarde a senha do banco).
2. Aguarde o provisionamento (~2 min).

## 2. Preencher `.env.local`

No painel: **Project Settings → API**. Copie:

| Campo no painel | Variável em `.env.local` |
| --- | --- |
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| Project API keys → `anon` `public` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Project API keys → `service_role` | `SUPABASE_SERVICE_ROLE_KEY` |

```bash
cp .env.local.example .env.local
# edite .env.local e cole os três valores
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` é segredo. Ela ignora o RLS. Nunca a
> commite, nunca a use com prefixo `NEXT_PUBLIC_`, nunca a logue.
> `.env.local` já está no `.gitignore`.

## 3. Aplicar o schema (migrations)

O SQL vive em [`supabase/migrations/`](../supabase/migrations). Duas formas:

### Opção A — SQL Editor do painel (sem instalar nada)

1. Painel → **SQL Editor → New query**.
2. Cole todo o conteúdo de
   `supabase/migrations/20260830120000_init_schema.sql` e clique **Run**.

### Opção B — Supabase CLI

Instale a CLI (uma vez):

```bash
# macOS
brew install supabase/tap/supabase
# ou veja https://supabase.com/docs/guides/cli
```

Ligue o projeto local ao remoto e faça o push das migrations:

```bash
supabase login
supabase link --project-ref <ref-do-projeto>   # o ref está na URL do painel
supabase db push                                # aplica supabase/migrations/*
# atalho: npm run db:push
```

## 4. Rodar o seed (evento "Ana & Marcos")

O seed é [`supabase/seed.sql`](../supabase/seed.sql). É reproduzível: usa IDs
fixos e faz upsert, então pode rodar várias vezes sem duplicar.

### Opção A — SQL Editor do painel

Painel → **SQL Editor → New query** → cole `supabase/seed.sql` → **Run**.

### Opção B — Supabase CLI

```bash
# Precisa da connection string do banco:
# Painel → Project Settings → Database → Connection string → "URI"
psql "postgresql://postgres:<senha>@<host>:5432/postgres" -f supabase/seed.sql
```

> A CLI também roda `supabase/seed.sql` automaticamente num banco **local**
> (`supabase start` + `supabase db reset`). Não use `supabase db reset` num
> projeto remoto: ele apaga e recria o banco.

## 5. Rodar o projeto

```bash
npm run dev
```

- <http://localhost:3000/> — home
- <http://localhost:3000/backstage-ft> — painel (exige login — ver
  [`backstage-auth.md`](backstage-auth.md))
- <http://localhost:3000/assistir/ana-e-marcos-k7f3x9> — evento vindo do banco

Slug inexistente (ex.: `/assistir/qualquer-coisa`) deve responder **404**.

> A partir da Etapa 3 há uma segunda migration (`..._admin_auth.sql`). Aplique
> **todas** as migrations em ordem. O painel administrativo tem seu próprio
> guia: [`backstage-auth.md`](backstage-auth.md).

## Como o acesso privado fica protegido

- **RLS ligado** em `clients`, `events`, `videos`. Para `anon`, **nenhuma
  policy** — a API pública do Supabase não lê nem lista nada. Para
  `authenticated`, só quem está em `admin_users` lê (Etapa 3).
  Eventos privados não são enumeráveis por `anon`.
- A leitura acontece **só no servidor** do Next.js, em
  `src/lib/supabase/server.ts` (`import "server-only"`), com a chave
  `service_role`. Se esse módulo for importado num Client Component, o build
  falha.
- `/assistir/[slug]` acha o evento pelo **slug de alta entropia**
  (`ana-e-marcos-k7f3x9`), que funciona como segredo do link. `is_public`
  continua `false`.
