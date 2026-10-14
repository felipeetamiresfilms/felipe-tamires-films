/**
 * Preferências de consentimento de cookies — armazenamento e leitura.
 *
 * Um único cookie primário (`ftf_consent`), sem dado pessoal: só a versão
 * da política, as duas escolhas opcionais e o instante da escolha. Lido
 * apenas no navegador — nenhuma página passa a depender de `cookies()` no
 * servidor (não muda cache/renderização).
 *
 * Padrão = TUDO OPCIONAL NEGADO. Sem cookie válido (ausente, corrompido ou
 * de outra versão), o visitante é tratado como "ainda não escolheu": nada
 * opcional roda e o banner volta a aparecer.
 *
 * Categorias opcionais, sempre independentes:
 *   - analytics  -> "Estatísticas" (Google Analytics 4)
 *   - experience -> "Análise de experiência" (Microsoft Clarity)
 */

import { EXPERIENCE, STATISTICS } from "./config";

export const CONSENT_COOKIE = "ftf_consent";

/** Suba a versão quando finalidades/ferramentas mudarem: o banner reaparece. */
export const CONSENT_VERSION = 1;

/** Finalidades opcionais efetivamente configuradas neste build. */
export const OPTIONAL_PURPOSES = {
  analytics: STATISTICS !== null,
  experience: EXPERIENCE !== null,
} as const;

/**
 * Assinatura das finalidades oferecidas ("a" = Estatísticas, "e" = Análise
 * de experiência), gravada junto com a escolha. Se uma finalidade nova for
 * introduzida (ex.: Clarity ativado depois), escolhas antigas deixam de
 * valer e o visitante é consultado de novo — consentimento sempre específico.
 */
export const CONSENT_PURPOSES = `${OPTIONAL_PURPOSES.analytics ? "a" : ""}${OPTIONAL_PURPOSES.experience ? "e" : ""}`;

/** Validade da escolha: ~6 meses. Depois, perguntamos de novo. */
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 182;

/** Disparado em `window` sempre que a escolha é gravada. */
export const CONSENT_CHANGE_EVENT = "ftf:consent-change";
/** Disparado em `window` para abrir o painel de preferências. */
export const CONSENT_OPEN_EVENT = "ftf:consent-open";

export type ConsentChoices = {
  analytics: boolean;
  experience: boolean;
};

export type ConsentRecord = ConsentChoices & {
  v: number;
  /** Finalidades oferecidas quando a escolha foi feita (`CONSENT_PURPOSES`). */
  p: string;
  /** Momento da escolha (epoch ms). */
  ts: number;
};

export const DENY_ALL: ConsentChoices = { analytics: false, experience: false };
/** "Aceitar": concede só as finalidades que existem neste build. */
export const GRANT_CONFIGURED: ConsentChoices = { ...OPTIONAL_PURPOSES };

/** Valor bruto do cookie (string estável — serve de snapshot p/ React). */
export function readConsentRaw(): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${CONSENT_COOKIE}=`;
  for (const part of document.cookie.split(";")) {
    const entry = part.trim();
    if (entry.startsWith(prefix)) return entry.slice(prefix.length);
  }
  return null;
}

/** Valida o cookie. Qualquer coisa fora do formato esperado -> null. */
export function parseConsent(raw: string | null): ConsentRecord | null {
  if (!raw) return null;
  try {
    const data: unknown = JSON.parse(decodeURIComponent(raw));
    if (typeof data !== "object" || data === null) return null;
    const { v, p, ts, analytics, experience } = data as Record<string, unknown>;
    if (v !== CONSENT_VERSION || p !== CONSENT_PURPOSES) return null;
    if (typeof ts !== "number" || !Number.isFinite(ts)) return null;
    // Só `true` literal concede; qualquer outro valor conta como negado.
    return { v, p, ts, analytics: analytics === true, experience: experience === true };
  } catch {
    return null;
  }
}

export function readConsent(): ConsentRecord | null {
  return parseConsent(readConsentRaw());
}

/**
 * Grava a escolha e avisa quem estiver ouvindo. Serve para aceitar,
 * rejeitar, personalizar e retirar (retirar = gravar `false`).
 *
 * Finalidades não configuradas neste build são sempre gravadas como
 * negadas. Descarregar ferramentas / limpar cookies ao retirar fica a cargo
 * do `AnalyticsManager`.
 */
export function writeConsent(choices: ConsentChoices): ConsentRecord {
  const record: ConsentRecord = {
    v: CONSENT_VERSION,
    p: CONSENT_PURPOSES,
    ts: Date.now(),
    analytics: choices.analytics === true && OPTIONAL_PURPOSES.analytics,
    experience: choices.experience === true && OPTIONAL_PURPOSES.experience,
  };
  const value = encodeURIComponent(JSON.stringify(record));
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
  return record;
}

/** Assinatura para `useSyncExternalStore` (inclui mudança em outra aba). */
export function subscribeConsent(onChange: () => void): () => void {
  const onFocus = () => onChange();
  window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
  window.addEventListener("focus", onFocus);
  return () => {
    window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
    window.removeEventListener("focus", onFocus);
  };
}

/**
 * Sinal de privacidade do navegador: Global Privacy Control ou Do Not Track.
 * Tratado como recusa prévia das finalidades opcionais: o banner não é
 * exibido e nada opcional roda. Uma escolha explícita posterior no painel
 * (ato afirmativo e específico do visitante) prevalece sobre o sinal.
 */
export function hasPrivacySignal(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.globalPrivacyControl === true || nav.doNotTrack === "1";
}

/** Abre o painel de preferências (link do rodapé, página de privacidade). */
export function openConsentPreferences(): void {
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}
