import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminEventDetail } from "@/lib/admin/queries";
import { isUuid } from "@/lib/admin/validation";
import { formatEventDate, formatDuration } from "@/lib/format";
import {
  eventTypeLabels,
  publishStatusLabels,
  videoCategoryLabels,
  videoProviderLabels,
} from "@/lib/labels";
import { createServerAuthClient } from "@/lib/supabase/server";
import { FeedbackBanner } from "@/components/backstage/FeedbackBanner";
import { StatusBadge } from "@/components/backstage/StatusBadge";
import { CopyLinkButton } from "@/components/backstage/CopyLinkButton";
import {
  ghostButtonClass,
  primaryButtonClass,
  subtleButtonClass,
} from "@/components/backstage/form-ui";
import { SubmitButton } from "@/components/backstage/SubmitButton";
import {
  archiveEventAction,
  moveVideoAction,
  publishEventAction,
  removeCoverAction,
  restoreEventAction,
  setCoverAction,
} from "../actions";

export const metadata = { title: "Evento" };

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const [event, { ok, erro }] = await Promise.all([
    getAdminEventDetail(id),
    searchParams,
  ]);
  if (!event) notFound();

  const isPublished = event.status === "published";
  const isDraft = event.status === "draft";
  const isArchived = event.status === "archived";
  const noVideos = event.videos.length === 0;

  // Preview da capa: signed URL curta gerada pela sessão do admin (SELECT via RLS).
  let coverPreviewUrl: string | null = null;
  if (event.coverImagePath) {
    try {
      const supabase = await createServerAuthClient();
      const { data } = await supabase.storage
        .from("event-media")
        .createSignedUrl(event.coverImagePath, 3600);
      coverPreviewUrl = data?.signedUrl ?? null;
    } catch {
      coverPreviewUrl = null;
    }
  }

  const info: Array<[string, string]> = [
    ["Tipo", eventTypeLabels[event.eventType]],
    ["Data", event.eventDate ? formatEventDate(event.eventDate) : "—"],
    ["Local", event.location ?? "—"],
    ["Status", publishStatusLabels[event.status]],
    [
      "Vídeos",
      `${event.videos.length} ${event.videos.length === 1 ? "vídeo" : "vídeos"}`,
    ],
    ["Cadastrado", formatEventDate(event.createdAt)],
  ];

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 sm:px-8 2xl:max-w-[88rem]">
      <div className="rise flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <Link
            href="/backstage-ft/eventos"
            className="text-xs uppercase tracking-[0.24em] text-bone-dim transition-colors hover:text-bone"
          >
            ← Eventos
          </Link>

          <FeedbackBanner code={ok} error={erro} />

          <header className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-light text-bone sm:text-4xl">
                {event.title}
              </h1>
              <StatusBadge status={event.status} />
            </div>
            <p className="text-sm text-bone-dim">
              Cliente:{" "}
              <Link
                href={`/backstage-ft/clientes/${event.clientId}`}
                className="text-bone underline decoration-hairline underline-offset-4 transition-colors hover:decoration-brass"
              >
                {event.clientName}
              </Link>
            </p>
          </header>

          {/* Ações conforme o status */}
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/backstage-ft/eventos/${event.id}/editar`}
              className={ghostButtonClass}
            >
              Editar evento
            </Link>

            {!isArchived ? (
              <Link
                href={`/backstage-ft/eventos/${event.id}/videos/novo`}
                className={ghostButtonClass}
              >
                Adicionar vídeo
              </Link>
            ) : null}

            {isDraft ? (
              <form action={publishEventAction}>
                <input type="hidden" name="id" value={event.id} />
                <SubmitButton variant="subtle" pendingLabel="Publicando…">
                  {noVideos ? "Publicar mesmo assim" : "Publicar evento"}
                </SubmitButton>
              </form>
            ) : null}

            {isPublished ? (
              <>
                <a
                  href={`/assistir/${event.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={ghostButtonClass}
                >
                  Abrir filme
                </a>
                <form action={archiveEventAction}>
                  <input type="hidden" name="id" value={event.id} />
                  <SubmitButton variant="subtle" pendingLabel="Arquivando…">
                    Arquivar
                  </SubmitButton>
                </form>
              </>
            ) : null}

            {isArchived ? (
              <form action={restoreEventAction}>
                <input type="hidden" name="id" value={event.id} />
                <SubmitButton variant="subtle" pendingLabel="Restaurando…">
                  Restaurar para rascunho
                </SubmitButton>
              </form>
            ) : null}
          </div>

          {isDraft && noVideos ? (
            <p className="rounded-lg border border-brass/40 bg-raised/60 px-4 py-3 text-sm text-brass-soft">
              Este evento ainda não tem vídeos. Você pode publicar assim mesmo,
              mas o portal do cliente abrirá vazio.
            </p>
          ) : null}
        </div>

        {/* Dados do evento */}
        <dl className="grid grid-cols-2 gap-4 rounded-xl border border-hairline bg-surface p-6 sm:grid-cols-3">
          {info.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <dt className="text-xs uppercase tracking-[0.2em] text-bone-dim">
                {label}
              </dt>
              <dd className="text-sm text-bone">{value}</dd>
            </div>
          ))}
        </dl>

        {/* Capa do evento — ação independente, fora do formulário de edição */}
        <div className="flex flex-col gap-4 rounded-xl border border-hairline bg-surface p-6">
          <h2 className="text-xs uppercase tracking-[0.28em] text-bone-dim">
            Capa do evento
          </h2>

          {coverPreviewUrl ? (
            <Image
              src={coverPreviewUrl}
              alt="Capa atual do evento"
              width={640}
              height={360}
              unoptimized
              className="max-w-xl rounded-lg border border-hairline object-cover"
              style={{ width: "100%", height: "auto", aspectRatio: "16 / 9" }}
            />
          ) : (
            <p className="text-sm text-bone-dim">
              Sem capa. O portal do cliente usa o fundo cinematográfico padrão.
            </p>
          )}

          <form
            action={setCoverAction}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <input type="hidden" name="eventId" value={event.id} />
            <input
              type="file"
              name="cover"
              accept="image/jpeg,image/png,image/webp"
              required
              className="min-h-11 max-w-full text-sm text-bone-dim file:mr-3 file:min-h-9 file:rounded-full file:border file:border-brass/50 file:bg-transparent file:px-4 file:py-2 file:text-xs file:font-medium file:uppercase file:tracking-[0.2em] file:text-bone hover:file:border-brass"
            />
            <SubmitButton variant="subtle" pendingLabel="Enviando…">
              {event.coverImagePath ? "Trocar capa" : "Adicionar capa"}
            </SubmitButton>
          </form>

          <p className="text-xs text-bone-dim/80">
            JPEG, PNG ou WEBP, até 10&nbsp;MB. Ideal: imagem horizontal (16:9).
          </p>

          {event.coverImagePath ? (
            <form action={removeCoverAction}>
              <input type="hidden" name="eventId" value={event.id} />
              <SubmitButton variant="subtle" pendingLabel="Removendo…">
                Remover capa
              </SubmitButton>
            </form>
          ) : null}
        </div>

        {event.description ? (
          <p className="max-w-prose text-sm leading-relaxed text-bone-dim">
            {event.description}
          </p>
        ) : null}

        {/* Link de entrega */}
        <div className="flex flex-col gap-3 rounded-xl border border-hairline bg-surface p-6">
          <h2 className="text-xs uppercase tracking-[0.28em] text-bone-dim">
            Link do cliente
          </h2>
          {isPublished ? (
            <CopyLinkButton path={`/assistir/${event.slug}`} />
          ) : (
            <p className="text-sm text-bone-dim">
              Disponível quando o evento estiver publicado. Slug:{" "}
              <code className="text-bone-dim">/assistir/{event.slug}</code>
            </p>
          )}
        </div>

        {/* Vídeos */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xs uppercase tracking-[0.28em] text-bone-dim">
              Vídeos
            </h2>
            {!isArchived ? (
              <Link
                href={`/backstage-ft/eventos/${event.id}/videos/novo`}
                className={primaryButtonClass}
              >
                Adicionar vídeo
              </Link>
            ) : null}
          </div>

          {noVideos ? (
            <p className="rounded-xl border border-hairline bg-surface p-6 text-sm text-bone-dim">
              Nenhum vídeo neste evento.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {event.videos.map((video, index) => {
                const duration = formatDuration(video.duration);
                const meta = [
                  videoCategoryLabels[video.category],
                  videoProviderLabels[video.provider],
                  duration,
                  publishStatusLabels[video.status],
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <li
                    key={video.id}
                    className="flex flex-col gap-3 rounded-xl border border-hairline bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-3">
                        <span className="font-display text-sm tabular-nums text-bone-dim">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <h3 className="font-display text-lg font-light text-bone">
                          {video.title}
                        </h3>
                      </div>
                      <p className="text-xs uppercase tracking-[0.16em] text-bone-dim">
                        {meta}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2 self-start">
                      <form action={moveVideoAction}>
                        <input type="hidden" name="eventId" value={event.id} />
                        <input type="hidden" name="videoId" value={video.id} />
                        <input type="hidden" name="direction" value="up" />
                        <button
                          type="submit"
                          disabled={index === 0}
                          aria-label="Mover para cima"
                          className={subtleButtonClass}
                        >
                          ↑
                        </button>
                      </form>
                      <form action={moveVideoAction}>
                        <input type="hidden" name="eventId" value={event.id} />
                        <input type="hidden" name="videoId" value={video.id} />
                        <input type="hidden" name="direction" value="down" />
                        <button
                          type="submit"
                          disabled={index === event.videos.length - 1}
                          aria-label="Mover para baixo"
                          className={subtleButtonClass}
                        >
                          ↓
                        </button>
                      </form>
                      <Link
                        href={`/backstage-ft/eventos/${event.id}/videos/${video.id}/editar`}
                        className={subtleButtonClass}
                      >
                        Editar
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
