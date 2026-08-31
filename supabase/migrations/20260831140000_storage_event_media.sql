-- Felipe & Tamires Films — Storage de imagens do portal (Etapa 5)
--
-- Aditivo. NÃO altera migrations anteriores, NÃO reseta, NÃO apaga dados.
-- Cria o bucket PRIVADO `event-media` e as policies de Storage para os
-- administradores (linha em admin_users) gerenciarem os ARQUIVOS DE IMAGEM.
--
-- Escopo: SOMENTE o bucket `event-media`. Isto NÃO libera DELETE nas tabelas
-- clients / events / videos — é apenas o gerenciamento de objetos de imagem
-- (capas e, no futuro, thumbnails).
--
-- Vídeos NUNCA entram no Storage: o portal guarda só metadados + referências
-- a provedores externos (YouTube/Bunny/Cloudflare).
--
-- Observação de deploy: `create policy ... on storage.objects` precisa da
-- permissão que o painel do Supabase concede ao papel `postgres`. Se
-- `supabase db push` reclamar de owner em `storage.objects`, rode este
-- arquivo pelo SQL Editor do painel (é o caminho oficial para policies de
-- Storage).

-- ---------------------------------------------------------------------------
-- Bucket privado + teto de tamanho e MIME no nível do Storage
-- (defesa em profundidade — o servidor Next também valida MIME/tamanho/magic
-- bytes antes do upload).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-media',
  'event-media',
  false,
  10485760, -- 10 MiB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Policies em storage.objects, restritas ao bucket + public.is_admin().
--   anon                         -> nenhuma policy casa -> sem acesso
--   authenticated sem is_admin() -> nenhuma policy casa -> sem acesso
--   authenticated + is_admin()   -> SELECT/INSERT/UPDATE/DELETE só em event-media
--   service_role                 -> ignora RLS (gera signed URLs no fluxo público)
-- ---------------------------------------------------------------------------
drop policy if exists "event-media admin select" on storage.objects;
create policy "event-media admin select"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'event-media' and public.is_admin());

drop policy if exists "event-media admin insert" on storage.objects;
create policy "event-media admin insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'event-media' and public.is_admin());

drop policy if exists "event-media admin update" on storage.objects;
create policy "event-media admin update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'event-media' and public.is_admin())
  with check (bucket_id = 'event-media' and public.is_admin());

drop policy if exists "event-media admin delete" on storage.objects;
create policy "event-media admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'event-media' and public.is_admin());
