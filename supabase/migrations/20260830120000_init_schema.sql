-- Felipe & Tamires Films — schema inicial
-- Tabelas: clients -> events -> videos
-- Chaves primárias UUID (gen_random_uuid()).
-- RLS habilitado em todas as tabelas, SEM políticas para anon/authenticated:
-- todo acesso acontece no servidor do Next.js via service_role.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------
create table if not exists public.clients (
  id           uuid primary key default gen_random_uuid(),
  display_name text        not null,
  email        text,
  phone        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id              uuid primary key default gen_random_uuid(),
  -- RESTRICT: não deixa apagar um cliente que ainda tem eventos.
  -- A "memória" do cliente nunca some por acidente em cascata.
  client_id       uuid not null references public.clients (id) on delete restrict,
  title           text not null,
  slug            text not null unique,
  event_type      text not null,
  event_date      date,
  location        text,
  description     text,
  cover_image_url text,
  is_public       boolean not null default false,
  -- Apenas o hash. PIN em texto puro nunca é armazenado.
  access_pin_hash text,
  status          text not null default 'published',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint events_event_type_check
    check (event_type in ('wedding', 'debut', 'birthday', 'corporate', 'other')),
  constraint events_status_check
    check (status in ('published', 'draft', 'archived'))
);

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create index if not exists events_client_id_idx  on public.events (client_id);
create index if not exists events_event_date_idx on public.events (event_date);
create index if not exists events_event_type_idx on public.events (event_type);
-- events.slug já tem índice único pela constraint UNIQUE.

-- ---------------------------------------------------------------------------
-- videos
-- ---------------------------------------------------------------------------
create table if not exists public.videos (
  id                uuid primary key default gen_random_uuid(),
  -- CASCADE: apagar um evento remove os vídeos dele (são só metadados).
  event_id          uuid not null references public.events (id) on delete cascade,
  title             text not null,
  description       text,
  category          text not null,
  provider          text not null,
  provider_video_id text,
  embed_url         text,
  download_url      text,
  thumbnail_url     text,
  duration_seconds  integer,
  sort_order        integer not null default 0,
  status            text not null default 'published',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint videos_category_check
    check (category in ('main_film', 'teaser', 'ceremony', 'speeches', 'party', 'making_of', 'other')),
  constraint videos_provider_check
    check (provider in ('youtube', 'bunny', 'cloudflare', 'other')),
  constraint videos_status_check
    check (status in ('published', 'draft', 'archived')),
  constraint videos_duration_seconds_check
    check (duration_seconds is null or duration_seconds >= 0)
);

drop trigger if exists videos_set_updated_at on public.videos;
create trigger videos_set_updated_at
  before update on public.videos
  for each row execute function public.set_updated_at();

-- Consulta real: "vídeos do evento X ordenados por sort_order".
-- Um índice composto cobre o filtro por event_id e a ordenação de uma vez.
create index if not exists videos_event_id_sort_order_idx
  on public.videos (event_id, sort_order);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- RLS ligado e NENHUMA policy: as chaves anon/authenticated não leem nem
-- escrevem nada por aqui. A chave service_role ignora o RLS e é usada só no
-- servidor do Next.js. Assim eventos privados não podem ser enumerados pela
-- API pública do Supabase.
alter table public.clients enable row level security;
alter table public.events  enable row level security;
alter table public.videos  enable row level security;
