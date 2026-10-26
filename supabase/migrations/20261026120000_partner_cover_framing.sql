-- Felipe & Tamires Films — Enquadramento da capa dos parceiros (/recomendamos)
--
-- Aditiva. NÃO altera, recria nem apaga nada das migrations anteriores e NÃO
-- modifica dados existentes: a coluna nasce `null` para todos os parceiros,
-- o que significa "enquadramento padrão" (comportamento atual, centralizado).
--
-- Guarda só o ajuste visual (object-position + zoom, desktop e mobile) — o
-- arquivo original no bucket `partner-media` nunca é recortado.
-- Forma: { "desktop": {x, y, zoom}, "mobile": {x, y, zoom} }. A validação
-- estrita (chaves e faixas) é feita no servidor (src/lib/cover-framing.ts).
--
-- RLS: sem mudança. As policies existentes de `partners` (admin select /
-- insert / update via is_admin()) já cobrem a nova coluna; leitura pública
-- continua server-side via service_role.

alter table public.partners
  add column if not exists cover_framing jsonb;

alter table public.partners
  drop constraint if exists partners_cover_framing_check;
alter table public.partners
  add constraint partners_cover_framing_check
  check (cover_framing is null or jsonb_typeof(cover_framing) = 'object');
