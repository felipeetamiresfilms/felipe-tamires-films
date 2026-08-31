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
    </footer>
  );
}
