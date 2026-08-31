-- Felipe & Tamires Films — seed de desenvolvimento
-- Evento de teste "Ana & Marcos". Reproduzível: usa IDs fixos e faz upsert,
-- então pode ser executado várias vezes sem duplicar registros.
--
-- Supabase CLI: roda automaticamente em `supabase db reset` (banco local).
-- Manual: cole e execute no SQL Editor do painel do Supabase.

-- Cliente ---------------------------------------------------------------------
insert into public.clients (id, display_name, email, phone)
values (
  '00000000-0000-4000-8000-000000000001',
  'Ana & Marcos',
  null,
  null
)
on conflict (id) do update set
  display_name = excluded.display_name,
  email        = excluded.email,
  phone        = excluded.phone;

-- Evento --------------------------------------------------------------------
-- is_public = false: acesso só pelo link privado de alta entropia.
insert into public.events (
  id, client_id, title, slug, event_type, event_date, location, description,
  is_public, status
)
values (
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000001',
  'Casamento Ana & Marcos',
  'ana-e-marcos-k7f3x9',
  'wedding',
  '2026-08-15',
  'Gramado, RS',
  'Filme de casamento de Ana & Marcos, em Gramado.',
  false,
  'published'
)
on conflict (id) do update set
  client_id   = excluded.client_id,
  title       = excluded.title,
  slug        = excluded.slug,
  event_type  = excluded.event_type,
  event_date  = excluded.event_date,
  location    = excluded.location,
  description = excluded.description,
  is_public   = excluded.is_public,
  status      = excluded.status;

-- Vídeos ------------------------------------------------------------------
-- Regravados a cada execução para manter a lista exatamente como definida.
delete from public.videos
where event_id = '00000000-0000-4000-8000-000000000010';

insert into public.videos (
  event_id, title, description, category, provider,
  provider_video_id, embed_url, duration_seconds, sort_order
)
values
  ('00000000-0000-4000-8000-000000000010', 'Filme Principal',
   'O longa do dia: a história de Ana e Marcos do primeiro olhar à última dança.',
   'main_film', 'youtube', null, null, 912, 1),

  ('00000000-0000-4000-8000-000000000010', 'Teaser',
   'Um minuto para reviver a emoção e compartilhar com quem você ama.',
   'teaser', 'youtube', null, null, 78, 2),

  ('00000000-0000-4000-8000-000000000010', 'Cerimônia',
   'A cerimônia na íntegra, dos votos à saída dos noivos.',
   'ceremony', 'youtube', null, null, 2735, 3),

  ('00000000-0000-4000-8000-000000000010', 'Discursos',
   'Padrinhos, madrinhas e familiares nas homenagens durante a festa.',
   'speeches', 'youtube', null, null, 1140, 4),

  ('00000000-0000-4000-8000-000000000010', 'Festa',
   'A pista de dança do começo ao fim — luzes, música e alegria.',
   'party', 'youtube', null, null, 1863, 5);
