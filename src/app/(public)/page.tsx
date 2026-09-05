import { Fragment } from "react";
import Link from "next/link";
import { getPortfolioHome, type PublicPortfolioCard } from "@/lib/portfolio";
import { eventTypeLabels } from "@/lib/labels";
import { formatEventDate } from "@/lib/format";
import {
  WHATSAPP_MESSAGES,
  heroFeaturedWhatsAppMessage,
} from "@/config/site";
import { Wordmark } from "@/components/ui/Wordmark";
import { EventCard } from "@/components/public/EventCard";
import { WhatsAppCTA } from "@/components/public/WhatsAppCTA";
import { HeroBackdropVideo } from "@/components/public/HeroBackdropVideo";
import { HomeValueSection } from "@/components/public/HomeValueSection";
import { HomeAboutSection } from "@/components/public/HomeAboutSection";
import { HomeCurationSection } from "@/components/public/HomeCurationSection";
import { ContactBanner } from "@/components/public/ContactBanner";
import { ctaPrimaryClass } from "@/components/public/cta";

// Lê o portfólio ao vivo (service_role) e assina URLs de capa — renderiza
// a cada request, sem snapshot em build. Zero iframe: só imagens.
export const dynamic = "force-dynamic";

// Largura do card nas fileiras: mostra o próximo card "espiando" no mobile,
// cresce por breakpoint até telas grandes (não fica minúsculo no 4K).
const rowCard =
  "flex-none snap-start w-[78vw] sm:w-[44vw] md:w-[19rem] lg:w-[21rem] xl:w-[23rem] 2xl:w-[25rem]";

const CATEGORY_ANCHOR: Record<string, string> = {
  weddings: "casamentos",
  debuts: "quinze-anos",
  events: "eventos",
};

function AbstractBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="cine-breathe absolute inset-0"
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

type RowSpec = { key: string; id?: string; title: string; events: PublicPortfolioCard[] };

function Row({ id, title, events }: Omit<RowSpec, "key">) {
  if (events.length === 0) return null;
  return (
    <section id={id} className="flex scroll-mt-10 flex-col gap-5">
      <h2
        data-reveal="up"
        className="text-xs uppercase tracking-[0.32em] text-brass"
      >
        {title}
      </h2>
      {/* fileira sangra até a borda da coluna e volta a alinhar no 1º card */}
      <div
        data-reveal-stagger
        className="edge-fade-x cine-row -mx-6 flex snap-x gap-4 overflow-x-auto px-6 pb-3 pr-10 pt-2 sm:-mx-8 sm:px-8 sm:pr-12 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {events.map((event) => (
          <EventCard key={event.publicSlug} event={event} className={rowCard} />
        ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const { hero, spotlight, categories, recent } = await getPortfolioHome();

  const rows: RowSpec[] = [
    ...(spotlight.length
      ? [{ key: "spotlight", title: "Em destaque", events: spotlight }]
      : []),
    ...categories.map((c) => ({
      key: c.key,
      id: CATEGORY_ANCHOR[c.key],
      title: c.label,
      events: c.events,
    })),
    ...(recent.length >= 2
      ? [{ key: "recent", title: "Histórias recentes", events: recent }]
      : []),
  ];

  const heroMeta = hero
    ? [
        eventTypeLabels[hero.eventType],
        hero.eventDate ? formatEventDate(hero.eventDate) : null,
        hero.location,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <div className="flex flex-1 flex-col">
      {hero ? (
        /* --- Hero com evento destacado --- */
        <section className="relative isolate flex min-h-[70svh] items-end overflow-hidden border-b border-hairline lg:min-h-[76vh]">
          {/* hero em vídeo (local — public/videos/hero.mp4) */}
          <AbstractBackdrop />
          <HeroBackdropVideo />
          {/* overlays sutis — texto legível sobre o vídeo */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/5" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/55 via-ink/10 to-transparent" />

          {/* costura hero -> catálogo */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-ink"
          />

          <div className="relative mx-auto w-full max-w-6xl px-6 py-14 sm:px-8 sm:py-16 2xl:max-w-[88rem]">
            <div className="cine-stack flex max-w-2xl flex-col gap-4">
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
              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
                <Link
                  href={`/filmes/${hero.publicSlug}`}
                  className={ctaPrimaryClass}
                >
                  <span
                    aria-hidden="true"
                    className="text-base leading-none transition-transform duration-300 ease-out motion-safe:group-hover:translate-x-[2px]"
                  >
                    ▶
                  </span>
                  Conhecer esta história
                </Link>
                <WhatsAppCTA
                  message={heroFeaturedWhatsAppMessage(hero.title)}
                  label="Quero um filme assim"
                  variant="secondary"
                />
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* --- Hero institucional (nenhum evento destacado) --- */
        <section className="relative isolate flex min-h-[68svh] items-center justify-center overflow-hidden border-b border-hairline lg:min-h-[72vh]">
          <AbstractBackdrop />
          <HeroBackdropVideo />
          {/* escurece o vídeo para o texto central respirar */}
          <div className="absolute inset-0 bg-ink/55" />
          {/* costura hero -> catálogo */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-ink"
          />
          <div className="cine-stack relative mx-auto flex max-w-3xl flex-col items-center gap-7 px-6 py-16 text-center sm:px-8">
            <Wordmark size="lg" />
            <h1 className="font-display font-light leading-[1.05] tracking-[-0.01em] text-bone [font-size:clamp(2.5rem,7vw,5rem)]">
              <span className="block">Seus momentos.</span>
              <span className="block italic text-brass-soft">Seus filmes.</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-bone-dim sm:text-lg">
              Casamentos, 15 anos e eventos transformados em cinema — para
              reviver quantas vezes quiser.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Link href="/filmes" className={ctaPrimaryClass}>
                Explorar nossos filmes
              </Link>
              <WhatsAppCTA
                message={WHATSAPP_MESSAGES.homeGeneric}
                label="Falar com Felipe & Tamires"
                variant="secondary"
              />
            </div>
          </div>
        </section>
      )}

      {/* --- Catálogo + blocos de conversão --- */}
      <div className="mx-auto w-full max-w-6xl px-6 sm:px-8 2xl:max-w-[88rem]">
        <div className="flex flex-col gap-16 py-16 sm:gap-24 sm:py-24">
          {rows.map((row, i) => (
            <Fragment key={row.key}>
              <Row id={row.id} title={row.title} events={row.events} />
              {i === 0 ? <HomeValueSection /> : null}
            </Fragment>
          ))}
          {rows.length === 0 ? <HomeValueSection /> : null}

          <HomeAboutSection />

          <HomeCurationSection />

          <ContactBanner
            eyebrow="Vamos conversar"
            title="Está planejando o seu evento?"
            text="Conte pra gente o que estão preparando. A gente quer entender a história, o local, a data e o que vocês imaginam para esse dia."
            message={WHATSAPP_MESSAGES.planningEvent}
            ctaLabel="Falar com Felipe & Tamires"
            secondary={{ label: "Ver todos os filmes", href: "/filmes" }}
          />
        </div>
      </div>
    </div>
  );
}
