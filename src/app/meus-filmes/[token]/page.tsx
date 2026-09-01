import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientLibraryByToken } from "@/lib/client-portal";
import { eventTypeLabels } from "@/lib/labels";
import type { ClientLibraryEvent } from "@/lib/client-portal";

// Página PRIVADA: lê ao vivo (service_role) e assina URLs de capa a cada
// request. Nunca indexada; nunca em sitemap.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Seus filmes",
  robots: { index: false, follow: false },
};

type PageParams = { token: string };

function LibraryCard({ event }: { event: ClientLibraryEvent }) {
  const meta = [
    eventTypeLabels[event.eventType],
    event.eventDateLabel,
    event.location,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/assistir/${event.privateSlug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-hairline bg-surface transition duration-300 ease-out hover:border-brass/40 focus-visible:border-brass/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brass/50 motion-safe:hover:-translate-y-1"
    >
      <div className="relative aspect-video w-full overflow-hidden">
        {event.coverUrl ? (
          <Image
            src={event.coverUrl}
            alt={`Capa de ${event.title}`}
            fill
            unoptimized
            sizes="(min-width: 1024px) 32vw, (min-width: 640px) 48vw, 100vw"
            className="object-cover transition-transform duration-[450ms] ease-out group-hover:scale-[1.035] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              backgroundImage: [
                "radial-gradient(120% 85% at 18% 12%, rgba(216,189,147,0.18), transparent 60%)",
                "radial-gradient(130% 120% at 80% 95%, rgba(120,88,58,0.30), transparent 55%)",
                "linear-gradient(160deg, #1d1712 0%, #0c0a08 100%)",
              ].join(","),
            }}
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink/70 to-transparent" />
      </div>
      <div className="flex flex-col gap-1.5 p-5">
        <h2 className="font-display text-xl font-light leading-tight text-bone">
          {event.title}
        </h2>
        {meta ? (
          <p className="text-xs uppercase tracking-[0.18em] text-bone-dim">
            {meta}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export default async function ClientLibraryPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { token } = await params;
  const library = await getClientLibraryByToken(token);

  if (!library) {
    notFound();
  }

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 sm:px-8 sm:py-24 2xl:max-w-[88rem]">
      <div className="flex flex-col gap-12">
        <header data-reveal-stagger className="flex max-w-2xl flex-col gap-4">
          <span className="text-xs uppercase tracking-[0.32em] text-brass">
            Felipe &amp; Tamires Films
          </span>
          <h1 className="font-display font-light leading-[1.05] text-bone [font-size:clamp(2.25rem,5vw,4rem)]">
            {library.clientName}
          </h1>
          <p className="text-sm leading-relaxed text-bone-dim sm:text-base">
            Suas histórias — um espaço para voltar a esses dias sempre que
            quiserem.
          </p>
        </header>

        {library.events.length === 0 ? (
          <p className="rounded-xl border border-hairline bg-surface p-8 text-sm leading-relaxed text-bone-dim">
            Seus filmes ainda não estão disponíveis. Assim que estiverem,
            aparecem aqui.
          </p>
        ) : (
          <div
            data-reveal-stagger
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {library.events.map((event) => (
              <LibraryCard key={event.privateSlug} event={event} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
