import Link from "next/link";
import { getAdminEvents } from "@/lib/admin/queries";
import { eventTypeLabels } from "@/lib/labels";
import { formatEventDate } from "@/lib/format";
import { StatusBadge } from "@/components/backstage/StatusBadge";
import {
  ghostButtonClass,
  primaryButtonClass,
  subtleButtonClass,
} from "@/components/backstage/form-ui";

export const metadata = { title: "Eventos" };

export default async function EventsListPage() {
  const events = await getAdminEvents();

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 sm:px-8 2xl:max-w-[88rem]">
      <div className="rise flex flex-col gap-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.32em] text-brass">
              Painel
            </p>
            <h1 className="font-display text-3xl font-light text-bone sm:text-4xl">
              Eventos
            </h1>
          </div>
          <Link href="/backstage-ft/eventos/novo" className={primaryButtonClass}>
            + Novo evento
          </Link>
        </header>

        {events.length === 0 ? (
          <div className="flex flex-col items-start gap-4 rounded-xl border border-hairline bg-surface p-6">
            <p className="text-sm text-bone-dim">Nenhum evento cadastrado ainda.</p>
            <Link href="/backstage-ft/eventos/novo" className={ghostButtonClass}>
              Criar o primeiro
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {events.map((event) => {
              const meta = [
                eventTypeLabels[event.eventType],
                event.eventDate ? formatEventDate(event.eventDate) : null,
                event.location,
              ]
                .filter(Boolean)
                .join(" · ");

              return (
                <li
                  key={event.id}
                  className="flex flex-col gap-4 rounded-xl border border-hairline bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-display text-lg font-light text-bone">
                        {event.title}
                      </h2>
                      <StatusBadge status={event.status} />
                    </div>
                    <p className="text-sm text-bone-dim">{event.clientName}</p>
                    {meta ? (
                      <p className="text-xs uppercase tracking-[0.16em] text-bone-dim">
                        {meta}
                      </p>
                    ) : null}
                    <p className="text-xs text-bone-dim">
                      {event.videoCount}{" "}
                      {event.videoCount === 1 ? "vídeo" : "vídeos"} · cadastrado
                      em {formatEventDate(event.createdAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 self-start">
                    <Link
                      href={`/backstage-ft/eventos/${event.id}`}
                      className={subtleButtonClass}
                    >
                      Abrir
                    </Link>
                    {event.status === "published" ? (
                      <a
                        href={`/assistir/${event.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={subtleButtonClass}
                      >
                        Abrir filme
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
