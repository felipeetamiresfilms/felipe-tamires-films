import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminEventDetail } from "@/lib/admin/queries";
import { isUuid } from "@/lib/admin/validation";
import { VideoForm } from "../../../video-form";
import { createVideoAction } from "../../../actions";

export const metadata = { title: "Adicionar vídeo" };

export default async function NewVideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const event = await getAdminEventDetail(id);
  if (!event) notFound();

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
            Adicionar vídeo
          </h1>
          <p className="text-sm text-bone-dim">
            Entra no fim da lista, como publicado.
          </p>
        </header>

        <VideoForm
          action={createVideoAction}
          eventId={event.id}
          submitLabel="Adicionar vídeo"
          cancelHref={`/backstage-ft/eventos/${event.id}`}
        />
      </div>
    </section>
  );
}
