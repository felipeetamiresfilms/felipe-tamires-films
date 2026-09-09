import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPortfolioEvent } from "@/lib/portfolio";
import { eventTypeLabels } from "@/lib/labels";
import { formatEventDate } from "@/lib/format";
import { portfolioEventWhatsAppMessage } from "@/config/site";
import { SITE_NAME, SITE_URL } from "@/config/site";
import { OG_BASE, OG_IMAGE } from "@/config/seo";
import { CoverImage } from "@/components/watch/CoverImage";
import { WatchClient } from "@/components/watch/WatchClient";
import { ContactBanner } from "@/components/public/ContactBanner";
import { JsonLd } from "@/components/seo/JsonLd";

export const dynamic = "force-dynamic";

type PageParams = { slug: string };

/** Miniatura estável e pública para OG (thumb do YouTube ou a definida pelo
 *  admin). NUNCA a capa: ela é signed URL que expira em 6h. */
function publicPoster(event: {
  videos: { category: string; posterUrl: string | null }[];
}): string | null {
  const poster =
    event.videos.find((v) => v.category === "main_film")?.posterUrl ??
    event.videos[0]?.posterUrl ??
    null;
  return poster && /^https?:\/\//.test(poster) ? poster : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPortfolioEvent(slug);

  if (!event) {
    return { title: "Filme não encontrado", robots: { index: false } };
  }

  const description =
    event.description ??
    `${eventTypeLabels[event.eventType]}${
      event.location ? ` em ${event.location}` : ""
    }${
      event.eventDate ? `, ${formatEventDate(event.eventDate)}` : ""
    } — um filme da Felipe & Tamires Films.`;

  const title = `${event.title} | ${SITE_NAME}`;
  const poster = publicPoster(event);
  const images = poster
    ? [{ url: poster, alt: `Cena do filme ${event.title}` }]
    : OG_BASE.images;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/filmes/${event.publicSlug}` },
    openGraph: {
      ...OG_BASE,
      type: "video.other",
      url: `/filmes/${event.publicSlug}`,
      title,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [poster ?? OG_IMAGE.url],
    },
  };
}

export default async function PortfolioEventPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { slug } = await params;
  const event = await getPortfolioEvent(slug);

  if (!event) {
    notFound();
  }

  const displayTitle = event.title.replace(/^Casamento\s+/i, "");
  const metaLine = [
    event.eventDate ? formatEventDate(event.eventDate) : null,
    eventTypeLabels[event.eventType],
    event.location,
  ]
    .filter(Boolean)
    .join(" · ");

  const primaryVideoId =
    event.videos.find((video) => video.category === "main_film")?.id ??
    event.videos[0]?.id ??
    null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: `${SITE_URL}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Filmes",
        item: `${SITE_URL}/filmes`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: event.title,
        item: `${SITE_URL}/filmes/${event.publicSlug}`,
      },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <WatchClient
        displayTitle={displayTitle}
        metaLine={metaLine}
        eyebrow="Felipe & Tamires Films"
        heroDescription={event.description}
        tagline=""
        collectionLabel="Assista"
        cover={
          event.coverUrl ? (
            <CoverImage
              url={event.coverUrl}
              alt={`Capa de ${displayTitle}`}
              motion="kenburns"
            />
          ) : null
        }
        videos={event.videos}
        primaryVideoId={primaryVideoId}
      />

      <div className="mx-auto w-full max-w-6xl px-6 pb-20 sm:px-8 2xl:max-w-[88rem]">
        <ContactBanner
          title="Imaginou a sua história contada assim?"
          text="Cada evento tem seu próprio ritmo, suas pessoas e sua história. Se vocês estão planejando o de vocês, a gente quer conhecer."
          message={portfolioEventWhatsAppMessage(event.eventType, event.title)}
          ctaLabel="Quero conversar com vocês"
        />
      </div>
    </>
  );
}
