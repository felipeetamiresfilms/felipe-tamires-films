import Link from "next/link";
import { getAdminEvents, getAdminStats } from "@/lib/admin/queries";
import { eventTypeLabels } from "@/lib/labels";
import { formatEventDate } from "@/lib/format";
import { StatusBadge } from "@/components/backstage/StatusBadge";
import {
  ghostButtonClass,
  primaryButtonClass,
  subtleButtonClass,
} from "@/components/backstage/form-ui";

export default async function BackstageDashboardPage() {
  const [stats, events] = await Promise.all([getAdminStats(), getAdminEvents()]);

  const statCards = [
    { label: "Clientes", value: stats.clients, href: "/backstage-ft/clientes" },
    { label: "Eventos", value: stats.events, href: "/backstage-ft/eventos" },
    { label: "Vídeos", value: stats.videos, href: "/backstage-ft/eventos" },
  ];

  const recent = events.slice(0, 8);

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 sm:px-8 2xl:max-w-[88rem]">
      <div className="rise flex flex-col gap-12">
        <header className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.32em] text-brass">
              Área administrativa
            </p>
            <h1 className="font-display text-4xl font-light text-bone sm:text-5xl">
              Painel Felipe &amp; Tamires Films
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/backstage-ft/clientes/novo"
              className={primaryButtonClass}
            >
              + Novo cliente
            </Link>
            <Link href="/backstage-ft/eventos/novo" className={ghostButtonClass}>
              + Novo evento
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {statCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-xl border border-hairline bg-surface p-6 transition-colors hover:border-brass/40"
            >
              <p className="font-display text-4xl font-light tabular-nums text-bone">
                {card.value}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.24em] text-bone-dim">
                {card.label}
              </p>
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs uppercase tracking-[0.28em] text-bone-dim">
              Eventos recentes
            </h2>
            <Link
              href="/backstage-ft/eventos"
              className="text-xs uppercase tracking-[0.22em] text-bone-dim transition-colors hover:text-bone"
            >
              Ver todos
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="rounded-xl border border-hairline bg-surface p-6 text-sm text-bone-dim">
              Nenhum evento cadastrado ainda.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {recent.map((event) => {
                const meta = [
                  event.eventDate ? formatEventDate(event.eventDate) : null,
                  eventTypeLabels[event.eventType],
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
                        <h3 className="font-display text-lg font-light text-bone">
                          {event.title}
                        </h3>
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
                        {event.videoCount === 1 ? "vídeo" : "vídeos"}
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
      </div>
    </section>
  );
}
