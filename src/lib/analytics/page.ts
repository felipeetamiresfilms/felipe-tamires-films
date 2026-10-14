import { isTrackedPath } from "./routes";

/**
 * Contexto de página higienizado — a ÚNICA forma de URL/título que segue
 * para as ferramentas de estatística.
 *
 *  - location: origem + caminho da allowlist + só parâmetros conhecidos
 *    (utm_* e `evento` em /pacotes, com valor validado). Nada de hash.
 *  - referrer: na navegação client-side, a página anterior já higienizada;
 *    na 1ª página do documento, só a origem de quem enviou o visitante.
 *  - title: genérico por tipo de página — nunca `document.title`, que nas
 *    páginas de filme leva o título do evento (nomes de pessoas).
 *  - 404: reportado como `/404`, sem o caminho digitado.
 */

export type PageType =
  | "home"
  | "films"
  | "film_detail"
  | "packages"
  | "curation"
  | "curation_detail"
  | "not_found";

export type PageContext = {
  page_location: string;
  /** Só o caminho de `page_location` (ex.: "/filmes", "/404"), sem query. */
  page_path: string;
  page_referrer: string;
  page_title: string;
  page_type: PageType;
};

const TITLES: Record<PageType, string> = {
  home: "Início",
  films: "Filmes",
  film_detail: "Filme",
  packages: "Pacotes",
  curation: "Recomendamos",
  curation_detail: "Parceiro recomendado",
  not_found: "Página não encontrada",
};

const UTM_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
] as const;

/** Valores aceitos de `?evento=` (mesmos ids de `config/packages.ts`). */
const PACKAGE_EVENTS = new Set(["casamento", "15-anos", "aniversario"]);

export function pageTypeOf(pathname: string): PageType | null {
  if (!isTrackedPath(pathname)) return null;
  if (pathname === "/") return "home";
  if (pathname.startsWith("/filmes/")) return "film_detail";
  if (pathname.startsWith("/filmes")) return "films";
  if (pathname.startsWith("/pacotes")) return "packages";
  if (pathname.startsWith("/recomendamos/")) return "curation_detail";
  return "curation";
}

function cleanParam(value: string): string {
  // Texto de campanha: curto, sem e-mails/URLs embutidos.
  const v = value.trim().slice(0, 100);
  return /@|https?:/i.test(v) ? "" : v;
}

function sanitizedSearch(pathname: string, search: string): string {
  const input = new URLSearchParams(search);
  const output = new URLSearchParams();
  for (const key of UTM_PARAMS) {
    const value = cleanParam(input.get(key) ?? "");
    if (value) output.set(key, value);
  }
  const evento = input.get("evento");
  if (pathname === "/pacotes" && evento && PACKAGE_EVENTS.has(evento)) {
    output.set("evento", evento);
  }
  const query = output.toString();
  return query ? `?${query}` : "";
}

/** URL higienizada de uma página rastreável, ou null se não for rastreável. */
export function sanitizeLocation(
  url: URL,
  options: { notFound?: boolean } = {},
): string | null {
  const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : "/";
  if (!isTrackedPath(path)) return null;
  if (options.notFound) return `${url.origin}/404`;
  return `${url.origin}${path}${sanitizedSearch(path, url.search)}`;
}

/** Referrer da 1ª página do documento (a partir de `document.referrer`). */
export function sanitizeReferrer(referrer: string): string {
  if (!referrer) return "";
  let ref: URL;
  try {
    ref = new URL(referrer);
  } catch {
    return "";
  }
  if (ref.protocol !== "https:" && ref.protocol !== "http:") return "";
  // Externo ou interno: só a origem. (Internamente o `strict-origin` já
  // corta o caminho — "origem/" seria confundido com "veio da Home".)
  return ref.origin;
}

export function buildPageContext(input: {
  href: string;
  referrer: string;
  notFound: boolean;
}): PageContext | null {
  const url = new URL(input.href);
  const location = sanitizeLocation(url, { notFound: input.notFound });
  const type = input.notFound ? "not_found" : pageTypeOf(url.pathname.replace(/(.)\/+$/, "$1"));
  if (!location || !type) return null;
  return {
    page_location: location,
    page_path: new URL(location).pathname,
    page_referrer: input.referrer,
    page_title: TITLES[type],
    page_type: type,
  };
}
