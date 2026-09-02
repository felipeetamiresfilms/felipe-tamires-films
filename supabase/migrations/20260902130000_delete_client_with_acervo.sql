-- Felipe & Tamires Films — exclusão destrutiva de cliente + acervo (Etapa 10)
--
-- Aditiva. NÃO edita 20260902120000_client_admin_delete.sql nem nenhuma
-- migration anterior. Adiciona SÓ o necessário para a operação transacional.
--
-- Contexto:
--   * A policy "clients admin delete" (migration 20260902120000) cobre o caso
--     de cliente VAZIO — a Server Action segue usando DELETE direto + RLS lá.
--   * events.client_id -> clients.id continua ON DELETE RESTRICT (proteção
--     contra delete acidental). NÃO vira CASCADE global.
--   * videos.event_id -> events.id JÁ é ON DELETE CASCADE (migration inicial):
--     apagar os eventos do cliente remove os vídeos deles automaticamente.
--
-- Esta função é a ÚNICA via para apagar um cliente que ainda tem eventos.
-- Roda numa transação (corpo plpgsql): qualquer erro aborta tudo.

create or replace function public.delete_client_with_acervo(target_client_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- 1. Sessão (JWT) obrigatória.
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  -- 2. Precisa ser administrador (linha em admin_users). Mesma checagem
  --    usada nas policies de escrita do painel.
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  -- 3. O cliente precisa existir (client_id vem do browser — nunca confiar).
  if not exists (
    select 1 from public.clients where id = target_client_id
  ) then
    raise exception 'client_not_found' using errcode = 'P0002';
  end if;

  -- 4. Eventos do cliente. Os vídeos desses eventos somem por CASCADE
  --    (videos.event_id references public.events(id) on delete cascade).
  --    is_public / public_slug / portfolio_featured somem junto com a linha
  --    do evento. Nada de outros clientes é tocado: filtro por client_id.
  delete from public.events where client_id = target_client_id;

  -- 5. O cliente. portal_token_hash / portal_enabled somem com a linha.
  delete from public.clients where id = target_client_id;
end;
$$;

-- anon NUNCA executa. authenticated executa, mas a função barra quem não é
-- admin logo no início.
revoke all on function public.delete_client_with_acervo(uuid) from public;
revoke all on function public.delete_client_with_acervo(uuid) from anon;
grant execute on function public.delete_client_with_acervo(uuid) to authenticated;
