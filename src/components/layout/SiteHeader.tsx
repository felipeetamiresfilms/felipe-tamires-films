import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";
import { WhatsAppCTA } from "@/components/public/WhatsAppCTA";
import { WHATSAPP_MESSAGES } from "@/config/site";

/**
 * Cabeçalho público. Navegação enxuta: descobrir os filmes e um ponteiro
 * (ainda inerte) para a entrega privada — que hoje só abre pelo link que a
 * produtora envia, sem login de cliente.
 */
export function SiteHeader() {
  return (
    <header className="w-full border-b border-hairline/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-5 sm:px-8 2xl:max-w-[88rem]">
        <Link
          href="/"
          className="rounded-sm outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-brass/70"
          aria-label="Felipe & Tamires Films — página inicial"
        >
          <Wordmark />
        </Link>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs uppercase tracking-[0.24em]">
          <Link
            href="/filmes"
            className="nav-underline text-bone-dim transition-colors hover:text-bone"
          >
            Filmes
          </Link>
          <Link
            href="/recomendamos"
            className="nav-underline text-bone-dim transition-colors hover:text-bone"
          >
            Recomendamos
          </Link>
          <Link
            href="/#casamentos"
            className="nav-underline hidden text-bone-dim transition-colors hover:text-bone sm:inline"
          >
            Casamentos
          </Link>
          <Link
            href="/#quinze-anos"
            className="nav-underline hidden text-bone-dim transition-colors hover:text-bone sm:inline"
          >
            15 anos
          </Link>
          <WhatsAppCTA
            variant="link"
            message={WHATSAPP_MESSAGES.header}
            label="Falar conosco"
            className="text-brass-soft transition-colors hover:text-brass"
          />
          <span
            className="cursor-default text-bone-dim/45"
            title="Acesse pelo link privado que a Felipe & Tamires Films envia para você — não há login."
          >
            Acessar meus filmes
          </span>
        </nav>
      </div>
    </header>
  );
}
