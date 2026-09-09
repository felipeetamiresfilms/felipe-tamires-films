/**
 * Bases de SEO reutilizáveis para as páginas públicas.
 *
 * O Next.js faz merge RASO de metadata: se uma página define `openGraph`,
 * ela SUBSTITUI o `openGraph` do layout inteiro (não há merge por campo).
 * Por isso cada página pública monta seu próprio `openGraph` espalhando
 * `OG_BASE` e sobrescrevendo `title` / `description` / `url` / `type`.
 */

import { SITE_NAME } from "./site";

/**
 * Imagem social padrão — a foto real do casal, já pública na home
 * (`public/imgs/felipe-e-tamires.jpg`, 934x1400). É retrato, então as
 * plataformas recortam para o centro. Uma arte dedicada 1200x630
 * melhoraria os cartões (ver relatório).
 */
export const OG_IMAGE = {
  url: "/imgs/felipe-e-tamires.jpg",
  width: 934,
  height: 1400,
  alt: SITE_NAME,
};

/** Campos de Open Graph comuns a toda página pública. */
export const OG_BASE = {
  siteName: SITE_NAME,
  locale: "pt_BR",
  images: [OG_IMAGE],
};
