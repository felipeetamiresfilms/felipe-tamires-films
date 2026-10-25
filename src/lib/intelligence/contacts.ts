import "server-only";
import { unstable_cache } from "next/cache";
import { CONTACT_GA4_EVENT } from "@/lib/analytics/contact";
import { currentRange } from "./dashboard";
import { parseContacts } from "./contacts-report";
import { GaDataError, batchRunReports, readCredentials } from "./ga-data";
import type { ContactsData, ContactsResult, Period } from "./types";

/**
 * Conversões e contatos: evento `contact_click` na Data API, no MESMO
 * intervalo do painel de tráfego. Cache de 15 min (5 min em "hoje") por
 * (propriedade, período); erros nunca são cacheados.
 *
 * Duas chamadas por atualização:
 *  1. batch com 4 relatórios só de dimensões padrão (sempre disponíveis);
 *  2. ponto de contato, que depende da dimensão personalizada
 *     `contact_location` registrada no GA4. Enquanto ela não existir, a
 *     Data API recusa a consulta — só esse relatório fica indisponível.
 */

const CACHE_SECONDS = 900;
const TODAY_CACHE_SECONDS = 300;

const CONTACT_FILTER = {
  filter: { fieldName: "eventName", stringFilter: { matchType: "EXACT", value: CONTACT_GA4_EVENT } },
};
/** Cliques (eventos) e sessões com ao menos um clique — nesta ordem. */
const CONTACT_METRICS = [{ name: "eventCount" }, { name: "sessions" }];

function buildRequests(period: Period): object[] {
  const range = currentRange(period);
  return [
    // 0. Denominador da taxa: todas as sessões do período, sem filtro.
    { dateRanges: [range], metrics: [{ name: "sessions" }] },
    // 1. Por origem da sessão + totais calculados pelo GA4.
    {
      dateRanges: [range],
      dimensions: [{ name: "sessionSource" }],
      metrics: CONTACT_METRICS,
      dimensionFilter: CONTACT_FILTER,
      metricAggregations: ["TOTAL"],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 250,
    },
    // 2. Por página onde o clique aconteceu.
    {
      dateRanges: [range],
      dimensions: [{ name: "pagePath" }],
      metrics: CONTACT_METRICS,
      dimensionFilter: CONTACT_FILTER,
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      limit: 10,
    },
    // 3. Por campanha UTM (exclui "(not set)", "(direct)", "(organic)"…).
    {
      dateRanges: [range],
      dimensions: [{ name: "sessionCampaignName" }, { name: "sessionSourceMedium" }],
      metrics: CONTACT_METRICS,
      dimensionFilter: {
        andGroup: {
          expressions: [
            CONTACT_FILTER,
            {
              notExpression: {
                filter: {
                  fieldName: "sessionCampaignName",
                  stringFilter: { matchType: "BEGINS_WITH", value: "(" },
                },
              },
            },
          ],
        },
      },
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    },
  ];
}

function buttonRequest(period: Period): object {
  return {
    dateRanges: [currentRange(period)],
    dimensions: [{ name: "customEvent:contact_location" }],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: CONTACT_FILTER,
    orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
    limit: 20,
  };
}

async function fetchContacts(propertyId: string, period: Period): Promise<ContactsData> {
  void propertyId; // parte da chave do cache
  const [main, button] = await Promise.all([
    batchRunReports(buildRequests(period)),
    batchRunReports([buttonRequest(period)]).then(
      (reports) => reports[0] ?? {},
      (error: unknown) => {
        // Dimensão ainda não registrada: só este relatório fica de fora.
        if (error instanceof GaDataError && error.kind === "invalid_request") return null;
        throw error;
      },
    ),
  ]);
  const [total, bySource, byPage, byCampaign] = main;
  return parseContacts({
    period,
    total,
    bySource,
    byPage,
    byCampaign,
    byButton: button,
    fetchedAt: new Date().toISOString(),
  });
}

const cachedContacts = unstable_cache(fetchContacts, ["intelligence-ga4-contacts-v1"], {
  revalidate: CACHE_SECONDS,
  tags: ["intelligence-ga4"],
});
const cachedTodayContacts = unstable_cache(fetchContacts, ["intelligence-ga4-contacts-today-v1"], {
  revalidate: TODAY_CACHE_SECONDS,
  tags: ["intelligence-ga4"],
});

export async function getContacts(period: Period): Promise<ContactsResult> {
  const status = readCredentials();
  if (!status.ok) return { status: "not_configured" };

  try {
    const load = period === "hoje" ? cachedTodayContacts : cachedContacts;
    const data = await load(status.credentials.propertyId, period);
    return data.clicks === 0 ? { status: "empty", data } : { status: "ok", data };
  } catch (error) {
    const kind =
      error instanceof GaDataError && error.kind !== "not_configured" ? error.kind : "network";
    console.error(`[inteligencia] contatos GA4 Data API: ${kind}`);
    return { status: "error", kind };
  }
}
