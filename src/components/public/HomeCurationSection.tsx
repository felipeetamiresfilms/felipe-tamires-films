import Link from "next/link";
import { getFeaturedPartners } from "@/lib/curadoria";
import { PartnerCard } from "./PartnerCard";
import { ctaSecondaryClass } from "./cta";

/**
 * "Nossa Curadoria" na home — só aparece com parceiros featured e publicados
 * (seção 24 do briefing). Sem featured -> sem seção. Discreta e pequena: os
 * filmes continuam sendo o produto principal da home.
 */
export async function HomeCurationSection() {
  const partners = await getFeaturedPartners(4);
  if (partners.length === 0) return null;

  return (
    <section data-reveal="soft" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.32em] text-brass">
            Nossa Curadoria
          </p>
          <h2 className="font-display text-2xl font-light text-bone sm:text-3xl">
            Profissionais e lugares que recomendamos.
          </h2>
        </div>
        <Link href="/recomendamos" className={ctaSecondaryClass}>
          Ver nossa curadoria
        </Link>
      </div>
      <div data-reveal-stagger className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {partners.map((partner) => (
          <PartnerCard key={partner.slug} partner={partner} />
        ))}
      </div>
    </section>
  );
}
