import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPortfolioEvent } from "@/lib/portfolio";
import { eventTypeLabels } from "@/lib/labels";
import { formatEventDate } from "@/lib/format";
import { portfolioEventWhatsAppMessage } from "@/config/site";
import { CoverImage } from "@/components/watch/CoverImage";
import { WatchClient } from "@/components/watch/WatchClient";
import { ContactBanner } from "@/components/public/ContactBanner";

export const dynamic = "force-dynamic";

type PageParams = { slug: string };

/**
 * OG: sem `og:image`. A capa é uma signed URL que expira em 6h — colocá-la
 * numa meta tag daria um cartão quebrado depois do vencimento e exigiria
 * arquitetura extra (imagem pública dedicada) que não vale a pena agora.
 * Privacidade e estabilidade acima de um preview de link.
 */
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
    } — um filme da Felipe & Tamires Films.`;

  return {
    title: { absolute: `${event.title} | Felipe & Tamires Films` },
    description,
    alternates: { canonical: `/filmes/${event.publicSlug}` },
    openGraph: {
      title: `${event.title} | Felipe & Tamires Films`,
      description,
      type: "video.other",
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

  return (
    <>
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
