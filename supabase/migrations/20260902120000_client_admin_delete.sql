-- Felipe & Tamires Films — exclusão administrativa de cliente (Etapa 9)
--
-- Aplicável ao banco já em produção: NÃO recria, altera nem apaga nada das
-- migrations anteriores. Só ADICIONA a policy de DELETE para `clients`,
-- restrita a administrador autenticado (mesma estratégia `public.is_admin()`).
--
-- Modelo de acesso resultante:
--   anon                        -> nenhum acesso (continua sem policy)
--   authenticated + is_admin()  -> SELECT + INSERT + UPDATE + DELETE em clients
--   authenticated sem is_admin  -> nenhuma linha (policy não casa)
--   service_role                -> ignora RLS (fluxo público /assistir/[slug])
--
-- events / videos / admin_users continuam SEM policy de DELETE de propósito:
-- nesta etapa não há exclusão permanente de eventos nem de vídeos.
--
-- Integridade preservada pela FK já existente:
--   events.client_id -> clients.id ON DELETE RESTRICT
-- Um cliente com 1+ eventos NÃO pode ser removido — o banco recusa (23503).
-- A Server Action ainda checa isso antes, para dar mensagem amigável.

drop policy if exists "clients admin delete" on public.clients;
create policy "clients admin delete"
  on public.clients for delete
  to authenticated
  using (public.is_admin());
