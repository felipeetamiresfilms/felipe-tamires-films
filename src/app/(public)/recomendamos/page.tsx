import type { Metadata } from "next";
import { listCurationCategories } from "@/lib/curadoria";
import { PartnerCard } from "@/components/public/PartnerCard";

// Lê a curadoria ao vivo (service_role) — renderiza a cada request, sem
// snapshot em build. Mesma estratégia de /filmes.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recomendamos",
  description:
    "Profissionais e lugares que a Felipe & Tamires Films conhece, confia e recomenda para o seu evento.",
  alternates: { canonical: "/recomendamos" },
  openGraph: {
    title: "Recomendamos | Felipe & Tamires Films",
    description:
      "Profissionais e lugares que a Felipe & Tamires Films conhece, confia e recomenda para o seu evento.",
    type: "website",
  },
};

export default async function RecomendamosPage() {
  const categories = await listCurationCategories();

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 sm:px-8 sm:py-24 2xl:max-w-[88rem]">
      <div className="flex flex-col gap-16">
        <header data-reveal-stagger className="flex max-w-2xl flex-col gap-4">
          <span className="text-xs uppercase tracking-[0.32em] text-brass">
            Nossa Curadoria
          </span>
          <h1 className="font-display font-light leading-[1.05] text-bone [font-size:clamp(2.25rem,5vw,4rem)]">
            Profissionais e lugares que recomendamos.
          </h1>
          <p className="max-w-prose text-sm leading-relaxed text-bone-dim sm:text-base">
            Uma seleção de pessoas, equipes e lugares com quem gostamos de
            trabalhar, em quem confiamos e que fazem diferença na experiência
            de um evento.
          </p>
        </header>

        {categories.length === 0 ? (
          <p className="rounded-xl border border-hairline bg-surface p-8 text-sm leading-relaxed text-bone-dim">
            Em breve, nossa curadoria de profissionais e lugares por aqui.
          </p>
        ) : (
          <div className="flex flex-col gap-14">
            {categories.map((category) => (
              <section key={category.slug} className="flex flex-col gap-5">
                <h2
                  data-reveal="up"
                  className="text-xs uppercase tracking-[0.32em] text-brass"
                >
                  {category.name}
                </h2>
                <div
                  data-reveal-stagger
                  className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {category.partners.map((partner) => (
                    <PartnerCard key={partner.slug} partner={partner} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
