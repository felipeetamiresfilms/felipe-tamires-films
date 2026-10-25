/**
 * Clique para contato comercial (`contact_click` no GA4).
 *
 * Só conta o que foi marcado de propósito: um <a> com
 * `data-contact-location` (hoje, todo `WhatsAppCTA`) cujo destino é um canal
 * real da FTF. Links de navegação, o WhatsApp de parceiros e o contato de
 * privacidade não têm o atributo — nunca viram conversão.
 *
 * Um clique é INTENÇÃO de contato: não confirma que a mensagem foi enviada.
 *
 * Sem dependências de runtime (só tipos): testável com `node --test`.
 * Nada pessoal sai daqui — nem número, nem texto da mensagem pré-preenchida,
 * nem título de filme (o título da página é o genérico de `page.ts`).
 */

import type { PageContext } from "./page";

/** Nome no dataLayer; a tag do GTM o envia ao GA4 como `contact_click`. */
export const CONTACT_DATALAYER_EVENT = "ftf_contact_click";
/** Nome do evento no GA4 (o mesmo que a Data API consulta). */
export const CONTACT_GA4_EVENT = "contact_click";

export type ContactChannel = "whatsapp" | "email";

export type ContactClick = {
  contact_channel: ContactChannel;
  contact_location: string;
  contact_label: string;
  page_path: string;
  page_title: string;
};

/** O que o listener extrai do <a> clicado. */
export type ContactTarget = {
  href: string;
  location: string | null;
  label: string | null;
};

/**
 * Identificadores curtos e estáveis: minúsculas, sem acento, `_` como
 * separador, até 60 caracteres. Também neutraliza qualquer texto inesperado.
 */
export function contactSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

/** Canal do destino — só os canais da própria FTF. */
export function contactChannelOf(href: string, whatsappNumber: string): ContactChannel | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (url.protocol === "mailto:") return "email";
  if (url.protocol !== "https:") return null;
  if (url.hostname === "wa.me") {
    return url.pathname.replace(/\//g, "") === whatsappNumber ? "whatsapp" : null;
  }
  if (url.hostname === "api.whatsapp.com") {
    return url.searchParams.get("phone") === whatsappNumber ? "whatsapp" : null;
  }
  return null;
}

export function buildContactClick(
  target: ContactTarget,
  page: Pick<PageContext, "page_path" | "page_title"> | null,
  whatsappNumber: string,
): ContactClick | null {
  if (!page) return null;
  const location = contactSlug(target.location ?? "");
  if (!location) return null;
  const channel = contactChannelOf(target.href, whatsappNumber);
  if (!channel) return null;
  return {
    contact_channel: channel,
    contact_location: location,
    // Sempre presente: no dataLayer do GTM, chave ausente herdaria o valor
    // do clique anterior.
    contact_label: contactSlug(target.label ?? "") || "(not set)",
    page_path: page.page_path,
    page_title: page.page_title,
  };
}

type ClickLike = { button: number; target: EventTarget | null };

/**
 * Listener de `click` (botão principal) e `auxclick` (botão do meio — abre
 * o WhatsApp em outra aba). Um evento do navegador = no máximo um envio.
 * Nunca chama `preventDefault`: a navegação até o destino segue intacta.
 */
export function createContactClickHandler(deps: {
  /** Consentimento de Estatísticas + GTM carregado + rota rastreável. */
  canSend: () => boolean;
  findTarget: (target: EventTarget | null) => ContactTarget | null;
  pageContext: () => Pick<PageContext, "page_path" | "page_title"> | null;
  send: (click: ContactClick) => void;
  whatsappNumber: string;
}): (event: ClickLike) => void {
  return (event) => {
    if (event.button !== 0 && event.button !== 1) return;
    const target = deps.findTarget(event.target);
    if (!target || !deps.canSend()) return;
    const click = buildContactClick(target, deps.pageContext(), deps.whatsappNumber);
    if (click) deps.send(click);
  };
}

/** Nomes legíveis dos pontos de contato, para o Backstage. */
export const CONTACT_LOCATION_LABELS: Record<string, string> = {
  home_hero: "Início · destaque (hero)",
  home_como_funciona: "Início · como funciona",
  home_sobre: "Início · sobre nós",
  home_final_cta: "Início · bloco final",
  filmes_final_cta: "Filmes · bloco final",
  filme_final_cta: "Página de filme · bloco final",
  pacotes_essencia: "Pacotes · Essência",
  pacotes_memoria: "Pacotes · Memória",
  pacotes_experiencia: "Pacotes · Experiência",
  pacotes_evento_diferente: "Pacotes · evento diferente",
  header: "Cabeçalho · Falar conosco",
  menu_mobile: "Menu mobile · Falar conosco",
};
