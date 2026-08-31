import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";

/** Cabeçalho enxuto — apenas a assinatura da marca, sem navegação nesta fase. */
export function SiteHeader() {
  return (
    <header className="w-full border-b border-hairline/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-8 2xl:max-w-[88rem]">
        <Link
          href="/"
          className="rounded-sm outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-brass/70"
          aria-label="Felipe & Tamires Films — página inicial"
        >
          <Wordmark />
        </Link>
        <span className="hidden text-xs uppercase tracking-[0.3em] text-bone-dim sm:inline">
          Audiovisual de eventos
        </span>
      </div>
    </header>
  );
}
