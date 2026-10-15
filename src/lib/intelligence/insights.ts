import type { DashboardData } from "./types";

/**
 * Resumos determinísticos a partir dos números reais — sem IA, sem
 * extrapolação. Cada frase só aparece quando os dados a sustentam.
 */

const int = new Intl.NumberFormat("pt-BR");
const pct = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

/** Abaixo disso, variações percentuais dizem pouco. */
const SMALL_SAMPLE = 30;
/** Variação considerada "estável". */
const STABLE = 0.05;

export function relativeChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return (current - previous) / previous;
}

export function buildInsights(data: DashboardData): string[] {
  const out: string[] = [];
  const { current, previous } = data.totals;
  const days = data.period;

  // Sem período anterior (dia em andamento): nenhuma frase de variação.
  const change = previous ? relativeChange(current.sessions, previous.sessions) : null;
  if (!previous) {
    // nada a comparar
  } else if (change === null) {
    if (current.sessions > 0) {
      out.push(
        `Não há base de comparação: nenhuma sessão foi registrada nos ${days} dias anteriores.`,
      );
    }
  } else if (Math.abs(change) < STABLE) {
    out.push(
      `As sessões ficaram estáveis em relação aos ${days} dias anteriores (${int.format(previous.sessions)} → ${int.format(current.sessions)}).`,
    );
  } else {
    out.push(
      `As sessões ${change > 0 ? "subiram" : "caíram"} ${pct.format(Math.abs(change) * 100)}% em relação aos ${days} dias anteriores (${int.format(previous.sessions)} → ${int.format(current.sessions)}).`,
    );
  }

  const groupsTotal = data.sourceGroups.reduce((sum, g) => sum + g.value, 0);
  const topGroup = [...data.sourceGroups].sort((a, b) => b.value - a.value)[0];
  if (topGroup && topGroup.value > 0 && groupsTotal > 0) {
    out.push(
      `A maior origem de sessões foi ${topGroup.label} (${pct.format((topGroup.value / groupsTotal) * 100)}% das sessões).`,
    );
  }

  const topPage = data.pages[0];
  if (topPage && topPage.views > 0) {
    out.push(
      `A página mais visitada foi ${topPage.path} (${int.format(topPage.views)} ${topPage.views === 1 ? "visualização" : "visualizações"}).`,
    );
  }

  const topCampaign = data.campaigns[0];
  if (topCampaign) {
    out.push(
      `A campanha com mais sessões foi “${topCampaign.name}” (${int.format(topCampaign.sessions)} ${topCampaign.sessions === 1 ? "sessão" : "sessões"}).`,
    );
  } else if (current.sessions > 0) {
    out.push("Nenhuma sessão chegou por links com campanha UTM neste período.");
  }

  // Só faz sentido onde há variação percentual (não no dia em andamento).
  if (previous && current.sessions > 0 && current.sessions < SMALL_SAMPLE) {
    out.push(
      "Volume ainda pequeno: trate as variações percentuais com cautela.",
    );
  }

  return out;
}
