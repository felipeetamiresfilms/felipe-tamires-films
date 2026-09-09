import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";

/**
 * `/robots.txt` — convenção nativa do Next.js.
 *
 * Só `/backstage-ft/` é bloqueado por aqui (área administrativa, nunca
 * linkada publicamente). `/assistir/*` e `/meus-filmes/*` NÃO entram no
 * `disallow` de propósito: elas já são `noindex, nofollow` na própria
 * página, e para o Google honrar o `noindex` ele precisa PODER rastrear a
 * URL. Como esses links nunca aparecem em páginas públicas, não há gasto de
 * crawl relevante — e, se um link privado vazar, o `noindex` remove a página
 * de forma limpa (o que o `disallow` sozinho não garante).
 *
 * robots.txt não é mecanismo de segurança: a proteção real continua sendo
 * auth + slug/token não-adivinháveis + `noindex`.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/backstage-ft/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
