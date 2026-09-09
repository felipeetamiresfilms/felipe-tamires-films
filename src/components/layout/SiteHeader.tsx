import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";
import { WhatsAppCTA } from "@/components/public/WhatsAppCTA";
import { MobileNav } from "@/components/layout/MobileNav";
import { WHATSAPP_MESSAGES } from "@/config/site";

/** Links da navegação pública — compartilhados entre desktop e menu mobile. */
export const PUBLIC_NAV = [
  { href: "/filmes", label: "Filmes" },
  { href: "/pacotes", label: "Pacotes" },
  { href: "/recomendamos", label: "Recomendamos" },
] as const;

/**
 * Cabeçalho público. Navegação enxuta: Filmes, Pacotes, Recomendamos e o
 * CTA discreto "Falar conosco". No desktop (`>= md`) os links ficam à direita
 * da marca; abaixo disso, um menu hambúrguer (ver `MobileNav`).
 *
 * "Acessar meus filmes" saiu do header — cada cliente recebe o acesso por
 * link privado. Casamentos / 15 anos também saíram: têm caminhos melhores
 * pela Home e por `/pacotes`. Nenhuma rota foi removida.
 */
export function SiteHeader() {
  return (
    <header className="relative w-full border-b border-hairline/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-x-6 px-6 py-5 sm:px-8 2xl:max-w-[88rem]">
        <Link
          href="/"
          className="rounded-sm outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-brass/70"
          aria-label="Felipe & Tamires Films — página inicial"
        >
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-x-6 text-xs uppercase tracking-[0.24em] md:flex">
          {PUBLIC_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-underline text-bone-dim transition-colors hover:text-bone"
            >
              {item.label}
            </Link>
          ))}
          <WhatsAppCTA
            variant="link"
            message={WHATSAPP_MESSAGES.header}
            label="Falar conosco"
            className="text-brass-soft transition-colors hover:text-brass"
          />
        </nav>

        <MobileNav links={PUBLIC_NAV} whatsappMessage={WHATSAPP_MESSAGES.header} />
      </div>
    </header>
  );
}
