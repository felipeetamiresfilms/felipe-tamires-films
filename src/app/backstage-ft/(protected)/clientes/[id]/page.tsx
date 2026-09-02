import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminClientDetail, getClientPortalState } from "@/lib/admin/queries";
import { isUuid } from "@/lib/admin/validation";
import { formatEventDate } from "@/lib/format";
import { eventTypeLabels } from "@/lib/labels";
import { FeedbackBanner } from "@/components/backstage/FeedbackBanner";
import { StatusBadge } from "@/components/backstage/StatusBadge";
import { ClientPortalAccess } from "@/components/backstage/ClientPortalAccess";
import { ClientDangerZone } from "@/components/backstage/ClientDangerZone";
import {
  ghostButtonClass,
  primaryButtonClass,
} from "@/components/backstage/form-ui";
import {
  deleteClientAction,
  disableClientPortalAction,
  issueClientPortalAction,
} from "../actions";

export const metadata = { title: "Cliente" };

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const [client, portal, { ok }] = await Promise.all([
    getAdminClientDetail(id),
    getClientPortalState(id),
    searchParams,
  ]);
  if (!client) notFound();

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 sm:px-8 2xl:max-w-[88rem]">
      <div className="rise flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <Link
            href="/backstage-ft/clientes"
            className="text-xs uppercase tracking-[0.24em] text-bone-dim transition-colors hover:text-bone"
          >
            ← Clientes
          </Link>
          <FeedbackBanner code={ok} />
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="font-display text-3xl font-light text-bone sm:text-4xl">
                {client.displayName}
              </h1>
              <p className="text-sm text-bone-dim">
                {[client.email, client.phone].filter(Boolean).join(" · ") ||
                  "Sem contato cadastrado"}
              </p>
              <p className="text-xs uppercase tracking-[0.16em] text-bone-dim">
                Cadastrado em {formatEventDate(client.createdAt)}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/backstage-ft/clientes/${client.id}/editar`}
                className={ghostButtonClass}
              >
                Editar cliente
              </Link>
              <Link
                href={`/backstage-ft/eventos/novo?cliente=${client.id}`}
                className={primaryButtonClass}
              >
                + Novo evento
              </Link>
            </div>
          </header>
        </div>

        <ClientPortalAccess
          clientId={client.id}
          created={portal.created}
          enabled={portal.enabled}
          issueAction={issueClientPortalAction}
          disableAction={disableClientPortalAction}
        />

        <div className="flex flex-col gap-4">
          <h2 className="text-xs uppercase tracking-[0.28em] text-bone-dim">
            Eventos
          </h2>

          {client.events.length === 0 ? (
            <p className="rounded-xl border border-hairline bg-surface p-6 text-sm text-bone-dim">
              Nenhum evento vinculado a este cliente.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {client.events.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/backstage-ft/eventos/${event.id}`}
                    className="flex flex-col gap-2 rounded-xl border border-hairline bg-surface p-5 transition-colors hover:border-brass/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-display text-lg font-light text-bone">
                          {event.title}
                        </h3>
                        <StatusBadge status={event.status} />
                      </div>
                      <p className="text-xs uppercase tracking-[0.16em] text-bone-dim">
                        {[
                          eventTypeLabels[event.eventType],
                          event.eventDate
                            ? formatEventDate(event.eventDate)
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs uppercase tracking-[0.16em] text-bone-dim">
                      {event.videoCount}{" "}
                      {event.videoCount === 1 ? "vídeo" : "vídeos"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ClientDangerZone
          clientId={client.id}
          eventCount={client.events.length}
          videoCount={client.events.reduce((sum, e) => sum + e.videoCount, 0)}
          deleteAction={deleteClientAction}
        />
      </div>
    </section>
  );
}
