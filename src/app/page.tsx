import Image from "next/image";
import Link from "next/link";
import { getPortfolioHome, type PublicPortfolioCard } from "@/lib/portfolio";
import { eventTypeLabels } from "@/lib/labels";
import { formatEventDate } from "@/lib/format";
import { Wordmark } from "@/components/ui/Wordmark";
import { EventCard } from "@/components/public/EventCard";

// Lê o portfólio ao vivo (service_role) e assina URLs de capa — renderiza
// a cada request, sem snapshot em build. Zero iframe: só imagens.
export const dynamic = "force-dynamic";

const primaryCta =
  "inline-flex items-center gap-3 rounded-full bg-brass px-7 py-3.5 text-sm font-medium uppercase tracking-[0.22em] text-ink transition-colors hover:bg-brass-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/60";
const ghostCta =
  "inline-flex items-center gap-3 rounded-full border border-brass/50 px-7 py-3.5 text-sm font-medium uppercase tracking-[0.22em] text-bone transition-colors hover:border-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/60";

// Largura do card nas fileiras: mostra o próximo card "espiando" no mobile,
// cresce por breakpoint até telas grandes (não fica minúsculo no 4K).
const rowCard =
  "flex-none snap-start w-[78vw] sm:w-[44vw] md:w-[19rem] lg:w-[21rem] xl:w-[23rem] 2xl:w-[25rem]";

function AbstractBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0"
      style={{
        backgroundImage: [
          "radial-gradient(90% 60% at 20% 0%, rgba(216,189,147,0.16), transparent 60%)",
          "radial-gradient(120% 120% at 90% 100%, rgba(120,88,58,0.28), transparent 55%)",
          "linear-gradient(180deg, #14100c 0%, #0a0908 100%)",
        ].join(","),
      }}
    />
  );
}

function Row({
  id,
  title,
  events,
}: {
  id?: string;
  title: string;
  events: PublicPortfolioCard[];
}) {
  if (events.length === 0) return null;
  return (
    <section id={id} className="flex scroll-mt-10 flex-col gap-5">
      <h2 className="px-6 text-xs uppercase tracking-[0.32em] text-brass sm:px-8">
        {title}
      </h2>
      <div className="flex snap-x gap-4 overflow-x-auto px-6 pb-3 pr-10 sm:px-8 sm:pr-12 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {events.map((event) => (
          <EventCard
            key={event.publicSlug}
            event={event}
            className={rowCard}
          />
        ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const { hero, spotlight, categories, recent } = await getPortfolioHome();
  const showRecent = recent.length >= 2;
  const hasCatalog =
    spotlight.length > 0 || categories.length > 0 || showRecent;

  const heroMeta = hero
    ? [
        eventTypeLabels[hero.eventType],
        hero.eventDate ? formatEventDate(hero.eventDate) : null,
        hero.location,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  const categoryAnchor: Record<string, string> = {
    weddings: "casamentos",
    debuts: "quinze-anos",
    events: "eventos",
  };

  return (
    <div className="flex flex-1 flex-col">
      {hero ? (
        /* --- Hero com evento destacado --- */
        <section className="relative isolate flex min-h-[70svh] items-end overflow-hidden border-b border-hairline lg:min-h-[76vh]">
          {hero.coverUrl ? (
            <>
              <Image
                src={hero.coverUrl}
                alt={`Capa de ${hero.title}`}
                fill
                priority
                unoptimized
                sizes="100vw"
                className="object-cover"
              />
              {/* overlays sutis — fotografia continua protagonista */}
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/5" />
              <div className="absolute inset-0 bg-gradient-to-r from-ink/55 via-ink/10 to-transparent" />
            </>
          ) : (
            <AbstractBackdrop />
          )}

          <div className="relative mx-auto w-full max-w-6xl px-6 py-14 sm:px-8 sm:py-16 2xl:max-w-[88rem]">
            <div className="flex max-w-2xl flex-col gap-4">
              <span className="text-xs uppercase tracking-[0.32em] text-brass">
                Em destaque
              </span>
              <h1 className="font-display font-light leading-[1.03] text-bone [font-size:clamp(2.25rem,6vw,5rem)]">
                {hero.title}
              </h1>
              {heroMeta ? (
                <p className="text-sm uppercase tracking-[0.2em] text-bone-dim sm:text-base">
                  {heroMeta}
                </p>
              ) : null}
              {hero.description ? (
                <p className="line-clamp-3 max-w-xl text-sm leading-relaxed text-bone-dim sm:text-base">
                  {hero.description}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href={`/filmes/${hero.publicSlug}`} className={primaryCta}>
                  <span aria-hidden="true" className="text-base leading-none">
                    ▶
                  </span>
                  Conhecer esta história
                </Link>
                <Link href={`/filmes/${hero.publicSlug}`} className={ghostCta}>
                  Ver detalhes
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* --- Hero institucional (nenhum evento destacado) --- */
        <section className="relative isolate flex min-h-[68svh] items-center justify-center overflow-hidden border-b border-hairline lg:min-h-[72vh]">
          <AbstractBackdrop />
          <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-7 px-6 py-16 text-center sm:px-8">
            <Wordmark size="lg" />
            <h1 className="font-display font-light leading-[1.05] tracking-[-0.01em] text-bone [font-size:clamp(2.5rem,7vw,5rem)]">
              Seus momentos.
              <br />
              <span className="italic text-brass-soft">Seus filmes.</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-bone-dim sm:text-lg">
              Casamentos, 15 anos e eventos transformados em cinema — para
              reviver quantas vezes quiser.
            </p>
            <Link href="/filmes" className={ghostCta}>
              Explorar nossos filmes
            </Link>
          </div>
        </section>
      )}

      {/* --- Catálogo em fileiras --- */}
      {hasCatalog ? (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 py-14 sm:gap-16 sm:py-16 2xl:max-w-[88rem]">
          <Row title="Em destaque" events={spotlight} />

          {categories.map((category) => (
            <Row
              key={category.key}
              id={categoryAnchor[category.key]}
              title={category.label}
              events={category.events}
            />
          ))}

          {showRecent ? (
            <Row title="Histórias recentes" events={recent} />
          ) : null}

          <div className="flex flex-col items-center gap-4 px-6 pt-4 text-center sm:px-8">
            <p className="font-display font-light italic text-brass-soft [font-size:clamp(1.35rem,2.4vw,2rem)]">
              Casamentos · 15 Anos · Eventos
            </p>
            <Link
              href="/filmes"
              className="rounded-full border border-brass/50 px-7 py-3 text-sm font-medium uppercase tracking-[0.22em] text-bone transition-colors hover:border-brass"
            >
              Ver todos os filmes
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
