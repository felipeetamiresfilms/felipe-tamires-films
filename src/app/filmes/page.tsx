import type { Metadata } from "next";
import Link from "next/link";
import { listPortfolioEvents } from "@/lib/portfolio";
import { EventCard } from "@/components/public/EventCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Filmes",
  description:
    "Histórias de casamentos, 15 anos e eventos que a Felipe & Tamires Films teve o privilégio de filmar.",
  alternates: { canonical: "/filmes" },
  openGraph: {
    title: "Filmes | Felipe & Tamires Films",
    description:
      "Histórias de casamentos, 15 anos e eventos que a Felipe & Tamires Films teve o privilégio de filmar.",
    type: "website",
  },
};

export default async function FilmesPage() {
  const events = await listPortfolioEvents();

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 sm:px-8 sm:py-24 2xl:max-w-[88rem]">
      <div className="flex flex-col gap-12">
        <header className="flex max-w-2xl flex-col gap-4">
          <span className="text-xs uppercase tracking-[0.32em] text-brass">
            Felipe &amp; Tamires Films
          </span>
          <h1 className="font-display font-light leading-[1.05] text-bone [font-size:clamp(2.25rem,5vw,4rem)]">
            Histórias que tivemos o privilégio de contar
          </h1>
        </header>

        {events.length === 0 ? (
          <p className="rounded-xl border border-hairline bg-surface p-8 text-sm leading-relaxed text-bone-dim">
            Em breve, nossos filmes aqui. Enquanto isso, fale com a gente para
            conhecer o trabalho.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.publicSlug} event={event} />
            ))}
          </div>
        )}

        <p className="text-sm text-bone-dim">
          Recebeu um link privado do seu filme?{" "}
          <Link
            href="/"
            className="text-bone underline decoration-hairline underline-offset-4 transition-colors hover:decoration-brass"
          >
            Abra o endereço que enviamos para você
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
