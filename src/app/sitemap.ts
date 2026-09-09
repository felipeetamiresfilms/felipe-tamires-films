import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";
import { listPortfolioEvents } from "@/lib/portfolio";
import { listCurationCategories } from "@/lib/curadoria";

/**
 * `/sitemap.xml` — convenção nativa do Next.js.
 *
 * ENTRAM: só as rotas PÚBLICAS e indexáveis —
 *   `/`, `/filmes`, `/pacotes`, `/recomendamos`,
 *   `/filmes/[publicSlug]` de eventos elegíveis ao portfólio,
 *   `/recomendamos/[slug]` de parceiros publicados.
 *
 * NÃO ENTRAM (e nunca devem): `/assistir/*`, `/meus-filmes/*`,
 *   `/backstage-ft/*`, qualquer `privateSlug`/token, e as querystrings
 *   `?evento=` de `/pacotes` (são estados da mesma página).
 *
 * As listas dinâmicas usam EXATAMENTE as mesmas regras de publicação da
 * aplicação (`listPortfolioEvents` / `listCurationCategories`). Se o banco
 * não responder no build, o sitemap sai só com as rotas estáticas.
 */
export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/filmes`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/pacotes`, changeFrequency: "monthly", priority: 0.8 },
    {
      url: `${SITE_URL}/recomendamos`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  let filmRoutes: Entry[] = [];
  try {
    const events = await listPortfolioEvents();
    filmRoutes = events.map(
      (event): Entry => ({
        url: `${SITE_URL}/filmes/${event.publicSlug}`,
        changeFrequency: "yearly",
        priority: 0.7,
      }),
    );
  } catch {
    // banco indisponível no build — mantém só as rotas estáticas
  }

  const partnerRoutes: Entry[] = [];
  try {
    const categories = await listCurationCategories();
    const seen = new Set<string>();
    for (const category of categories) {
      for (const partner of category.partners) {
        if (seen.has(partner.slug)) continue;
        seen.add(partner.slug);
        partnerRoutes.push({
          url: `${SITE_URL}/recomendamos/${partner.slug}`,
          changeFrequency: "monthly",
          priority: 0.4,
        });
      }
    }
  } catch {
    // idem
  }

  return [...staticRoutes, ...filmRoutes, ...partnerRoutes];
}
