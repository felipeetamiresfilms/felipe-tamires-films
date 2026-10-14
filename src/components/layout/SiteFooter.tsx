import Link from "next/link";
import { ConsentPreferencesButton } from "@/components/consent/ConsentPreferencesButton";

const footerLink =
  "underline-offset-4 transition-colors hover:text-bone hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/60";

/** Rodapé discreto. */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-hairline/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-xs text-bone-dim sm:flex-row sm:items-center sm:justify-between sm:px-8 2xl:max-w-[88rem]">
        <p className="uppercase tracking-[0.28em]">Felipe &amp; Tamires Films</p>
        <p>
          Casamentos · 15 anos · Eventos sociais — {year}
        </p>
      </div>
      <nav
        aria-label="Privacidade"
        className="mx-auto flex max-w-6xl flex-wrap gap-x-5 gap-y-2 px-6 pb-8 text-xs text-bone-dim sm:px-8 2xl:max-w-[88rem]"
      >
        <Link href="/privacidade" className={footerLink}>
          Política de privacidade
        </Link>
        <ConsentPreferencesButton className={footerLink} />
      </nav>
    </footer>
  );
}
