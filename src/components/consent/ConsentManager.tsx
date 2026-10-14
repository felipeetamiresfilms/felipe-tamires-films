"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { ANALYTICS_CONFIGURED } from "@/lib/analytics/config";
import {
  CONSENT_OPEN_EVENT,
  DENY_ALL,
  GRANT_CONFIGURED,
  OPTIONAL_PURPOSES,
  hasPrivacySignal,
  parseConsent,
  readConsent,
  readConsentRaw,
  subscribeConsent,
  writeConsent,
  type ConsentChoices,
} from "@/lib/analytics/consent";

/**
 * Banner + painel de preferências de cookies. Montado só no layout
 * `(public)` — as áreas privadas e o backstage nunca o recebem.
 *
 *  - Nada opcional vem ligado: sem escolha válida, tudo fica negado.
 *  - Aceitar / Rejeitar / Personalizar têm exatamente o mesmo estilo —
 *    nenhum botão "puxa" o visitante para aceitar.
 *  - O banner não bloqueia a navegação nem desloca o layout (fixo, sem
 *    backdrop); no celular fica compacto, colado à borda inferior.
 *  - O painel é um <dialog> nativo modal: foco preso, ESC fecha, fundo
 *    inerte. Cada finalidade tem um switch próprio, desligado por padrão.
 *  - Renderiza só após a hidratação (snapshot do servidor = indefinido),
 *    então nunca há divergência SSR/cliente nem flash do banner.
 */

const choiceBase =
  "min-h-11 rounded-full border border-brass/45 py-2 text-[13px] font-medium tracking-[0.02em] text-bone transition-colors duration-200 hover:border-brass hover:bg-brass/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/60";

// Banner: larguras iguais numa linha (cabe a partir de ~320px); abaixo
// disso o flex-wrap quebra pela largura mínima do rótulo — nunca estoura.
const bannerButton = `${choiceBase} flex-1 whitespace-nowrap px-2.5`;
// Painel: rótulos mais longos — cresce a partir do conteúdo e quebra.
const panelButton = `${choiceBase} flex-[1_1_auto] px-4`;

const getServerSnapshot = () => undefined;

function describe(choices: ConsentChoices): string {
  return `Preferências salvas. Estatísticas ${
    choices.analytics ? "ativadas" : "desativadas"
  }; análise de experiência ${choices.experience ? "ativada" : "desativada"}.`;
}

// Texto do banner conforme as finalidades configuradas neste build.
const OPTIONAL_TEXT =
  OPTIONAL_PURPOSES.analytics && OPTIONAL_PURPOSES.experience
    ? "Estatísticas de navegação e análise de experiência são opcionais e dependem"
    : OPTIONAL_PURPOSES.analytics
      ? "As estatísticas de navegação são opcionais e dependem"
      : "A análise de experiência é opcional e depende";

/**
 * Sem nenhuma ferramenta opcional configurada (`NEXT_PUBLIC_*` fixadas no
 * build), não há o que consentir: nem banner, nem painel.
 */
export function ConsentManager() {
  return ANALYTICS_CONFIGURED ? <ConsentRuntime /> : null;
}

function ConsentRuntime() {
  // undefined = ainda hidratando; null = sem escolha; string = cookie bruto.
  const raw = useSyncExternalStore(
    subscribeConsent,
    readConsentRaw,
    getServerSnapshot,
  );
  const [panelOpen, setPanelOpen] = useState(false);
  const [draft, setDraft] = useState<ConsentChoices>(DENY_ALL);
  const [announcement, setAnnouncement] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);

  const bannerTitleId = useId();
  const panelTitleId = useId();
  const panelDescId = useId();

  const openPanel = useCallback(() => {
    const current = readConsent();
    setDraft(
      current
        ? { analytics: current.analytics, experience: current.experience }
        : DENY_ALL,
    );
    setPanelOpen(true);
  }, []);

  const save = useCallback((choices: ConsentChoices) => {
    writeConsent(choices);
    setPanelOpen(false);
    setAnnouncement(describe(choices));
  }, []);

  // Link "Preferências de cookies" (rodapé / política) abre o painel.
  useEffect(() => {
    window.addEventListener(CONSENT_OPEN_EVENT, openPanel);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, openPanel);
  }, [openPanel]);

  // Sincroniza o <dialog> nativo com o estado + trava o scroll do fundo.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!panelOpen) {
      if (dialog.open) dialog.close();
      return;
    }
    if (!dialog.open) dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [panelOpen]);

  if (raw === undefined) return null;

  // GPC/DNT valem como recusa prévia: sem banner, tudo segue negado; o
  // painel continua acessível pelo rodapé para uma escolha explícita.
  const privacySignal = hasPrivacySignal();
  const showBanner = parseConsent(raw) === null && !privacySignal;

  return (
    // `data-overlay`: fica fora da regra global `body > *` (globals.css), que
    // forçaria `position: relative` e tiraria o banner/painel do `fixed`.
    <div data-overlay>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {showBanner ? (
        <section
          aria-labelledby={bannerTitleId}
          className="fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-3 rounded-2xl border border-hairline bg-raised/95 p-4 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.85)] backdrop-blur-md motion-safe:animate-[fade_.35s_ease-out] sm:right-auto sm:bottom-6 sm:left-6 sm:mx-0 sm:w-[25rem] sm:p-5"
        >
          <h2
            id={bannerTitleId}
            className="text-[11px] uppercase tracking-[0.28em] text-brass"
          >
            Sua privacidade
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-bone-dim sm:text-sm">
            Usamos só o essencial para o site funcionar. {OPTIONAL_TEXT} da sua
            permissão.{" "}
            <Link
              href="/privacidade"
              className="text-bone underline decoration-brass/50 underline-offset-4 transition-colors hover:decoration-brass focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/60"
            >
              Saiba mais
            </Link>
          </p>
          <div className="mt-3.5 flex flex-wrap gap-2">
            <button
              type="button"
              className={bannerButton}
              onClick={() => save(GRANT_CONFIGURED)}
            >
              Aceitar
            </button>
            <button
              type="button"
              className={bannerButton}
              onClick={() => save(DENY_ALL)}
            >
              Rejeitar
            </button>
            <button type="button" className={bannerButton} onClick={openPanel}>
              Personalizar
            </button>
          </div>
        </section>
      ) : null}

      <dialog
        ref={dialogRef}
        aria-labelledby={panelTitleId}
        aria-describedby={panelDescId}
        // ESC (ou close() programático) -> sincroniza o estado.
        onClose={() => setPanelOpen(false)}
        // Clique fora da caixa (no ::backdrop) fecha sem salvar.
        onMouseDown={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          const outside =
            event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom;
          if (event.target === event.currentTarget && outside) {
            setPanelOpen(false);
          }
        }}
        className="mx-0 mb-0 mt-auto max-h-[88svh] w-full max-w-full flex-col overflow-hidden rounded-t-2xl border border-b-0 border-hairline bg-raised p-0 text-bone backdrop:bg-ink/80 backdrop:backdrop-blur-sm open:flex motion-safe:open:animate-[fade_.2s_ease-out] sm:m-auto sm:max-h-[85vh] sm:w-[min(36rem,calc(100%-3rem))] sm:rounded-2xl sm:border-b"
      >
        <div className="flex items-start justify-between gap-4 border-b border-hairline px-5 pb-4 pt-5 sm:px-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase tracking-[0.28em] text-brass">
              Privacidade
            </span>
            <h2
              id={panelTitleId}
              className="font-display text-2xl font-light leading-tight text-bone"
            >
              Preferências de cookies
            </h2>
          </div>
          <button
            type="button"
            autoFocus
            onClick={() => setPanelOpen(false)}
            className="shrink-0 rounded-full border border-hairline px-3.5 py-2 text-xs text-bone-dim transition-colors hover:border-brass/50 hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/60"
          >
            Fechar
          </button>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          <p
            id={panelDescId}
            className="text-sm leading-relaxed text-bone-dim"
          >
            Escolha o que autoriza. As opções abaixo vêm desligadas, valem só
            para as páginas públicas do site (nunca para as áreas privadas de
            clientes) e podem ser alteradas a qualquer momento em
            &ldquo;Preferências de cookies&rdquo;, no rodapé.
          </p>

          {privacySignal ? (
            <p className="rounded-xl border border-brass/30 bg-brass/5 p-3.5 text-[13px] leading-relaxed text-bone-dim">
              Seu navegador envia um sinal de privacidade (Global Privacy
              Control ou Do Not Track). Por isso, mantivemos tudo o que é
              opcional desligado. Se quiser, você ainda pode autorizar aqui.
            </p>
          ) : null}

          <Category
            title="Necessários"
            description="Guardam a sua escolha sobre cookies e mantêm o funcionamento básico do site. Não são usados para medir a navegação."
            detail="Cookie próprio da Felipe & Tamires Films · validade de 6 meses"
            control={
              <span className="shrink-0 rounded-full border border-hairline px-3 py-1 text-xs text-bone-dim">
                Sempre ativos
              </span>
            }
          />

          {OPTIONAL_PURPOSES.analytics ? (
            <Category
              title="Estatísticas"
              description="Contam, de forma agregada, as visitas às páginas públicas e de onde elas vêm, para entendermos o que desperta interesse e melhorarmos o site."
              detail="Ferramentas: Google Tag Manager e Google Analytics 4 (Google)"
              checked={draft.analytics}
              onToggle={(analytics) => setDraft((d) => ({ ...d, analytics }))}
            />
          ) : null}

          {OPTIONAL_PURPOSES.experience ? (
            <Category
              title="Análise de experiência"
              description="Registra como as páginas públicas são usadas — rolagem, cliques e trajetos — com o conteúdo mascarado, para encontrarmos pontos de dificuldade na navegação."
              detail="Ferramenta: Microsoft Clarity (Microsoft)"
              checked={draft.experience}
              onToggle={(experience) => setDraft((d) => ({ ...d, experience }))}
            />
          ) : null}

          <p className="pt-1 text-xs leading-relaxed text-bone-dim">
            Detalhes sobre finalidades, cookies e seus direitos na{" "}
            <Link
              href="/privacidade"
              onClick={() => setPanelOpen(false)}
              className="text-bone underline decoration-brass/50 underline-offset-4 hover:decoration-brass focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/60"
            >
              Política de privacidade
            </Link>
            .
          </p>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-hairline px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-5">
          <button
            type="button"
            className={panelButton}
            onClick={() => save(DENY_ALL)}
          >
            Rejeitar opcionais
          </button>
          <button
            type="button"
            className={panelButton}
            onClick={() => save(draft)}
          >
            Salvar escolhas
          </button>
          <button
            type="button"
            className={panelButton}
            onClick={() => save(GRANT_CONFIGURED)}
          >
            Aceitar todos
          </button>
        </div>
      </dialog>
    </div>
  );
}

function Category({
  title,
  description,
  detail,
  control,
  checked,
  onToggle,
}: {
  title: string;
  description: string;
  detail: string;
  /** Controle fixo (ex.: "Sempre ativos"). Sem ele, renderiza um switch. */
  control?: React.ReactNode;
  checked?: boolean;
  onToggle?: (next: boolean) => void;
}) {
  const titleId = useId();
  const descId = useId();

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-hairline bg-surface p-4">
      <div className="flex items-center justify-between gap-4">
        <h3 id={titleId} className="text-sm font-medium text-bone">
          {title}
        </h3>
        {control ?? (
          <button
            type="button"
            role="switch"
            aria-checked={checked === true}
            aria-labelledby={titleId}
            aria-describedby={descId}
            onClick={() => onToggle?.(!checked)}
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-full py-1 pl-1 text-xs text-bone-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/60"
          >
            <span aria-hidden="true" className="w-[4.75rem] text-right">
              {checked ? "Ativado" : "Desativado"}
            </span>
            <span
              aria-hidden="true"
              className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-colors duration-200 ${
                checked
                  ? "border-brass bg-brass/25"
                  : "border-hairline bg-ink group-hover:border-brass/40"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full transition-transform duration-200 motion-reduce:transition-none ${
                  checked
                    ? "translate-x-[1.35rem] bg-brass"
                    : "translate-x-[0.2rem] bg-bone-dim"
                }`}
              />
            </span>
          </button>
        )}
      </div>
      <p id={descId} className="text-[13px] leading-relaxed text-bone-dim">
        {description}
      </p>
      <p className="text-xs text-bone-dim/80">{detail}</p>
    </div>
  );
}
