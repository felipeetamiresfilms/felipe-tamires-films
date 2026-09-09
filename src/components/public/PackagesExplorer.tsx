"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { packageWhatsAppMessage } from "@/config/site";
import {
  DURATION_NOTE,
  EXAMPLE_FILM_BLOCK,
  FEATURED_BADGE,
  FEATURED_TIER,
  PACKAGE_EVENT_TYPES,
  PACKAGES_BY_EVENT,
  PHOTO_EDITORIAL,
  TIER_CTA_LABEL,
  type PackageDef,
  type PackageEventMeta,
  type PackageEventType,
} from "@/config/packages";
import { WhatsAppCTA } from "./WhatsAppCTA";
import { ctaSecondaryClass } from "./cta";

/**
 * Página `/pacotes` — parte interativa (Client Component).
 *
 * Fluxo: intro → pergunta "Que evento você está planejando?" → escolha de
 * um tipo de evento → só os pacotes daquela categoria aparecem abaixo.
 *
 * A seleção é um `radiogroup` de verdade (setas / Home / End, roving
 * tabindex, `aria-checked`), com estado indicado por selo + contorno +
 * anel — nunca só por cor. A troca de categoria remonta o painel
 * (`key={selected}`) e a animação de entrada vive no CSS, atrás de
 * `prefers-reduced-motion` (classe `.pkg-swap` em `globals.css`).
 *
 * `initialEvent` vem do parâmetro `?evento=` (lido e validado no Server
 * Component da página). Ao trocar de categoria manualmente, a querystring
 * é sincronizada com `history.replaceState` — sem navegação, sem refetch,
 * sem scroll inesperado.
 */
export function PackagesExplorer({
  initialEvent = null,
}: {
  initialEvent?: PackageEventType | null;
}) {
  const headingId = useId();
  const [selected, setSelected] = useState<PackageEventType | null>(initialEvent);
  const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function selectEvent(id: PackageEventType) {
    setSelected(id);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `/pacotes?evento=${id}`);
    }
  }

  function isTabStop(index: number) {
    return selected === null
      ? index === 0
      : PACKAGE_EVENT_TYPES[index].id === selected;
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const count = PACKAGE_EVENT_TYPES.length;
    let target: number;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        target = (index + 1) % count;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        target = (index - 1 + count) % count;
        break;
      case "Home":
        target = 0;
        break;
      case "End":
        target = count - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    selectEvent(PACKAGE_EVENT_TYPES[target].id);
    btnRefs.current[target]?.focus();
  }

  return (
    <div className="flex flex-col gap-10">
      <h2
        id={headingId}
        className="font-display font-light leading-[1.1] text-bone [font-size:clamp(1.6rem,3.5vw,2.4rem)]"
      >
        Que evento você está planejando?
      </h2>

      <div
        role="radiogroup"
        aria-labelledby={headingId}
        className="mx-auto grid w-full max-w-md grid-cols-1 gap-4 sm:max-w-none sm:grid-cols-3"
      >
        {PACKAGE_EVENT_TYPES.map((meta, index) => (
          <EventTypeCard
            key={meta.id}
            meta={meta}
            checked={selected === meta.id}
            tabStop={isTabStop(index)}
            onSelect={() => selectEvent(meta.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            buttonRef={(el) => {
              btnRefs.current[index] = el;
            }}
          />
        ))}
      </div>

      <div>
        {selected === null ? (
          <p className="text-sm text-bone-dim/70">
            Escolha o tipo de evento para ver os pacotes.
          </p>
        ) : (
          <div key={selected} className="pkg-swap flex flex-col gap-12">
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-[0.32em] text-brass">
                {eventLabel(selected)} · três caminhos
              </p>
              <p className="max-w-prose text-sm leading-relaxed text-bone-dim">
                Os níveis se somam: o Essência cobre os momentos principais, o
                Memória amplia a cobertura e o Experiência guarda a história
                inteira, sem precisar escolher o que fica de fora.
              </p>
            </div>

            <ol className="grid list-none grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch">
              {PACKAGES_BY_EVENT[selected].map((pkg) => (
                <li key={pkg.tier} className="flex">
                  <PackageCard
                    pkg={pkg}
                    eventNoun={eventNoun(selected)}
                    featured={pkg.tier === FEATURED_TIER}
                  />
                </li>
              ))}
            </ol>

            <p className="max-w-prose text-xs leading-relaxed text-bone-dim/80">
              {DURATION_NOTE}
            </p>

            {selected === "aniversario" ? <PhotographyNote /> : null}

            <ExampleFilm meta={metaFor(selected)} />
          </div>
        )}
      </div>
    </div>
  );
}

function metaFor(id: PackageEventType): PackageEventMeta {
  return PACKAGE_EVENT_TYPES.find((e) => e.id === id) ?? PACKAGE_EVENT_TYPES[0];
}

function eventLabel(id: PackageEventType) {
  return metaFor(id).label;
}

function eventNoun(id: PackageEventType) {
  return metaFor(id).whatsappNoun;
}

function EventTypeCard({
  meta,
  checked,
  tabStop,
  onSelect,
  onKeyDown,
  buttonRef,
}: {
  meta: PackageEventMeta;
  checked: boolean;
  tabStop: boolean;
  onSelect: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  buttonRef: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      role="radio"
      aria-checked={checked}
      tabIndex={tabStop ? 0 : -1}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={`group relative flex aspect-[16/10] min-h-[9rem] w-full min-w-0 flex-col justify-end overflow-hidden rounded-2xl border p-5 text-left transition duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink motion-safe:hover:-translate-y-1 sm:aspect-[3/4] ${
        checked
          ? "border-brass ring-2 ring-brass"
          : "border-hairline hover:border-brass/40"
      }`}
    >
      {meta.image ? (
        <Image
          src={meta.image}
          alt=""
          fill
          sizes="(min-width: 640px) 30vw, 100vw"
          className="absolute inset-0 -z-10 object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{ backgroundImage: meta.fallbackGradient }}
        />
      )}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-ink/90 via-ink/45 to-transparent"
      />

      {checked ? (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-brass px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-ink">
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className="h-3 w-3 fill-current"
          >
            <path d="M7.6 13.3 4.3 10l-1.2 1.2 4.5 4.5 9-9L15.4 5.5z" />
          </svg>
          Selecionado
        </span>
      ) : null}

      <span className="relative flex flex-col gap-1">
        <span className="font-display text-xl font-light text-bone">
          {meta.label}
        </span>
        <span className="text-xs leading-relaxed text-bone-dim">
          {meta.hint}
        </span>
      </span>
    </button>
  );
}

function PackageCard({
  pkg,
  eventNoun,
  featured,
}: {
  pkg: PackageDef;
  eventNoun: string;
  featured: boolean;
}) {
  return (
    <article
      className={`flex h-full w-full min-w-0 flex-col gap-5 rounded-2xl border p-6 sm:p-7 ${
        featured
          ? "border-brass/55 bg-raised/70 shadow-[0_30px_90px_-45px_rgba(195,160,106,0.5)] sm:p-8 lg:-translate-y-4"
          : "border-hairline bg-surface/50"
      }`}
    >
      {featured ? (
        <span className="inline-flex self-start rounded-full border border-brass/40 bg-brass/10 px-3 py-1 text-[0.62rem] font-medium uppercase tracking-[0.22em] text-brass-soft">
          {FEATURED_BADGE}
        </span>
      ) : null}

      <header className="flex flex-col gap-2">
        <h3
          className={`font-display font-light leading-tight text-bone ${
            featured ? "text-[1.9rem]" : "text-2xl"
          }`}
        >
          {pkg.name}
        </h3>
        <p className="text-sm leading-relaxed text-bone-dim">{pkg.concept}</p>
      </header>

      {pkg.buildsOn ? (
        <p className="text-[0.7rem] uppercase tracking-[0.24em] text-brass/85">
          {pkg.buildsOn}
        </p>
      ) : null}

      <div className="border-t border-hairline" />

      <ul className="flex flex-col gap-2.5 text-sm leading-relaxed text-bone-dim">
        {pkg.deliverables.map((item) => (
          <li key={item} className="flex gap-2.5">
            <span
              aria-hidden="true"
              className="mt-[0.6em] h-px w-3 shrink-0 bg-brass/50"
            />
            <span className="min-w-0">{item}</span>
          </li>
        ))}
      </ul>

      <div className="border-t border-hairline" />

      <p className="font-display text-base font-light italic leading-snug text-bone">
        {pkg.closingLine}
      </p>

      <div className="mt-auto pt-2">
        <WhatsAppCTA
          message={packageWhatsAppMessage(eventNoun, pkg.name)}
          label={TIER_CTA_LABEL[pkg.tier]}
          variant={featured ? "primary" : "secondary"}
          className="w-full"
        />
      </div>
    </article>
  );
}

function PhotographyNote() {
  return (
    <section className="rounded-2xl border border-hairline bg-surface/40 px-6 py-10 sm:px-9 sm:py-12">
      <div className="flex max-w-2xl flex-col gap-4">
        <p className="text-xs uppercase tracking-[0.32em] text-brass">
          {PHOTO_EDITORIAL.eyebrow}
        </p>
        <h3 className="font-display text-2xl font-light leading-snug text-bone">
          {PHOTO_EDITORIAL.title}
        </h3>
        {PHOTO_EDITORIAL.body.map((paragraph) => (
          <p
            key={paragraph}
            className="text-sm leading-relaxed text-bone-dim sm:text-base"
          >
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}

/**
 * "Veja como essa história ganha vida." — área editorial centralizada, FORA
 * dos cards de pacote, depois da nota de duração. Muda o rótulo do botão com
 * a categoria selecionada.
 *
 * O bloco sempre aparece (útil para validar o layout). Enquanto
 * `exampleFilmHref` for `null`, o botão é um `<button disabled>` — sem link,
 * sem navegação, com uma indicação MUITO sutil ("Filme em configuração").
 * Quando Felipe configurar o href (rota pública `/filmes/[publicSlug]`), o
 * botão vira `<Link>` normal e a indicação some — sem outra mudança.
 */
function ExampleFilm({ meta }: { meta: PackageEventMeta }) {
  return (
    <section className="flex flex-col items-center gap-4 border-t border-hairline px-6 py-14 text-center sm:py-16">
      <p className="text-xs uppercase tracking-[0.32em] text-brass">
        {EXAMPLE_FILM_BLOCK.eyebrow}
      </p>
      <h3 className="max-w-xl font-display text-2xl font-light leading-snug text-bone sm:text-[1.75rem]">
        {EXAMPLE_FILM_BLOCK.title}
      </h3>
      <p className="max-w-md text-sm leading-relaxed text-bone-dim sm:text-base">
        {EXAMPLE_FILM_BLOCK.text}
      </p>

      <div className="flex w-full max-w-sm flex-col items-center gap-2 pt-2">
        {meta.exampleFilmHref ? (
          <Link
            href={meta.exampleFilmHref}
            className={`${ctaSecondaryClass} w-full`}
          >
            {meta.exampleFilmLabel}
          </Link>
        ) : (
          <>
            <button
              type="button"
              disabled
              aria-disabled="true"
              className={`${ctaSecondaryClass} w-full cursor-not-allowed opacity-45`}
            >
              {meta.exampleFilmLabel}
            </button>
            <span className="text-[0.65rem] uppercase tracking-[0.24em] text-bone-dim/50">
              {EXAMPLE_FILM_BLOCK.pendingHint}
            </span>
          </>
        )}
      </div>
    </section>
  );
}
