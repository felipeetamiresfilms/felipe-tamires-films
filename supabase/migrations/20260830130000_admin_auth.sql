-- Felipe & Tamires Films — autenticação administrativa (Etapa 3)
--
-- Aplicável ao banco já em produção: NÃO recria nem apaga nada da migration
-- inicial. Só adiciona: tabela admin_users, função is_admin() e policies de
-- LEITURA para administradores em clients / events / videos.
--
-- Modelo de acesso resultante:
--   anon                       -> nenhum acesso (continua sem policy)
--   authenticated + is_admin() -> SELECT em clients/events/videos
--   authenticated sem is_admin -> nenhuma linha (policy não casa)
--   service_role               -> ignora RLS (fluxo público /assistir/[slug])

-- ---------------------------------------------------------------------------
-- admin_users: quem pode administrar o sistema.
-- Senhas NÃO ficam aqui — pertencem exclusivamente ao Supabase Auth.
-- ---------------------------------------------------------------------------
create table if not exists public.admin_users (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text        not null,
  created_at   timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- Um admin enxerga apenas a própria linha (para o painel exibir o nome).
-- INSERT/UPDATE/DELETE só por SQL/service_role — não há policy para isso.
drop policy if exists "admin_users self read" on public.admin_users;
create policy "admin_users self read"
  on public.admin_users
  for select
  to authenticated
  using (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- is_admin(): o usuário atual está em admin_users?
--
-- SECURITY DEFINER para checar admin_users mesmo com o RLS ligado, sem
-- depender de policy e sem risco de recursão quando chamada dentro das
-- policies de outras tabelas.
-- `set search_path = ''` trava a resolução de nomes: tudo é qualificado
-- (public.*, auth.*), então não há como injetar um schema malicioso.
-- A função é somente-leitura (um `select exists`), não recebe parâmetros e
-- não roda SQL dinâmico — não abre caminho para escalação de privilégio.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Policies de LEITURA para administradores.
-- (Escrita — INSERT/UPDATE/DELETE — fica para a etapa de CRUD.)
-- ---------------------------------------------------------------------------
drop policy if exists "clients admin read" on public.clients;
create policy "clients admin read"
  on public.clients for select
  to authenticated
  using (public.is_admin());

drop policy if exists "events admin read" on public.events;
create policy "events admin read"
  on public.events for select
  to authenticated
  using (public.is_admin());

drop policy if exists "videos admin read" on public.videos;
create policy "videos admin read"
  on public.videos for select
  to authenticated
  using (public.is_admin());
