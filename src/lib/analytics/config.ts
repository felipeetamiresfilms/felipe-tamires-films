/**
 * Configuração das ferramentas opcionais, lida das variáveis públicas de
 * build (`NEXT_PUBLIC_*` são embutidas no bundle — referenciadas literalmente
 * para o Next substituir).
 *
 * Chave-mestra: sem `NEXT_PUBLIC_ANALYTICS_ENABLED=true`, NADA é carregado,
 * mesmo com consentimento — é o estado de produção até a política de
 * privacidade ser finalizada. Previews/dev ficam desligados por padrão.
 *
 * IDs fora do formato esperado desligam só a ferramenta correspondente.
 */

const ENABLED = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true";

function valid(value: string | undefined, pattern: RegExp): string | null {
  const v = value?.trim();
  return v && pattern.test(v) ? v : null;
}

const gtmId = valid(process.env.NEXT_PUBLIC_GTM_ID, /^GTM-[A-Z0-9]{4,12}$/);
// O GA4 é gerenciado pelo GTM; o ID existe no código só para o interruptor
// oficial `window['ga-disable-<ID>']` usado ao retirar o consentimento.
const ga4Id = valid(process.env.NEXT_PUBLIC_GA4_ID, /^G-[A-Z0-9]{6,16}$/);
const clarityId = valid(
  process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID,
  /^[a-z0-9]{6,16}$/,
);

export type StatisticsConfig = { gtmId: string; ga4Id: string };
export type ExperienceConfig = { clarityId: string };

/** "Estatísticas" -> GTM (que gerencia o GA4). */
export const STATISTICS: StatisticsConfig | null =
  ENABLED && gtmId && ga4Id ? { gtmId, ga4Id } : null;

/** "Análise de experiência" -> Microsoft Clarity (carregado pelo app). */
export const EXPERIENCE: ExperienceConfig | null =
  ENABLED && clarityId ? { clarityId } : null;

export const ANALYTICS_CONFIGURED = STATISTICS !== null || EXPERIENCE !== null;
