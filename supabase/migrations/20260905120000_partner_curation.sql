-- Felipe & Tamires Films — Nossa Curadoria / Recomendamos (Etapa 11)
--
-- Aditiva. NÃO altera, recria nem apaga nada das migrations anteriores.
-- Cria a curadoria pública de profissionais e lugares recomendados pela
-- Felipe & Tamires Films: categorias, parceiros e galeria de fotos.
--
-- NÃO é marketplace/publicidade paga: sem comissão, ranking, avaliação,
-- login de parceiro ou relação parceiro <-> evento nesta etapa.
--
-- Modelo de acesso resultante (mesma estratégia de events/videos):
--   anon                        -> nenhum acesso direto às tabelas.
--                                   Leitura pública é server-side, via
--                                   service_role (ver src/lib/curadoria.ts),
--                                   igual ao portfólio público (Etapa 6).
--   authenticated + is_admin()  -> SELECT + INSERT + UPDATE em todas as
--                                   tabelas da curadoria, e também DELETE em
--                                   `partner_media` (só fotos da galeria).
--   authenticated sem is_admin  -> nenhuma linha (policy não casa).
--   service_role                -> ignora RLS (leitura pública por slug).
--
-- Sem DELETE em `partners`/`partner_categories` nesta primeira versão:
-- retirada de um parceiro é feita com status = 'archived' (mesma lógica de
-- arquivamento já usada em `events`). Uma FOTO isolada da galeria
-- (`partner_media`) pode ser excluída de verdade — é o próprio recurso de
-- "remover fotos da galeria" pedido na edição, e a linha não representa uma
-- entrada curada por si só.

-- --- Categorias ---------------------------------------------------------

create table if not exists public.partner_categories (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  description  text,
  sort_order   integer not null default 0,
  status       text not null default 'active',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint partner_categories_status_check
    check (status in ('active', 'inactive'))
);

drop trigger if exists partner_categories_set_updated_at on public.partner_categories;
create trigger partner_categories_set_updated_at
  before update on public.partner_categories
  for each row execute function public.set_updated_at();

-- Categorias iniciais (seção 4 do briefing). Novas categorias entram por
-- INSERT via backstage — sem enum rígido no código, sem migration futura.
insert into public.partner_categories (name, slug, sort_order, status) values
  ('Espaços para eventos', 'espacos-para-eventos', 1, 'active'),
  ('Fotografia', 'fotografia', 2, 'active'),
  ('Cerimonial & Assessoria', 'cerimonial-assessoria', 3, 'active'),
  ('Beleza', 'beleza', 4, 'active')
on conflict (slug) do nothing;

-- --- Parceiros ------------------------------------------------------

create table if not exists public.partners (
  id                   uuid primary key default gen_random_uuid(),
  category_id          uuid not null references public.partner_categories (id) on delete restrict,
  name                 text not null,
  slug                 text not null unique,

  short_description    text,
  description          text,
  recommendation_text  text,

  location             text,

  whatsapp_number      text,
  instagram_url        text,
  website_url          text,

  cover_image_path     text,

  video_provider       text,
  video_provider_id    text,
  video_embed_url      text,

  featured             boolean not null default false,
  sort_order           integer not null default 0,

  status               text not null default 'draft',

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint partners_status_check
    check (status in ('draft', 'published', 'archived')),
  constraint partners_video_provider_check
    check (video_provider is null or video_provider in ('youtube'))
);

drop trigger if exists partners_set_updated_at on public.partners;
create trigger partners_set_updated_at
  before update on public.partners
  for each row execute function public.set_updated_at();

create index if not exists partners_category_id_idx on public.partners (category_id);
create index if not exists partners_status_idx on public.partners (status);
create index if not exists partners_featured_idx on public.partners (featured) where featured;

-- --- Galeria de fotos ------------------------------------------------

create table if not exists public.partner_media (
  id            uuid primary key default gen_random_uuid(),
  partner_id    uuid not null references public.partners (id) on delete cascade,
  storage_path  text not null,
  alt_text      text,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists partner_media_partner_id_idx on public.partner_media (partner_id);

-- --- RLS ---------------------------------------------------------------

alter table public.partner_categories enable row level security;
alter table public.partners           enable row level security;
alter table public.partner_media      enable row level security;

drop policy if exists "partner_categories admin select" on public.partner_categories;
create policy "partner_categories admin select"
  on public.partner_categories for select
  to authenticated
  using (public.is_admin());

drop policy if exists "partner_categories admin insert" on public.partner_categories;
create policy "partner_categories admin insert"
  on public.partner_categories for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "partner_categories admin update" on public.partner_categories;
create policy "partner_categories admin update"
  on public.partner_categories for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "partners admin select" on public.partners;
create policy "partners admin select"
  on public.partners for select
  to authenticated
  using (public.is_admin());

drop policy if exists "partners admin insert" on public.partners;
create policy "partners admin insert"
  on public.partners for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "partners admin update" on public.partners;
create policy "partners admin update"
  on public.partners for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "partner_media admin select" on public.partner_media;
create policy "partner_media admin select"
  on public.partner_media for select
  to authenticated
  using (public.is_admin());

drop policy if exists "partner_media admin insert" on public.partner_media;
create policy "partner_media admin insert"
  on public.partner_media for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "partner_media admin update" on public.partner_media;
create policy "partner_media admin update"
  on public.partner_media for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "partner_media admin delete" on public.partner_media;
create policy "partner_media admin delete"
  on public.partner_media for delete
  to authenticated
  using (public.is_admin());

-- --- Storage: bucket público `partner-media` ---------------------------
--
-- Diferente de `event-media` (privado, capas de clientes): este conteúdo é
-- feito para aparecer publicamente em /recomendamos. Bucket PÚBLICO (leitura
-- direta por URL, sem signed URL), mas upload/alteração/exclusão exclusivos
-- de administrador — mesma estratégia de policy de `event-media`.
--
-- Observação de deploy: `create policy ... on storage.objects` pode exigir
-- rodar pelo SQL Editor do painel Supabase se `supabase db push` reclamar de
-- owner (mesma observação da migration 20260831140000).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'partner-media',
  'partner-media',
  true,
  10485760, -- 10 MiB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "partner-media public select" on storage.objects;
create policy "partner-media public select"
  on storage.objects for select
  to public
  using (bucket_id = 'partner-media');

drop policy if exists "partner-media admin insert" on storage.objects;
create policy "partner-media admin insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'partner-media' and public.is_admin());

drop policy if exists "partner-media admin update" on storage.objects;
create policy "partner-media admin update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'partner-media' and public.is_admin())
  with check (bucket_id = 'partner-media' and public.is_admin());

drop policy if exists "partner-media admin delete" on storage.objects;
create policy "partner-media admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'partner-media' and public.is_admin());
