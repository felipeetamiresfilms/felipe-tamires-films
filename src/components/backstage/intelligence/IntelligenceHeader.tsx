import Link from "next/link";

const TABS = [
  { key: "relatorios", href: "/backstage-ft/inteligencia", label: "Relatórios" },
  { key: "links", href: "/backstage-ft/inteligencia/links", label: "Links UTM" },
] as const;

/** Cabeçalho comum da seção Inteligência: título, abas e aviso de escopo. */
export function IntelligenceHeader({
  active,
  description,
}: {
  active: (typeof TABS)[number]["key"];
  description: string;
}) {
  return (
    <header className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.32em] text-brass">Área administrativa</p>
        <h1 className="font-display text-4xl font-light text-bone sm:text-5xl">Inteligência</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-bone-dim">{description}</p>
      </div>
      <nav aria-label="Inteligência" className="flex gap-1 border-b border-hairline">
        {TABS.map((tab) => {
          const current = tab.key === active;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={current ? "page" : undefined}
              className={[
                "-mb-px min-h-11 border-b-2 px-4 py-3 text-xs uppercase tracking-[0.2em] transition-colors",
                current
                  ? "border-brass text-bone"
                  : "border-transparent text-bone-dim hover:text-bone",
              ].join(" ")}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
