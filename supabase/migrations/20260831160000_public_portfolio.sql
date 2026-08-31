-- Felipe & Tamires Films — Portfólio público (Etapa 6)
--
-- Aditivo. NÃO altera migrations anteriores, NÃO reseta, NÃO apaga nem muda
-- dados existentes. Em especial: NÃO mexe em `events.is_public` de nenhum
-- evento — Ana & Marcos continua privado até ser ativado manualmente.
--
-- Não abre NENHUMA policy para `anon`: as tabelas clients/events/videos seguem
-- sem acesso público direto. As páginas públicas leem pelo servidor do Next
-- (service_role, server-only) e devolvem só DTOs seguros.
--
-- Significado dos campos:
--   events.is_public          -> true = evento ativado para o portfólio público
--                                (o campo já existia; a partir de agora é usado)
--   events.public_slug        -> identificador PÚBLICO, legível, estável,
--                                totalmente separado do `slug` privado de /assistir
--   events.portfolio_featured -> evento em destaque na home (pode haver vários)
--   videos.showcase_enabled   -> vídeo pode aparecer publicamente
--   videos.showcase_order     -> ordem do vídeo dentro do portfólio do evento

alter table public.events
  add column if not exists public_slug        text,
  add column if not exists portfolio_featured boolean not null default false;

-- Unicidade do public_slug só quando preenchido (vários NULL são permitidos).
create unique index if not exists events_public_slug_key
  on public.events (public_slug)
  where public_slug is not null;

alter table public.videos
  add column if not exists showcase_enabled boolean not null default false,
  add column if not exists showcase_order   integer not null default 0;

-- Consulta pública: vídeos liberados de um evento, já na ordem do portfólio.
create index if not exists videos_event_showcase_idx
  on public.videos (event_id, showcase_order)
  where showcase_enabled;

-- Consulta pública: eventos elegíveis ao portfólio.
create index if not exists events_portfolio_idx
  on public.events (event_date desc)
  where is_public and status = 'published' and public_slug is not null;
