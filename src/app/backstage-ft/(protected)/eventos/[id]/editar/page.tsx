import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAdminClientOptions,
  getAdminEventDetail,
} from "@/lib/admin/queries";
import { isUuid } from "@/lib/admin/validation";
import { EventForm } from "../../event-form";
import { updateEventAction } from "../../actions";

export const metadata = { title: "Editar evento" };

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const [event, clients] = await Promise.all([
    getAdminEventDetail(id),
    getAdminClientOptions(),
  ]);
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
            Editar evento
          </h1>
          <p className="text-sm text-bone-dim">
            O link privado não muda ao editar.
          </p>
        </header>

        <EventForm
          action={updateEventAction}
          clients={clients}
          submitLabel="Salvar alterações"
          cancelHref={`/backstage-ft/eventos/${event.id}`}
          eventId={event.id}
          initial={{
            clientId: event.clientId,
            title: event.title,
            eventType: event.eventType,
            eventDate: event.eventDate ?? "",
            location: event.location ?? "",
            description: event.description ?? "",
          }}
        />
      </div>
    </section>
  );
}
