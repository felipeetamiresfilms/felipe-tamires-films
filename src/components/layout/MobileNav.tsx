"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { WhatsAppCTA } from "@/components/public/WhatsAppCTA";

type NavLink = { href: string; label: string };

/**
 * Navegação pública em telas pequenas (`< md`): botão hambúrguer + painel
 * recolhível logo abaixo do header.
 *
 * Acessibilidade: `aria-expanded` + `aria-controls`, `focus-visible`, fecha
 * ao escolher um link, no Esc e ao tocar fora. Não trava o scroll do body.
 * A abertura é um fade curto sob `motion-safe` (respeita
 * `prefers-reduced-motion`). Sem biblioteca externa.
 */
export function MobileNav({
  links,
  whatsappMessage,
}: {
  links: ReadonlyArray<NavLink>;
  whatsappMessage: string;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        onClick={() => setOpen((value) => !value)}
        className="-mr-1 inline-flex h-10 w-10 items-center justify-center rounded-sm text-bone outline-none transition-colors hover:text-brass-soft focus-visible:ring-2 focus-visible:ring-brass/70"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-5 w-5 stroke-current"
          fill="none"
          strokeWidth="1.6"
          strokeLinecap="round"
        >
          {open ? (
            <>
              <path d="M5 5l14 14" />
              <path d="M19 5 5 19" />
            </>
          ) : (
            <>
              <path d="M3 6h18" />
              <path d="M3 12h18" />
              <path d="M3 18h18" />
            </>
          )}
        </svg>
      </button>

      {open ? (
        <div
          id={panelId}
          className="absolute inset-x-0 top-full z-50 border-b border-hairline bg-ink/95 backdrop-blur-sm motion-safe:animate-[fade_0.18s_ease-out]"
        >
          <nav className="mx-auto flex max-w-6xl flex-col px-6 py-1 text-xs uppercase tracking-[0.24em] sm:px-8">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-hairline/50 py-4 text-bone-dim transition-colors hover:text-bone focus-visible:text-bone"
              >
                {item.label}
              </Link>
            ))}
            <WhatsAppCTA
              variant="link"
              message={whatsappMessage}
              label="Falar conosco"
              onClick={() => setOpen(false)}
              className="py-4 text-brass-soft transition-colors hover:text-brass"
            />
          </nav>
        </div>
      ) : null}
    </div>
  );
}
