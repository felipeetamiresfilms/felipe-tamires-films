# Painel administrativo — autenticação

O painel fica em **`/backstage-ft`** e exige:

1. usuário autenticado no **Supabase Auth** (e-mail + senha);
2. esse usuário presente na tabela **`public.admin_users`**.

Não existe cadastro público. Administradores são criados manualmente.

---

## 1. Aplicar a migration da Etapa 3

Se ainda não aplicou, rode `supabase/migrations/20260830130000_admin_auth.sql`
(SQL Editor do painel Supabase, ou `npm run db:push`). Ela cria `admin_users`,
a função `is_admin()` e as policies de leitura para administradores. **Não**
altera nem apaga nada da migration inicial.

## 2. Criar o usuário no Supabase Authentication

1. Painel do Supabase → **Authentication → Users → Add user → Create new user**.
2. Preencha **e-mail** e **senha**.
3. Marque **Auto Confirm User** (assim não é preciso confirmar por e-mail).
4. **Create user**.

> A senha vive **só** no Supabase Auth. Nunca vai para `admin_users`, log,
> analytics ou qualquer tabela nossa.

## 3. Promover o usuário a administrador

Painel → **SQL Editor → New query**. Use **uma** das opções.

### Opção A — pelo e-mail (recomendada)

Sem copiar UUID. Troque o e-mail e o nome:

```sql
insert into public.admin_users (id, display_name)
select u.id, 'Felipe'
from auth.users u
where u.email = 'voce@seudominio.com'
on conflict (id) do nothing;
```

### Opção B — pelo UUID

Copie o **User UID** em Authentication → Users e cole no lugar do placeholder:

```sql
insert into public.admin_users (id, display_name)
values ('COLE_AQUI_O_UUID_DO_USUARIO', 'Felipe')
on conflict (id) do nothing;
```

Repita para cada membro da equipe (Felipe, Tamires, etc.).

### Conferir

```sql
select au.display_name, u.email, au.created_at
from public.admin_users au
join auth.users u on u.id = au.id;
```

## 4. Entrar

`npm run dev` → <http://localhost:3000/backstage-ft/login> → e-mail + senha →
**Entrar**. Deve cair em `/backstage-ft` com o dashboard e a lista de eventos.

## 5. Remover um acesso

```sql
delete from public.admin_users
where id = (select id from auth.users where email = 'voce@seudominio.com');
```

Isso tira o acesso ao painel. Para apagar a conta de vez, remova também o
usuário em Authentication → Users.

---

## Como funciona (resumo técnico)

- **Sessão:** `@supabase/ssr`. O login (Client Component) chama
  `signInWithPassword`; a sessão fica em cookies. Nos Server Components a
  sessão é lida por `createServerAuthClient()` (`src/lib/supabase/server.ts`).
  `src/proxy.ts` renova os cookies a cada request em `/backstage-ft/*`.
- **Verificação:** sempre com `supabase.auth.getUser()` (revalida o JWT no
  servidor do Supabase) — nunca só o cookie.
- **Gate:** `src/app/backstage-ft/(protected)/layout.tsx` chama
  `loadBackstageAccess()`:
  - sem sessão → redirect para `/backstage-ft/login`;
  - autenticado fora de `admin_users` → tela "Acesso negado" + botão Sair;
  - admin → painel.
- **RLS:** `clients` / `events` / `videos` liberam `SELECT` para
  `authenticated` só quando `public.is_admin()` é verdadeiro. `anon` continua
  sem nenhuma policy. O painel **não** usa `service_role` — só a sessão + RLS.
- **`/assistir/[slug]` não muda:** continua público, via `service_role`
  server-side, sem exigir login. O cliente final não é usuário do Supabase.
