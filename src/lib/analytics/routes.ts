/**
 * Allowlist das rotas onde a medição OPCIONAL (estatísticas / análise de
 * experiência) pode existir. Tudo que não casar aqui é bloqueado por padrão
 * — inclusive rotas novas, até serem adicionadas de propósito.
 *
 * Só as páginas comerciais públicas:
 *   /  ·  /filmes  ·  /filmes/[publicSlug]  ·  /pacotes
 *   /recomendamos  ·  /recomendamos/[slug]
 *
 * NUNCA: /assistir/[privateSlug], /meus-filmes/[token], /backstage-ft/*.
 * (`/privacidade` também fica fora: é pública, mas não é comercial.)
 *
 * ATENÇÃO para a instrumentação futura (Etapa 2+): o App Router navega no
 * cliente — scripts carregados numa rota pública continuam vivos se o
 * visitante for (ou voltar, via "voltar" do navegador) para uma rota
 * privada. A transição público ↔ privado precisa ser validada sem vazamento
 * de URL/referrer, sem loop de navegação/reload e sem carregar script
 * indevido no documento privado. Não confiar só nesta allowlist para isso.
 */

const SLUG = "[a-z0-9]+(?:-[a-z0-9]+)*";

const TRACKED_PATHS: readonly RegExp[] = [
  /^\/$/,
  /^\/filmes$/,
  new RegExp(`^/filmes/${SLUG}$`),
  /^\/pacotes$/,
  /^\/recomendamos$/,
  new RegExp(`^/recomendamos/${SLUG}$`),
];

/** Prefixos sempre privados — nunca recebem medição opcional. */
export const PRIVATE_PATH_PREFIXES = [
  "/assistir",
  "/meus-filmes",
  "/backstage-ft",
] as const;

function normalize(pathname: string): string {
  // Só o caminho: descarta querystring/hash e a barra final (exceto na raiz).
  const path = pathname.split(/[?#]/, 1)[0] || "/";
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

export function isPrivatePath(pathname: string): boolean {
  const path = normalize(pathname);
  return PRIVATE_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

/** true só para as rotas comerciais públicas da allowlist. */
export function isTrackedPath(pathname: string): boolean {
  const path = normalize(pathname);
  if (isPrivatePath(path)) return false;
  return TRACKED_PATHS.some((pattern) => pattern.test(path));
}
