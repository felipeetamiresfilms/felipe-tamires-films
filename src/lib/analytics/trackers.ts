import type { ExperienceConfig, StatisticsConfig } from "./config";
import type { PageContext } from "./page";

/**
 * Carga e descarga das ferramentas opcionais. Só o `AnalyticsManager` chama
 * estas funções — e só em rota da allowlist, com consentimento explícito.
 *
 *  - GTM: Consent Mode em modo BÁSICO. O contêiner só é injetado depois do
 *    consentimento de Estatísticas; o estado `default` (tudo negado) entra
 *    no dataLayer antes de qualquer tag e é atualizado em seguida apenas
 *    para `analytics_storage`. Publicidade fica sempre negada.
 *  - Clarity: carregado direto pelo app (não pelo GTM), com o próprio
 *    consentimento — assim "só Análise de experiência" não precisa do GTM
 *    e "só Estatísticas" nunca toca no Clarity.
 *  - Nada é enfileirado antes do consentimento: o dataLayer nasce aqui.
 *
 * Descarregar um script já executado não é possível. Por isso, retirar o
 * consentimento (ou sair da allowlist com algo carregado) faz:
 * cerca de rede -> interruptores oficiais -> limpeza de cookies -> reload.
 */

type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[][] };

type TrackerState = { gtm?: boolean; clarity?: boolean; fenced?: boolean };

declare global {
  interface Window {
    dataLayer?: unknown[];
    clarity?: ClarityFn;
    __ftfTrackers?: TrackerState;
  }
}

function state(): TrackerState {
  window.__ftfTrackers ??= {};
  return window.__ftfTrackers;
}

/** Somente leitura — não cria estado em documentos sem ferramentas. */
export function trackersLoaded(): { gtm: boolean; clarity: boolean } {
  const s = window.__ftfTrackers;
  return { gtm: s?.gtm === true, clarity: s?.clarity === true };
}

// gtag() precisa empurrar o objeto `arguments` (não um array) — é o formato
// que o GTM reconhece como comando (consent / set).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function gtag(..._args: unknown[]): void {
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer?.push(arguments);
}

function injectScript(src: string): void {
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

/** Injeta o GTM uma única vez por documento. */
export function loadGtm(config: StatisticsConfig): void {
  const s = state();
  if (s.gtm || s.fenced) return;
  s.gtm = true;

  window.dataLayer = window.dataLayer ?? [];
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "denied",
    personalization_storage: "denied",
    security_storage: "denied",
  });
  gtag("set", "ads_data_redaction", true);
  gtag("set", "url_passthrough", false);
  gtag("consent", "update", { analytics_storage: "granted" });
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  injectScript(
    `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(config.gtmId)}`,
  );
}

/**
 * Uma visualização de página. `set` fixa a URL/título higienizados para
 * TODOS os hits seguintes do GA4 (inclusive os automáticos, como
 * user_engagement) — o GA ignora `config` repetido, então `set` é o meio
 * certo de atualizar a página numa navegação client-side.
 */
export function sendPageView(page: PageContext): void {
  if (!state().gtm || state().fenced) return;
  gtag("set", {
    page_location: page.page_location,
    page_referrer: page.page_referrer,
    page_title: page.page_title,
  });
  window.dataLayer?.push({
    event: "ftf_page_view",
    page_tracked: true,
    ...page,
  });
}

/** Injeta o Clarity uma única vez por documento. */
export function loadClarity(config: ExperienceConfig): void {
  const s = state();
  if (s.clarity || s.fenced) return;
  s.clarity = true;

  // Fila padrão do snippet oficial; o tag move o "start" para a frente.
  const queue: ClarityFn =
    window.clarity ??
    function (...args: unknown[]) {
      (queue.q ??= []).push(args);
    };
  window.clarity = queue;
  window.clarity("consentv2", {
    ad_Storage: "denied",
    analytics_Storage: "granted",
  });
  injectScript(
    `https://www.clarity.ms/tag/${encodeURIComponent(config.clarityId)}`,
  );
}

const TRACKER_HOST =
  /(^|\.)(google-analytics\.com|analytics\.google\.com|googletagmanager\.com|clarity\.ms|doubleclick\.net|bing\.com)$/i;

function isTrackerUrl(url: string | URL): boolean {
  try {
    return TRACKER_HOST.test(new URL(url, window.location.href).hostname);
  } catch {
    return false;
  }
}

/**
 * Cerca de rede: a partir daqui, nenhuma requisição deste documento chega
 * aos domínios das ferramentas (beacon, fetch, XHR, pixel). Cobre o
 * intervalo entre a decisão de parar e o reload — inclusive os envios que
 * os próprios scripts disparam ao descarregar a página.
 */
function installFence(): void {
  const s = state();
  if (s.fenced) return;
  s.fenced = true;

  const beacon = navigator.sendBeacon?.bind(navigator);
  if (beacon) {
    navigator.sendBeacon = (url, data) => (isTrackerUrl(url) ? true : beacon(url, data));
  }

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = input instanceof Request ? input.url : input;
    return isTrackerUrl(url)
      ? Promise.resolve(new Response(null, { status: 204 }))
      : nativeFetch(input, init);
  };

  const xhr = XMLHttpRequest.prototype;
  const open = xhr.open;
  const send = xhr.send;
  const blocked = new WeakSet<XMLHttpRequest>();
  xhr.open = function (this: XMLHttpRequest, ...args: Parameters<typeof open>) {
    if (isTrackerUrl(args[1])) blocked.add(this);
    return open.apply(this, args);
  } as typeof open;
  xhr.send = function (this: XMLHttpRequest, body?: Document | XMLHttpRequestBodyInit | null) {
    if (blocked.has(this)) return;
    return send.call(this, body);
  };

  const src = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");
  if (src?.set && src.get) {
    Object.defineProperty(HTMLImageElement.prototype, "src", {
      configurable: true,
      enumerable: src.enumerable,
      get: src.get,
      set(this: HTMLImageElement, value: string) {
        if (!isTrackerUrl(value)) src.set!.call(this, value);
      },
    });
  }
}

const GA_COOKIE = /^_ga(_|$)/;
const CLARITY_COOKIES = new Set(["_clck", "_clsk", "_uetvid", "_uetmsclkid"]);

function expireCookie(name: string): void {
  const host = window.location.hostname;
  const labels = host.split(".");
  // Host atual + cada domínio-pai (o GA grava no domínio de nível mais alto).
  const domains: (string | null)[] = [null];
  for (let i = 0; i < labels.length - 1; i++) domains.push(labels.slice(i).join("."));
  for (const domain of domains) {
    document.cookie = `${name}=; Max-Age=0; Path=/${domain ? `; Domain=${domain}` : ""}`;
  }
}

/** Apaga os cookies primários das ferramentas cuja finalidade foi negada. */
export function clearTrackerCookies(scope: { statistics: boolean; experience: boolean }): void {
  for (const part of document.cookie.split(";")) {
    const name = part.split("=", 1)[0].trim();
    if ((scope.statistics && GA_COOKIE.test(name)) || (scope.experience && CLARITY_COOKIES.has(name))) {
      expireCookie(name);
    }
  }
}

/**
 * Para tudo neste documento, imediatamente e de forma síncrona. Quem chama
 * deve recarregar a página em seguida (único jeito de descarregar scripts).
 */
export function shutdownTrackers(config: { ga4Id: string | null }): void {
  installFence();
  if (config.ga4Id) {
    // Interruptor oficial do Google: o gtag deixa de enviar para este ID.
    (window as unknown as Record<string, boolean>)[`ga-disable-${config.ga4Id}`] = true;
  }
  if (state().gtm) gtag("consent", "update", { analytics_storage: "denied" });
  if (state().clarity && typeof window.clarity === "function") {
    try {
      window.clarity("consent", false);
      window.clarity("stop");
    } catch {
      // Sem efeito: a cerca de rede e o reload garantem a parada.
    }
  }
}
