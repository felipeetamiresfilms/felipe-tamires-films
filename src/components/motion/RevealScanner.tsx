"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    __revealReady?: boolean;
  }
}

/**
 * Motor do sistema de reveal cinematográfico. Um único componente, montado
 * uma vez por área pública/privada (nunca no backstage).
 *
 * Varre o documento por `[data-reveal]` / `[data-reveal-stagger]` e liga um
 * IntersectionObserver compartilhado que adiciona `data-inview` quando o
 * bloco entra na viewport — o CSS cuida da transição. Sem listeners de
 * scroll, sem requestAnimationFrame, sem dependência externa.
 *
 * Progressive enhancement: o CSS só esconde os blocos sob `<html class="js">`
 * (definida por script inline). Aqui apenas sinalizamos `window.__revealReady`
 * para desarmar o failsafe do layout, e revelamos tudo de imediato quando o
 * usuário pede menos movimento ou o navegador não tem IntersectionObserver.
 */
export function RevealScanner() {
  const pathname = usePathname();

  useEffect(() => {
    window.__revealReady = true;

    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>(
        "[data-reveal],[data-reveal-stagger]",
      ),
    ).filter((el) => !el.hasAttribute("data-inview"));

    if (nodes.length === 0) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      nodes.forEach((el) => el.setAttribute("data-inview", ""));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-inview", "");
          obs.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 },
    );

    nodes.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
