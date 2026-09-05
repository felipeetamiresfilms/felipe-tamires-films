"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS: { href: string; label: string; exact?: boolean }[] = [
  { href: "/backstage-ft", label: "Dashboard", exact: true },
  { href: "/backstage-ft/clientes", label: "Clientes" },
  { href: "/backstage-ft/eventos", label: "Eventos" },
  { href: "/backstage-ft/curadoria", label: "Curadoria" },
];

/**
 * Menu do painel: horizontal no desktop, mesma linha (só que rolável/compacta)
 * no celular. Sem sidebar, sem template genérico — três destinos e pronto.
 */
export function BackstageNav({ className = "" }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      className={[
        "flex items-center gap-1 text-xs uppercase tracking-[0.2em]",
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
              "min-h-9 rounded-full px-3 py-2 transition-colors",
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
