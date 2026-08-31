import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";

/**
 * Entrega privada: `/assistir/[slug]`.
 * Sem header comercial — só a marca, discreta. O cliente já contratou o
 * serviço e entra no espaço privado dos próprios filmes. Nenhum CTA aqui.
 */
export default function AssistirLayout({
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
