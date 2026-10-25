import Link from "next/link";
import { WhatsAppCTA } from "./WhatsAppCTA";
import { ctaSecondaryClass } from "./cta";

/**
 * Bloco de conversão reutilizável (fim da home, de /filmes e da página
 * pública de um evento). É um convite para conversar — não um orçamento
 * automático. Server Component. Painel emoldurado (não full-bleed) para
 * encaixar em qualquer coluna de conteúdo.
 */
export function ContactBanner({
  eyebrow,
  title,
  text,
  message,
  ctaLabel,
  contactLocation,
  secondary,
  note,
}: {
  eyebrow?: string;
  title: string;
  text: string;
  message: string;
  ctaLabel: string;
  /** Ponto de contato do `contact_click` (ex.: "home_final_cta"). */
  contactLocation: string;
  secondary?: { label: string; href: string };
  /** Linha de apoio discreta abaixo dos botões (ex.: região atendida). */
  note?: string;
}) {
  return (
    <section
      data-reveal="soft"
      className="rounded-2xl border border-hairline bg-surface/40 px-6 py-14 sm:px-10 sm:py-16"
    >
      <div
        data-reveal-stagger
        className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center"
      >
        {eyebrow ? (
          <p className="text-xs uppercase tracking-[0.32em] text-brass">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-balance font-display font-light leading-[1.1] text-bone [font-size:clamp(1.75rem,4vw,2.75rem)]">
          {title}
        </h2>
        <p className="max-w-prose text-sm leading-relaxed text-bone-dim sm:text-base">
          {text}
        </p>
        <div className="flex w-full max-w-sm flex-col items-stretch gap-3 pt-2 sm:w-auto sm:max-w-none sm:flex-row sm:items-center">
          <WhatsAppCTA
            message={message}
            label={ctaLabel}
            contactLocation={contactLocation}
            variant="primary"
          />
          {secondary ? (
            <Link href={secondary.href} className={ctaSecondaryClass}>
              {secondary.label}
            </Link>
          ) : null}
        </div>
        {note ? (
          <p className="max-w-md text-balance text-xs leading-relaxed text-bone-dim">
            {note}
          </p>
        ) : null}
      </div>
    </section>
  );
}
