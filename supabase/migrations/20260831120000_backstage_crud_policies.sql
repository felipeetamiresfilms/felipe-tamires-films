-- Felipe & Tamires Films — escrita administrativa (Etapa 4)
--
-- Aplicável ao banco já em produção: NÃO recria, altera nem apaga nada das
-- migrations anteriores. Só ADICIONA policies de INSERT e UPDATE para os
-- administradores em clients / events / videos.
--
-- Antes desta migration: administrador só tinha SELECT (Etapa 3).
-- Depois desta migration:
--   anon                        -> nenhum acesso (continua sem policy)
--   authenticated + is_admin()  -> SELECT + INSERT + UPDATE em clients/events/videos
--   authenticated sem is_admin  -> nenhuma linha (policy não casa)
--   service_role                -> ignora RLS (fluxo público /assistir/[slug])
--
-- DELETE segue SEM policy de propósito: nesta etapa não há exclusão permanente.
-- Arquivar um evento é uma mudança de `status`, não um DELETE.

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------
drop policy if exists "clients admin insert" on public.clients;
create policy "clients admin insert"
  on public.clients for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "clients admin update" on public.clients;
create policy "clients admin update"
  on public.clients for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
drop policy if exists "events admin insert" on public.events;
create policy "events admin insert"
  on public.events for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "events admin update" on public.events;
create policy "events admin update"
  on public.events for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- videos
-- ---------------------------------------------------------------------------
drop policy if exists "videos admin insert" on public.videos;
create policy "videos admin insert"
  on public.videos for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "videos admin update" on public.videos;
create policy "videos admin update"
  on public.videos for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
