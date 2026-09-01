import Image from "next/image";
import Link from "next/link";
import { eventTypeLabels } from "@/lib/labels";
import { formatEventDate } from "@/lib/format";
import type { PublicPortfolioCard } from "@/lib/portfolio";

/**
 * Card de evento do portfólio público. Server Component — sem JS.
 * A capa é uma signed URL do Supabase (com `?token=`), então usa
 * `next/image unoptimized` (o otimizador não casa querystring dinâmica).
 * Sem capa -> fallback cinematográfico só com CSS.
 */
export function EventCard({
  event,
  className = "",
}: {
  event: PublicPortfolioCard;
  /** Extra utilities — ex.: largura fixa numa fileira horizontal da home. */
  className?: string;
}) {
  const meta = [
    eventTypeLabels[event.eventType],
    event.eventDate ? formatEventDate(event.eventDate) : event.location,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/filmes/${event.publicSlug}`}
      className={`group flex flex-col overflow-hidden rounded-xl border border-hairline bg-surface transition duration-300 ease-out hover:border-brass/40 focus-visible:border-brass/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brass/50 motion-safe:hover:-translate-y-1 ${className}`}
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
            className="absolute inset-0"
            style={{
              backgroundImage: [
                "radial-gradient(120% 85% at 18% 12%, rgba(216,189,147,0.18), transparent 60%)",
                "radial-gradient(130% 120% at 80% 95%, rgba(120,88,58,0.30), transparent 55%)",
                "linear-gradient(160deg, #1d1712 0%, #0c0a08 100%)",
              ].join(","),
            }}
            aria-hidden="true"
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink/70 to-transparent" />
      </div>

      <div className="flex flex-col gap-1.5 p-5">
        <h3 className="font-display text-xl font-light leading-tight text-bone">
          {event.title}
        </h3>
        {meta ? (
          <p className="text-xs uppercase tracking-[0.18em] text-bone-dim">
            {meta}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
