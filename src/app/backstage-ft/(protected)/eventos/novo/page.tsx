import Link from "next/link";
import { getAdminClientOptions } from "@/lib/admin/queries";
import { isUuid } from "@/lib/admin/validation";
import { EventForm } from "../event-form";
import { createEventAction } from "../actions";

export const metadata = { title: "Novo evento" };

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const [clients, { cliente }] = await Promise.all([
    getAdminClientOptions(),
    searchParams,
  ]);

  // Cliente pré-selecionado só se veio um UUID que existe de fato.
  const preselected =
    cliente && isUuid(cliente) && clients.some((c) => c.id === cliente)
      ? cliente
      : "";

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 sm:px-8 2xl:max-w-[88rem]">
      <div className="rise flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <Link
            href="/backstage-ft/eventos"
            className="text-xs uppercase tracking-[0.24em] text-bone-dim transition-colors hover:text-bone"
          >
            ← Eventos
          </Link>
          <h1 className="font-display text-3xl font-light text-bone sm:text-4xl">
            Novo evento
          </h1>
          <p className="text-sm text-bone-dim">
            Começa como rascunho. O link privado é gerado automaticamente.
          </p>
        </header>

        <EventForm
          action={createEventAction}
          clients={clients}
          submitLabel="Salvar evento"
          cancelHref="/backstage-ft/eventos"
          initial={{
            clientId: preselected,
            title: "",
            eventType: "",
            eventDate: "",
            location: "",
            description: "",
          }}
        />
      </div>
    </section>
  );
}
