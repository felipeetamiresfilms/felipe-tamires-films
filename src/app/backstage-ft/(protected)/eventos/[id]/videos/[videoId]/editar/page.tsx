import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAdminEventDetail,
  getAdminVideoInEvent,
} from "@/lib/admin/queries";
import { isUuid } from "@/lib/admin/validation";
import { youtubeWatchUrl } from "@/lib/admin/youtube";
import { durationToInput } from "@/lib/admin/duration";
import { VideoForm } from "../../../../video-form";
import { updateVideoAction } from "../../../../actions";

export const metadata = { title: "Editar vídeo" };

export default async function EditVideoPage({
  params,
}: {
  params: Promise<{ id: string; videoId: string }>;
}) {
  const { id, videoId } = await params;
  if (!isUuid(id) || !isUuid(videoId)) notFound();

  // getAdminVideoInEvent devolve null se o vídeo for de OUTRO evento.
  const [event, video] = await Promise.all([
    getAdminEventDetail(id),
    getAdminVideoInEvent(id, videoId),
  ]);
  if (!event || !video) notFound();

  const isYouTube = video.provider === "youtube";

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 sm:px-8 2xl:max-w-[88rem]">
      <div className="rise flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <Link
            href={`/backstage-ft/eventos/${event.id}`}
            className="text-xs uppercase tracking-[0.24em] text-bone-dim transition-colors hover:text-bone"
          >
            ← {event.title}
          </Link>
          <h1 className="font-display text-3xl font-light text-bone sm:text-4xl">
            Editar vídeo
          </h1>
        </header>

        <VideoForm
          action={updateVideoAction}
          eventId={event.id}
          videoId={video.id}
          submitLabel="Salvar alterações"
          cancelHref={`/backstage-ft/eventos/${event.id}`}
          initial={{
            title: video.title,
            description: video.description ?? "",
            category: video.category,
            provider: video.provider,
            sourceUrl:
              isYouTube && video.providerVideoId
                ? youtubeWatchUrl(video.providerVideoId)
                : "",
            embedUrl: isYouTube ? "" : video.embedUrl ?? "",
            downloadUrl: video.downloadUrl ?? "",
            thumbnailUrl: video.thumbnailUrl ?? "",
            durationInput: durationToInput(video.duration),
          }}
        />
      </div>
    </section>
  );
}
