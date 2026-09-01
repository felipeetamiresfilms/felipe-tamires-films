import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEventBySlug, getWatchData } from "@/lib/events";
import { eventTypeLabels } from "@/lib/labels";
import { formatEventDate } from "@/lib/format";
import { CoverImage } from "@/components/watch/CoverImage";
import { WatchClient } from "@/components/watch/WatchClient";

type PageParams = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getEventBySlug(slug);

  if (!data) {
    return { title: "Filme não encontrado", robots: { index: false } };
  }

  return {
    title: data.event.title,
    description: `Filmes do evento de ${data.client.displayName}.`,
    robots: { index: false, follow: false },
  };
}

/**
 * Página privada de entrega e reprodução de um evento.
 *
 * Server Component: busca os dados (`getWatchData` — evento published-only +
 * signed URL da capa + poster resolvido por vídeo) e entrega tudo já
 * serializável para <WatchClient>, que cuida da parte interativa (hero CTA,
 * cards clicáveis, player modal). Nenhum iframe é montado antes do clique.
 */
export default async function WatchPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { slug } = await params;
  const data = await getWatchData(slug);

  if (!data) {
    notFound();
  }

  const { event, coverUrl, videos, primaryVideoId } = data;
  const displayTitle = event.title.replace(/^Casamento\s+/i, "");
  const metaLine = [
    event.eventDate ? formatEventDate(event.eventDate) : null,
    eventTypeLabels[event.eventType],
    event.location,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <WatchClient
      displayTitle={displayTitle}
      metaLine={metaLine}
      cover={
        coverUrl ? (
          <CoverImage
            url={coverUrl}
            alt={`Capa do filme de ${displayTitle}`}
            motion="fade"
          />
        ) : null
      }
      videos={videos}
      primaryVideoId={primaryVideoId}
    />
  );
}
