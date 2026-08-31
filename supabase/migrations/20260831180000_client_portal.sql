-- Felipe & Tamires Films — Biblioteca privada do cliente (Etapa 8)
--
-- Aditivo. NÃO altera migrations anteriores, NÃO reseta, NÃO gera token para
-- nenhum cliente existente. Nenhuma policy nova para `anon`: a rota
-- /meus-filmes/[token] é lida pelo servidor (service_role, server-only),
-- como já acontece em /assistir.
--
-- Acesso do cliente por LINK privado permanente, sem login:
--   token forte -> SHA-256 -> portal_token_hash   (o token puro NUNCA é gravado)
--   portal_enabled = true  -> o link vale
--   portal_enabled = false -> /meus-filmes/[token] retorna 404

alter table public.clients
  add column if not exists portal_token_hash       text,
  add column if not exists portal_enabled          boolean not null default false,
  add column if not exists portal_token_created_at timestamptz;

-- Cada hash é único (colisão de SHA-256 é inviável); só quando preenchido.
create unique index if not exists clients_portal_token_hash_key
  on public.clients (portal_token_hash)
  where portal_token_hash is not null;
