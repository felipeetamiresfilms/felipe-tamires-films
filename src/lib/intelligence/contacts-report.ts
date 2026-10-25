import type { GaReport } from "./ga-data";
import type { ContactRow, ContactsData, Period } from "./types";
import { SOURCE_GROUPS, sourceGroupOf } from "./sources";

/**
 * Leitura dos relatórios de contato da Data API — funções puras (sem rede,
 * sem cache), testáveis com `node --test`.
 *
 * Métricas por linha, sempre nesta ordem: [eventCount, sessions], com o
 * filtro `eventName == contact_click`. Ou seja: cliques (eventos) e sessões
 * que tiveram ao menos um clique — nunca somadas entre si.
 */

type Row = NonNullable<GaReport["rows"]>[number];

const num = (value: string | undefined) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
const dim = (row: Row, i: number) => row.dimensionValues?.[i]?.value ?? "";
const met = (row: Row, i: number) => num(row.metricValues?.[i]?.value);

/** Sessões com contato ÷ sessões do período. Sem sessões -> null (nunca ÷0). */
export function contactRate(contactSessions: number, totalSessions: number): number | null {
  if (!(totalSessions > 0)) return null;
  return contactSessions / totalSessions;
}

/** Sessões (sem filtro) — 1ª métrica da 1ª linha. */
function totalSessionsOf(report: GaReport | undefined): number {
  const row = report?.rows?.[0];
  return row ? met(row, 0) : 0;
}

/**
 * Totais do relatório por origem (`metricAggregations: TOTAL`): calculados
 * pelo GA4 sobre todas as sessões, não pela soma das linhas exibidas.
 */
function contactTotalsOf(report: GaReport | undefined): { clicks: number; sessions: number } {
  const row = report?.totals?.[0];
  return row ? { clicks: met(row, 0), sessions: met(row, 1) } : { clicks: 0, sessions: 0 };
}

/**
 * `sessionSource` é escopo de sessão: cada sessão cai numa só origem, então
 * somar sessões dentro de um grupo é válido.
 */
function bySourceGroup(report: GaReport | undefined): ContactRow[] {
  const groups = new Map<string, ContactRow>(
    SOURCE_GROUPS.map((label) => [label, { label, clicks: 0, sessions: 0 }]),
  );
  for (const row of report?.rows ?? []) {
    const group = groups.get(sourceGroupOf(dim(row, 0)))!;
    group.clicks += met(row, 0);
    group.sessions += met(row, 1);
  }
  return SOURCE_GROUPS.map((label) => groups.get(label)!);
}

function topSourceOf(rows: ContactRow[]): ContactsData["topSource"] {
  let top: ContactRow | null = null;
  for (const row of rows) if (row.sessions > (top?.sessions ?? 0)) top = row;
  return top ? { label: top.label, sessions: top.sessions } : null;
}

export function parseContacts(input: {
  period: Period;
  total: GaReport | undefined;
  bySource: GaReport | undefined;
  byPage: GaReport | undefined;
  byCampaign: GaReport | undefined;
  /** null = dimensão personalizada indisponível (consulta recusada). */
  byButton: GaReport | null;
  fetchedAt: string;
}): ContactsData {
  const totals = contactTotalsOf(input.bySource);
  const totalSessions = totalSessionsOf(input.total);
  const bySource = bySourceGroup(input.bySource);
  const reports = [input.total, input.bySource, input.byPage, input.byCampaign, input.byButton];

  return {
    period: input.period,
    clicks: totals.clicks,
    contactSessions: totals.sessions,
    totalSessions,
    contactRate: contactRate(totals.sessions, totalSessions),
    topSource: topSourceOf(bySource),
    bySource,
    byPage: (input.byPage?.rows ?? []).map((row) => ({
      label: dim(row, 0) || "(sem caminho)",
      clicks: met(row, 0),
      sessions: met(row, 1),
    })),
    byCampaign: (input.byCampaign?.rows ?? []).map((row) => ({
      label: dim(row, 0),
      sourceMedium: dim(row, 1),
      clicks: met(row, 0),
      sessions: met(row, 1),
    })),
    byButton: input.byButton
      ? {
          status: "ok",
          rows: (input.byButton.rows ?? []).map((row) => ({
            location: dim(row, 0) || "(not set)",
            clicks: met(row, 0),
          })),
        }
      : { status: "unavailable" },
    notes: {
      thresholded: reports.some((r) => r?.metadata?.subjectToThresholding === true),
      otherRow: reports.some((r) => r?.metadata?.dataLossFromOtherRow === true),
      sampled: reports.some((r) => (r?.metadata?.samplingMetadatas?.length ?? 0) > 0),
    },
    fetchedAt: input.fetchedAt,
  };
}
