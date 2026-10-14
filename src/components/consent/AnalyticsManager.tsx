"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import {
  parseConsent,
  readConsent,
  readConsentRaw,
  subscribeConsent,
} from "@/lib/analytics/consent";
import { ANALYTICS_CONFIGURED, EXPERIENCE, STATISTICS } from "@/lib/analytics/config";
import { buildPageContext, sanitizeReferrer } from "@/lib/analytics/page";
import { isTrackedPath } from "@/lib/analytics/routes";
import {
  clearTrackerCookies,
  loadClarity,
  loadGtm,
  sendPageView,
  shutdownTrackers,
  trackersLoaded,
} from "@/lib/analytics/trackers";

/**
 * Orquestra as ferramentas opcionais. Montado só no layout `(public)`.
 *
 * Isolamento das áreas privadas — por DOCUMENTO, não por filtro:
 *  1. Scripts só são injetados em rota da allowlist, com consentimento.
 *  2. Toda navegação que cruza a fronteira rastreável <-> não rastreável
 *     vira carregamento completo (aqui, para cliques; nos layouts privados
 *     e no 404, links são <a> comuns). Assim, um mesmo documento nunca tem
 *     no histórico páginas dos dois lados — e o botão Voltar entre eles
 *     troca de documento, deixando os scripts para trás.
 *  3. Rede de segurança: se ainda assim a rota ficar fora da allowlist com
 *     algo carregado (popstate, bfcache), corta a rede das ferramentas de
 *     forma síncrona — antes do React renderizar a página nova — e recarrega.
 *  4. URL, referrer e título são higienizados antes de qualquer envio.
 *
 * Sem `NEXT_PUBLIC_ANALYTICS_ENABLED=true` este componente não faz nada.
 */

const getServerSnapshot = () => undefined;

function notFoundRendered(): boolean {
  return document.querySelector("[data-ftf-not-found]") !== null;
}

/** Para tudo, apaga os identificadores das finalidades negadas e recarrega. */
function stopAndReload(): void {
  shutdownTrackers({ ga4Id: STATISTICS?.ga4Id ?? null });
  const consent = readConsent();
  clearTrackerCookies({
    statistics: consent?.analytics !== true,
    experience: consent?.experience !== true,
  });
  window.location.reload();
}

export function AnalyticsManager() {
  if (!ANALYTICS_CONFIGURED) return null;
  return <AnalyticsRuntime />;
}

function AnalyticsRuntime() {
  const pathname = usePathname();
  const raw = useSyncExternalStore(subscribeConsent, readConsentRaw, getServerSnapshot);
  // Última página enviada neste documento: caminho (dedupe) e URL já
  // higienizada (vira o referrer da próxima navegação client-side).
  const lastPath = useRef<string | null>(null);
  const lastLocation = useRef<string | null>(null);

  // Fronteira de documentos + rede de segurança (registrados uma vez).
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.hasAttribute("download")) return;
      const target = anchor.getAttribute("target");
      if (target && target !== "_self") return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (isTrackedPath(url.pathname) === isTrackedPath(window.location.pathname)) return;
      // Impede o <Link> (navegação client-side): o clique segue como
      // navegação nativa do <a> — documento novo, sem os scripts atuais.
      event.stopImmediatePropagation();
    }

    function onPopState() {
      const loaded = trackersLoaded();
      if ((loaded.gtm || loaded.clarity) && !isTrackedPath(window.location.pathname)) {
        stopAndReload();
      }
    }

    function onPageShow(event: PageTransitionEvent) {
      if (!event.persisted) return;
      const loaded = trackersLoaded();
      if (!loaded.gtm && !loaded.clarity) return;
      const consent = readConsent();
      const stillAllowed =
        isTrackedPath(window.location.pathname) &&
        (!loaded.gtm || consent?.analytics === true) &&
        (!loaded.clarity || consent?.experience === true);
      if (!stillAllowed) stopAndReload();
    }

    // Captura em `window`: roda antes do <Link> e antes de listeners que as
    // ferramentas registrem depois (elas só carregam após este efeito).
    window.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState, true);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState, true);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  // Consentimento x rota -> carrega, mantém ou derruba.
  useEffect(() => {
    if (raw === undefined) return; // ainda hidratando
    const consent = parseConsent(raw);
    const tracked = isTrackedPath(pathname);
    const allowStatistics = STATISTICS !== null && tracked && consent?.analytics === true;
    const allowExperience = EXPERIENCE !== null && tracked && consent?.experience === true;

    const loaded = trackersLoaded();
    if ((loaded.gtm && !allowStatistics) || (loaded.clarity && !allowExperience)) {
      // Retirada de consentimento (ou rota fora da allowlist): parar já.
      stopAndReload();
      return;
    }

    // Recusa explícita: remove identificadores que tenham sobrado.
    if (consent) {
      clearTrackerCookies({ statistics: !consent.analytics, experience: !consent.experience });
    }

    if (allowExperience && EXPERIENCE) loadClarity(EXPERIENCE);

    if (allowStatistics && STATISTICS) {
      loadGtm(STATISTICS);
      if (lastPath.current === pathname) return; // uma por navegação real
      const page = buildPageContext({
        href: window.location.href,
        referrer:
          lastLocation.current ??
          sanitizeReferrer(document.referrer),
        notFound: notFoundRendered(),
      });
      if (!page) return;
      lastPath.current = pathname;
      lastLocation.current = page.page_location;
      sendPageView(page);
    }
  }, [raw, pathname]);

  return null;
}
