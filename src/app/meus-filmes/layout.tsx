import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";

/**
 * Biblioteca privada do cliente: `/meus-filmes/[token]`.
 * Mesma filosofia de `/assistir/[slug]`: só a marca, discreta. Sem navegação
 * comercial, sem CTA de venda, sem link para o backstage.
 */
export default function MeusFilmesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="w-full border-b border-hairline/60">
        <div className="mx-auto flex max-w-6xl items-center px-6 py-5 sm:px-8 2xl:max-w-[88rem]">
          <Link
            href="/"
            aria-label="Felipe & Tamires Films"
            className="rounded-sm outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-brass/70"
          >
            <Wordmark />
          </Link>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  );
}
