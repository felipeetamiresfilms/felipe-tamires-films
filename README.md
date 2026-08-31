# Felipe & Tamires Films — Portal de Filmes

Portal privado para entrega de filmes de casamentos, festas de 15 anos e eventos
sociais, substituindo a entrega via Google Drive por uma experiência própria,
inspirada em plataformas de streaming.

O cliente recebe um link privado (`/assistir/[slug]`) e assiste aos vídeos do seu
evento pelo navegador. Os vídeos **não** são hospedados nesta aplicação — ela
guarda apenas os dados do evento e as referências aos vídeos em provedores
externos (YouTube não listado agora; Bunny Stream / Cloudflare Stream no futuro).

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19
- TypeScript
- Tailwind CSS v4
- ESLint 9 (flat config)
- Supabase (Postgres + Auth) — leitura server-side, sem ORM
- Futuro: Supabase Storage (capas), deploy no Netlify

## Rodando localmente

1. Configure o banco seguindo [`docs/supabase.md`](docs/supabase.md)
   (criar projeto, `.env.local`, aplicar migrations, rodar seed).
2. Para acessar o painel, crie o primeiro administrador seguindo
   [`docs/backstage-auth.md`](docs/backstage-auth.md).
3. Suba o dev server:

```bash
npm run dev
```

Rotas:

| Rota                            | Descrição                                          |
| ------------------------------- | ------------------------------------------------- |
| `/`                             | Home institucional provisória                      |
| `/backstage-ft/login`           | Login do painel (Supabase Auth)                    |
| `/backstage-ft`                 | Painel — dashboard + lista de eventos (protegido)  |
| `/assistir/ana-e-marcos-k7f3x9` | Entrega do evento (dados vindos do Supabase)       |

## Scripts

```bash
npm run dev      # ambiente de desenvolvimento
npm run build    # build de produção
npm run start    # sobe o build
npm run lint     # ESLint
npm run db:push  # aplica supabase/migrations/* (requer Supabase CLI)
```

## Estrutura

```text
src/
  proxy.ts                   # renova a sessão do Supabase em /backstage-ft/*
  app/
    layout.tsx               # layout raiz (fontes, header/footer, metadata)
    page.tsx                 # Home
    not-found.tsx            # 404
    icon.svg                # favicon da marca
    assistir/[slug]/page.tsx # entrega do evento (público, por slug)
    backstage-ft/
      login/                 # /backstage-ft/login (form + Client Component)
      (protected)/           # rotas protegidas: layout faz o gate + dashboard
  components/
    layout/                  # SiteHeader, SiteFooter
    ui/                      # Wordmark, Badge, VideoCard
  lib/
    events.ts                # repository público: getEventBySlug -> service_role
    format.ts                # formatação pt-BR (datas, duração)
    labels.ts                # rótulos dos enums de domínio
    admin/
      auth.ts                # loadBackstageAccess() — anon / forbidden / ok
      queries.ts             # getAdminStats(), getAdminEvents() (sessão + RLS)
    supabase/
      server.ts              # createServerAuthClient() (sessão) + createAdminClient() (service_role)
      browser.ts             # createBrowserSupabaseClient() (anon, Client Components)
  types/
    index.ts                # Client, Event, Video + enums (tipos de domínio)
supabase/
  migrations/                # schema SQL versionado (não editar os antigos)
  seed.sql                   # evento de teste "Ana & Marcos"
docs/
  supabase.md                # configurar banco, migrations e seed
  backstage-auth.md          # criar o primeiro admin, RLS, sessão
```

## Estado atual

- **Etapa 1:** base do projeto, identidade visual, três rotas.
- **Etapa 2:** banco no Supabase (clients / events / videos), RLS fechado,
  `/assistir/[slug]` lendo do banco via camada server-side (service_role).
- **Etapa 3:** Supabase Auth. `/backstage-ft` protegido por sessão + `admin_users`;
  dashboard e lista de eventos reais via sessão autenticada + RLS.

Ainda **não** implementado: CRUD, upload/Storage, player real, integrações com
provedores de vídeo, PIN, e-mails.
# felipe-tamires-films
# felipe-tamires-films
