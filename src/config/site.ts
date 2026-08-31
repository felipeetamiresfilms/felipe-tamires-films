/**
 * Configuração central do site público.
 *
 * O número de WhatsApp da empresa é informação pública e pode viver no
 * frontend. Todo link/mensagem de WhatsApp passa por aqui — nada de espalhar
 * número solto pelos componentes.
 */

export const SITE_CONFIG = {
  /** WhatsApp oficial, normalizado com DDI do Brasil (55) + DDD (54). */
  whatsappNumber: "5554997006436",
} as const;

/** Monta a URL do WhatsApp com a mensagem pré-preenchida. */
export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(
    message,
  )}`;
}

/**
 * Mensagens padrão (contexto -> texto). Centralizadas para revisão de copy.
 * Tom: elegante, humano, sem venda agressiva.
 */
export const WHATSAPP_MESSAGES = {
  /** CTA genérico da home / hero institucional. */
  homeGeneric:
    "Olá, Felipe e Tamires! Conheci o trabalho de vocês pelo site e gostaria de saber mais sobre os filmes para o meu evento.",
  /** Bloco de proposta de valor da home. */
  howItWorks:
    "Olá, Felipe e Tamires! Conheci o trabalho de vocês pelo site e gostaria de entender melhor como funciona a produção dos filmes.",
  /** Seção "Sobre nós". */
  about:
    "Olá, Felipe e Tamires! Conheci vocês pelo site e gostaria de contar um pouco sobre o meu evento.",
  /** Bloco de conversão no fim da home. */
  planningEvent:
    "Olá, Felipe e Tamires! Estou planejando meu evento e gostaria de conversar com vocês sobre a filmagem.",
  /** Fim da biblioteca /filmes. */
  filmsLibrary:
    "Olá, Felipe e Tamires! Conheci o trabalho de vocês pelo site e gostaria de saber mais sobre a produção de um filme para o meu evento.",
  /** Link "Falar conosco" do header. */
  header:
    "Olá, Felipe e Tamires! Conheci o site de vocês e gostaria de falar sobre a filmagem do meu evento.",
} as const;

/**
 * Hero com evento em destaque. Usa APENAS o título público do evento — que
 * já é informação pública. Nunca inclui slug privado, IDs ou dados do cliente.
 */
export function heroFeaturedWhatsAppMessage(publicTitle: string): string {
  return `Olá, Felipe e Tamires! Conheci o trabalho de vocês pelo site, vi o filme de ${publicTitle} e gostaria de saber mais sobre os filmes para o meu evento.`;
}

/**
 * Página pública de um evento. A mensagem varia pelo tipo do evento e pode
 * citar o título público do filme assistido (informação pública).
 */
export function portfolioEventWhatsAppMessage(
  eventType: string,
  publicTitle?: string,
): string {
  const saw = publicTitle
    ? `vi ${publicTitle} no site`
    : "vi o trabalho de vocês no site";

  if (eventType === "wedding") {
    return `Olá, Felipe e Tamires! Eu ${saw} e gostaria de saber mais sobre os filmes de casamento.`;
  }
  if (eventType === "debut") {
    return `Olá, Felipe e Tamires! Eu ${saw} e gostaria de saber mais sobre os filmes de 15 anos.`;
  }
  return `Olá, Felipe e Tamires! Eu ${saw} e gostaria de saber mais sobre a cobertura audiovisual para o meu evento.`;
}
