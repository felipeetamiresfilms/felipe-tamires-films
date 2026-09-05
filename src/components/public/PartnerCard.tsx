import Image from "next/image";
import Link from "next/link";
import type { PublicPartnerCard } from "@/lib/curadoria";

/**
 * Card de parceiro da curadoria pública. Server Component — mesma linguagem
 * visual do `EventCard`, mas sem parecer que o parceiro é um filme (sem meta
 * de tipo/data — categoria e localização).
 */
export function PartnerCard({
  partner,
  className = "",
}: {
  partner: PublicPartnerCard;
  className?: string;
}) {
  return (
    <Link
      href={`/recomendamos/${partner.slug}`}
      className={`group flex flex-col overflow-hidden rounded-xl border border-hairline bg-surface transition duration-300 ease-out hover:border-brass/40 focus-visible:border-brass/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brass/50 motion-safe:hover:-translate-y-1 ${className}`}
    >
      <div className="relative aspect-video w-full overflow-hidden">
        {partner.coverUrl ? (
          <Image
            src={partner.coverUrl}
            alt={`Foto de ${partner.name}`}
            fill
            unoptimized
            sizes="(min-width: 1024px) 24vw, (min-width: 640px) 48vw, 100vw"
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
          {partner.name}
        </h3>
        {partner.location ? (
          <p className="text-xs uppercase tracking-[0.18em] text-bone-dim">
            {partner.location}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
