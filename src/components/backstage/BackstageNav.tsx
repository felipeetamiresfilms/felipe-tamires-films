"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS: { href: string; label: string; exact?: boolean }[] = [
  { href: "/backstage-ft", label: "Dashboard", exact: true },
  { href: "/backstage-ft/clientes", label: "Clientes" },
  { href: "/backstage-ft/eventos", label: "Eventos" },
  { href: "/backstage-ft/curadoria", label: "Curadoria" },
  { href: "/backstage-ft/inteligencia", label: "Inteligência" },
];

/**
 * Menu do painel: horizontal no desktop, mesma linha (só que rolável/compacta)
 * no celular. Sem sidebar, sem template genérico — poucos destinos e pronto.
 */
export function BackstageNav({ className = "" }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      className={[
        // No celular os itens não cabem numa linha: o menu rola na horizontal
        // (sem barra visível) em vez de alargar a página inteira.
        "flex min-w-0 max-w-full items-center gap-1 overflow-x-auto text-xs uppercase tracking-[0.2em] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      ].join(" ")}
    >
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={[
              "min-h-9 shrink-0 whitespace-nowrap rounded-full px-3 py-2 transition-colors",
              active
                ? "bg-raised/70 text-bone"
                : "text-bone-dim hover:text-bone",
            ].join(" ")}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
