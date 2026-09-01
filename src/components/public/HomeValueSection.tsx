import Link from "next/link";
import { WHATSAPP_MESSAGES } from "@/config/site";
import { WhatsAppCTA } from "./WhatsAppCTA";
import { ctaSecondaryClass } from "./cta";

const TRAITS = [
  {
    label: "Captação discreta",
    text: "Estamos presentes sem transformar o evento numa produção. A cena continua sendo de vocês.",
  },
  {
    label: "Direção leve",
    text: "Orientamos quando é preciso e saímos do caminho quando a história pede espontaneidade.",
  },
  {
    label: "Edição narrativa",
    text: "Montamos um filme com ritmo, respiro e emoção — não uma sequência cronológica de imagens.",
  },
];

/**
 * Primeiro bloco comercial da home. Composição editorial (não três cards
 * SaaS): título, um parágrafo e três características separadas por filetes.
 */
export function HomeValueSection() {
  return (
    <section aria-label="Como trabalhamos">
      <div className="flex max-w-4xl flex-col gap-10">
        <div data-reveal-stagger className="flex flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.32em] text-brass">
            Mais do que registrar um dia
          </p>
          <h2 className="font-display font-light leading-[1.05] text-bone [font-size:clamp(1.9rem,4.5vw,3.25rem)]">
            Filmes para reviver, não apenas assistir.
          </h2>
          <p className="max-w-prose text-sm leading-relaxed text-bone-dim sm:text-base">
            Um casamento, uma festa de 15 anos ou uma celebração acontece uma
            vez só. Nosso trabalho é transformar o que vocês viveram em um filme
            que faz esse dia acontecer de novo cada vez que apertam o play.
          </p>
        </div>

        <div data-reveal-stagger className="grid gap-8 sm:grid-cols-3 sm:gap-6">
          {TRAITS.map((trait, i) => (
            <div
              key={trait.label}
              className={
                i === 0
                  ? "flex flex-col gap-2"
                  : "relative flex flex-col gap-2 border-t border-hairline pt-6 sm:border-t-0 sm:pl-6 sm:pt-0"
              }
            >
              {i > 0 ? (
                <span
                  aria-hidden="true"
                  data-rule
                  className="pointer-events-none absolute left-0 top-0 hidden h-full w-px bg-hairline sm:block"
                />
              ) : null}
              <h3 className="text-xs uppercase tracking-[0.24em] text-bone">
                {trait.label}
              </h3>
              <p className="text-sm leading-relaxed text-bone-dim">
                {trait.text}
              </p>
            </div>
          ))}
        </div>

        <div data-reveal="up" className="flex flex-col gap-3 sm:flex-row">
          <WhatsAppCTA
            message={WHATSAPP_MESSAGES.howItWorks}
            label="Converse com a gente"
            variant="primary"
          />
          <Link href="/filmes" className={ctaSecondaryClass}>
            Conheça nossos filmes
          </Link>
        </div>
      </div>
    </section>
  );
}
