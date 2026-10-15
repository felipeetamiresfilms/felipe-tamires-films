import "server-only";
import { unstable_cache } from "next/cache";
import { GaDataError, batchRunReports, readCredentials, type GaReport } from "./ga-data";
import type {
  DashboardData,
  DashboardResult,
  DailyPoint,
  DaysPeriod,
  LabeledCount,
  Period,
  Totals,
} from "./types";

/**
 * Painel de Inteligência: 5 relatórios do GA4 numa única chamada, com cache
 * de 15 min por (propriedade, período). Erros nunca são cacheados.
 *
 * Períodos = dias COMPLETOS até ontem (no fuso da propriedade), comparados
 * com o mesmo número de dias imediatamente anterior.
 */

const CACHE_SECONDS = 900;
/** "Hoje" muda ao longo do dia: cache mais curto. */
const TODAY_CACHE_SECONDS = 300;

function ranges(period: DaysPeriod) {
  return {
    current: { startDate: `${period}daysAgo`, endDate: "yesterday", name: "atual" },
    previous: {
      startDate: `${period * 2}daysAgo`,
      endDate: `${period + 1}daysAgo`,
      name: "anterior",
    },
  };
}

function buildRequests(period: Period): object[] {
  // "today" é resolvido pelo GA4 no fuso horário da propriedade. Dia em
  // andamento NÃO é comparado com um dia completo (variação enganosa).
  const today = period === "hoje";
  const { current, previous } = today
    ? { current: { startDate: "today", endDate: "today", name: "atual" }, previous: null }
    : ranges(period);
  return [
    // 0. Totais do período atual (e do anterior, quando há comparação justa).
    {
      dateRanges: previous ? [current, previous] : [current],
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "userEngagementDuration" },
      ],
    },
    // 1. Evolução diária (ou por hora, no período "hoje").
    {
      dateRanges: [current],
      dimensions: [{ name: today ? "hour" : "date" }],
      metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "screenPageViews" }],
      orderBys: [{ dimension: { dimensionName: today ? "hour" : "date" } }],
      limit: 120,
    },
    // 2. Páginas mais visitadas.
    {
      dateRanges: [current],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 10,
    },
    // 3. Aquisição por sessão: canal + origem + mídia (agregados no código).
    {
      dateRanges: [current],
      dimensions: [
        { name: "sessionDefaultChannelGroup" },
        { name: "sessionSource" },
        { name: "sessionMedium" },
      ],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 250,
    },
    // 4. Campanhas UTM (exclui "(not set)", "(direct)", "(organic)"…).
    {
      dateRanges: [current],
      dimensions: [{ name: "sessionCampaignName" }, { name: "sessionSourceMedium" }],
      metrics: [{ name: "sessions" }, { name: "engagedSessions" }],
      dimensionFilter: {
        notExpression: {
          filter: {
            fieldName: "sessionCampaignName",
            stringFilter: { matchType: "BEGINS_WITH", value: "(" },
          },
        },
      },
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    },
  ];
}

const num = (value: string | undefined) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
const dim = (row: NonNullable<GaReport["rows"]>[number], i: number) =>
  row.dimensionValues?.[i]?.value ?? "";
const met = (row: NonNullable<GaReport["rows"]>[number], i: number) =>
  num(row.metricValues?.[i]?.value);

function parseTotals(
  report: GaReport | undefined,
  withPrevious: boolean,
): { current: Totals; previous: Totals | null } {
  const empty = (): Totals => ({ activeUsers: 0, sessions: 0, views: 0, avgEngagementSeconds: null });
  const current = empty();
  const previous = withPrevious ? empty() : null;
  for (const row of report?.rows ?? []) {
    // Com 2 intervalos, o GA4 acrescenta a dimensão `dateRange` (nome do intervalo).
    const target = previous && dim(row, 0) === "anterior" ? previous : current;
    const users = met(row, 0);
    target.activeUsers = users;
    target.sessions = met(row, 1);
    target.views = met(row, 2);
    target.avgEngagementSeconds = users > 0 ? met(row, 3) / users : null;
  }
  return { current, previous };
}

/** Por hora (dimensão `hour`, "00"…"23"), de 0h até a última hora com dados. */
function parseHourly(report: GaReport | undefined): DailyPoint[] {
  const byHour = new Map<number, DailyPoint>();
  for (const row of report?.rows ?? []) {
    const raw = dim(row, 0);
    if (!/^\d{1,2}$/.test(raw)) continue;
    const h = Number(raw);
    if (h > 23) continue;
    const key = String(h).padStart(2, "0");
    byHour.set(h, { date: key, sessions: met(row, 0), users: met(row, 1), views: met(row, 2) });
  }
  if (byHour.size === 0) return [];
  const last = Math.max(...byHour.keys());
  return Array.from({ length: last + 1 }, (_, h) =>
    byHour.get(h) ?? { date: String(h).padStart(2, "0"), sessions: 0, users: 0, views: 0 },
  );
}

function parseDaily(report: GaReport | undefined): DailyPoint[] {
  const byDate = new Map<string, DailyPoint>();
  for (const row of report?.rows ?? []) {
    const raw = dim(row, 0); // AAAAMMDD
    if (!/^\d{8}$/.test(raw)) continue;
    const date = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
    byDate.set(date, { date, sessions: met(row, 0), users: met(row, 1), views: met(row, 2) });
  }
  const dates = [...byDate.keys()].sort();
  if (dates.length === 0) return [];
  // Dias sem linha entre o 1º e o último com dados = zero atividade real.
  const out: DailyPoint[] = [];
  const end = new Date(`${dates[dates.length - 1]}T00:00:00Z`);
  for (let d = new Date(`${dates[0]}T00:00:00Z`); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    out.push(byDate.get(key) ?? { date: key, sessions: 0, users: 0, views: 0 });
  }
  return out;
}

const CHANNEL_LABELS: Record<string, string> = {
  Direct: "Direto",
  "Organic Search": "Busca orgânica",
  "Paid Search": "Busca paga",
  "Organic Social": "Social orgânico",
  "Paid Social": "Social pago",
  Referral: "Referência",
  Email: "E-mail",
  "Organic Video": "Vídeo orgânico",
  "Paid Video": "Vídeo pago",
  Display: "Display",
  "Organic Shopping": "Shopping orgânico",
  "Paid Shopping": "Shopping pago",
  "Paid Other": "Outros pagos",
  "Cross-network": "Rede cruzada",
  Affiliates: "Afiliados",
  SMS: "SMS",
  "Mobile Push Notifications": "Notificações push",
  Unassigned: "Não atribuído",
};

/** Ordem fixa dos grupos de origem pedidos pela FTF. */
export const SOURCE_GROUPS = [
  "Google",
  "Instagram",
  "Facebook",
  "WhatsApp",
  "Acesso direto",
  "Outras fontes",
] as const;

export function sourceGroupOf(source: string): (typeof SOURCE_GROUPS)[number] {
  const s = source.toLowerCase();
  if (s === "(direct)") return "Acesso direto";
  if (s.includes("google")) return "Google";
  if (s.includes("instagram") || s === "ig") return "Instagram";
  if (s.includes("facebook") || s === "fb" || s === "meta") return "Facebook";
  if (s.includes("whatsapp") || s === "wa" || s === "wa.me") return "WhatsApp";
  return "Outras fontes";
}

function parseAcquisition(report: GaReport | undefined) {
  const channels = new Map<string, number>();
  const groups = new Map<string, number>(SOURCE_GROUPS.map((g) => [g, 0]));
  const sourceMedium = new Map<string, number>();
  for (const row of report?.rows ?? []) {
    const channel = dim(row, 0);
    const source = dim(row, 1);
    const medium = dim(row, 2);
    const sessions = met(row, 0);
    const channelLabel = CHANNEL_LABELS[channel] ?? channel;
    channels.set(channelLabel, (channels.get(channelLabel) ?? 0) + sessions);
    const group = sourceGroupOf(source);
    groups.set(group, (groups.get(group) ?? 0) + sessions);
    const sm = `${source} / ${medium}`;
    sourceMedium.set(sm, (sourceMedium.get(sm) ?? 0) + sessions);
  }
  const sorted = (m: Map<string, number>): LabeledCount[] =>
    [...m].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  return {
    channels: sorted(channels),
    sourceGroups: SOURCE_GROUPS.map((label) => ({ label, value: groups.get(label) ?? 0 })),
    sourceMedium: sorted(sourceMedium).slice(0, 8),
  };
}

async function fetchDashboard(propertyId: string, period: Period): Promise<DashboardData> {
  void propertyId; // parte da chave do cache: trocar de propriedade não reaproveita dados
  const reports = await batchRunReports(buildRequests(period));
  const [totals, daily, pages, acquisition, campaigns] = reports;
  const today = period === "hoje";

  return {
    period,
    granularity: today ? "hour" : "day",
    totals: parseTotals(totals, !today),
    daily: today ? parseHourly(daily) : parseDaily(daily),
    pages: (pages?.rows ?? []).map((row) => ({
      path: dim(row, 0) || "(sem caminho)",
      views: met(row, 0),
      users: met(row, 1),
    })),
    ...parseAcquisition(acquisition),
    campaigns: (campaigns?.rows ?? []).map((row) => ({
      name: dim(row, 0),
      sourceMedium: dim(row, 1),
      sessions: met(row, 0),
      engagedSessions: met(row, 1),
    })),
    notes: {
      thresholded: reports.some((r) => r?.metadata?.subjectToThresholding === true),
      otherRow: reports.some((r) => r?.metadata?.dataLossFromOtherRow === true),
      sampled: reports.some((r) => (r?.metadata?.samplingMetadatas?.length ?? 0) > 0),
    },
    fetchedAt: new Date().toISOString(),
  };
}

const cachedDashboard = unstable_cache(fetchDashboard, ["intelligence-ga4-dashboard-v2"], {
  revalidate: CACHE_SECONDS,
  tags: ["intelligence-ga4"],
});
const cachedToday = unstable_cache(fetchDashboard, ["intelligence-ga4-today-v1"], {
  revalidate: TODAY_CACHE_SECONDS,
  tags: ["intelligence-ga4"],
});

export async function getDashboard(period: Period): Promise<DashboardResult> {
  const status = readCredentials();
  if (!status.ok) return { status: "not_configured", missing: status.missing };

  try {
    const load = period === "hoje" ? cachedToday : cachedDashboard;
    const data = await load(status.credentials.propertyId, period);
    const { current, previous } = data.totals;
    const empty =
      current.sessions === 0 &&
      current.views === 0 &&
      (previous === null || (previous.sessions === 0 && previous.views === 0));
    return empty ? { status: "empty", data } : { status: "ok", data };
  } catch (error) {
    const kind =
      error instanceof GaDataError && error.kind !== "not_configured" ? error.kind : "network";
    // Só o tipo do erro vai para o log — nunca credenciais ou tokens.
    console.error(`[inteligencia] GA4 Data API: ${kind}`);
    return { status: "error", kind };
  }
}
