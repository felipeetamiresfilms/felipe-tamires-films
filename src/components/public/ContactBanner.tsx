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
  secondary,
}: {
  eyebrow?: string;
  title: string;
  text: string;
  message: string;
  ctaLabel: string;
  secondary?: { label: string; href: string };
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
        <h2 className="font-display font-light leading-[1.1] text-bone [font-size:clamp(1.75rem,4vw,2.75rem)]">
          {title}
        </h2>
        <p className="max-w-prose text-sm leading-relaxed text-bone-dim sm:text-base">
          {text}
        </p>
        <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row">
          <WhatsAppCTA message={message} label={ctaLabel} variant="primary" />
          {secondary ? (
            <Link href={secondary.href} className={ctaSecondaryClass}>
              {secondary.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
