import Link from "next/link";
import { buildInsights, relativeChange } from "@/lib/intelligence/insights";
import { PERIODS, type DashboardData, type DashboardResult, type Period } from "@/lib/intelligence/types";
import { BarList } from "./BarList";
import { TrafficChart } from "./TrafficChart";

/**
 * Renderiza o resultado do painel. Cada estado é explícito: integração não
 * configurada, erro (com o tipo), sem dados, ou dados reais. Nenhum número
 * é exibido sem ter vindo da Data API.
 */

const int = new Intl.NumberFormat("pt-BR");
const pct = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

function duration(seconds: number | null) {
  if (seconds === null) return "—";
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m} min ${String(s).padStart(2, "0")} s` : `${s} s`;
}

const ERROR_TEXT: Record<Extract<DashboardResult, { status: "error" }>["kind"], { title: string; body: string }> = {
  auth: {
    title: "Não foi possível autenticar no Google",
    body: "A conta de serviço foi recusada. Confira GA4_CLIENT_EMAIL e GA4_PRIVATE_KEY no ambiente do servidor.",
  },
  permission: {
    title: "Sem acesso à propriedade do GA4",
    body: "A conta de serviço não tem permissão nesta propriedade, ou o ID da propriedade (558916123, ou o valor de GA4_PROPERTY_ID, se definido) está incorreto. Adicione o e-mail da conta como Leitor em Administrador → Gerenciamento de acesso à propriedade.",
  },
  quota: {
    title: "Limite de consultas atingido",
    body: "A cota da Google Analytics Data API foi atingida por enquanto. Tente novamente mais tarde.",
  },
  invalid_request: {
    title: "A consulta foi recusada",
    body: "A Data API não aceitou a consulta. Os detalhes técnicos ficaram no registro do servidor.",
  },
  network: {
    title: "Não foi possível conectar à Data API",
    body: "Falha de conexão com o Google. Recarregue a página em instantes.",
  },
};

function StateCard({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-hairline bg-surface p-6 sm:p-8">
      <p className="text-xs uppercase tracking-[0.28em] text-brass">{eyebrow}</p>
      <h2 className="font-display text-2xl font-light text-bone">{title}</h2>
      <div className="flex max-w-2xl flex-col gap-3 text-sm leading-relaxed text-bone-dim">{children}</div>
    </div>
  );
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`flex flex-col gap-5 rounded-xl border border-hairline bg-surface p-5 sm:p-6 ${className}`}>
      <h2 className="text-xs uppercase tracking-[0.28em] text-brass">{title}</h2>
      {children}
    </section>
  );
}

function Delta({ current, previous, period }: { current: number; previous: number | null; period: Period }) {
  if (previous === null || period === "hoje") {
    return <p className="text-xs text-bone-dim">sem comparação (dia em andamento)</p>;
  }
  const change = relativeChange(current, previous);
  if (change === null) {
    return <p className="text-xs text-bone-dim">sem base nos {period} dias anteriores</p>;
  }
  const up = change > 0;
  const flat = Math.abs(change) < 0.005;
  return (
    <p className="text-xs text-bone-dim">
      <span aria-hidden="true">{flat ? "＝" : up ? "▲" : "▼"} </span>
      <span className="sr-only">{flat ? "Estável" : up ? "Aumento de" : "Queda de"} </span>
      <span className="tabular-nums text-bone">{pct.format(Math.abs(change) * 100)}%</span>{" "}
      vs. {period} dias anteriores
    </p>
  );
}

/** Dados do dia: parciais e sujeitos a atraso de processamento no GA4. */
function TodayNotice() {
  return (
    <p
      role="note"
      className="rounded-xl border border-brass/30 bg-brass/5 px-5 py-4 text-sm leading-relaxed text-bone-dim"
    >
      <span className="font-medium text-bone">Dados de hoje são parciais.</span> O GA4 pode levar
      algumas horas — e, em alguns casos, até 48 horas — para processar os eventos, então estes
      números ainda podem mudar. Por isso não há comparação com o dia anterior.
    </p>
  );
}

export function PeriodFilter({ period }: { period: Period }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs uppercase tracking-[0.2em] text-bone-dim">Período</span>
      <div className="flex gap-1 rounded-full border border-hairline p-1">
        {PERIODS.map((p) => (
          <Link
            key={p}
            href={`/backstage-ft/inteligencia?periodo=${p}`}
            aria-current={p === period ? "true" : undefined}
            className={[
              "min-h-9 rounded-full px-3 py-2 text-xs uppercase tracking-[0.18em] transition-colors sm:px-4",
              p === period ? "bg-raised text-bone" : "text-bone-dim hover:text-bone",
            ].join(" ")}
          >
            {p === "hoje" ? "Hoje" : `${p} dias`}
          </Link>
        ))}
      </div>
      <span className="text-xs text-bone-dim">
        {period === "hoje"
          ? "dia em andamento, no fuso horário da propriedade"
          : "dias completos, até ontem"}
      </span>
    </div>
  );
}

function Report({ data }: { data: DashboardData }) {
  const { current, previous } = data.totals;
  const insights = buildInsights(data);
  const kpis = [
    { label: "Usuários ativos", value: int.format(current.activeUsers), cur: current.activeUsers, prev: previous?.activeUsers ?? null },
    { label: "Sessões", value: int.format(current.sessions), cur: current.sessions, prev: previous?.sessions ?? null },
    { label: "Visualizações de página", value: int.format(current.views), cur: current.views, prev: previous?.views ?? null },
    {
      label: "Engajamento médio por usuário",
      value: duration(current.avgEngagementSeconds),
      cur: current.avgEngagementSeconds ?? 0,
      prev: previous ? (previous.avgEngagementSeconds ?? 0) : null,
    },
  ];
  const fetchedAt = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(data.fetchedAt));

  return (
    <div className="flex flex-col gap-6">
      {data.period === "hoje" ? <TodayNotice /> : null}
      {insights.length > 0 ? (
        <Card title="Resumo do período">
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-bone-dim marker:text-brass/70">
            {insights.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="flex flex-col gap-2 rounded-xl border border-hairline bg-surface p-4 sm:p-5">
            <p className="text-[11px] uppercase leading-snug tracking-[0.18em] text-bone-dim">{k.label}</p>
            <p className="font-display text-3xl font-light tabular-nums text-bone sm:text-4xl">{k.value}</p>
            <Delta current={k.cur} previous={k.prev} period={data.period} />
          </div>
        ))}
      </div>

      <Card title={data.granularity === "hour" ? "Sessões por hora (hoje)" : "Sessões por dia"}>
        {data.daily.length > 0 ? (
          <TrafficChart points={data.daily} granularity={data.granularity} />
        ) : (
          <p className="text-sm text-bone-dim">Sem sessões registradas no período.</p>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Origem das sessões">
          <BarList items={data.sourceGroups} unit="sessões" />
        </Card>
        <Card title="Canais (agrupamento do GA4)">
          <BarList items={data.channels} unit="sessões" />
        </Card>
        <Card title="Páginas mais visitadas">
          <BarList
            items={data.pages.map((p) => ({ label: p.path, value: p.views }))}
            unit="visualizações"
            showShare={false}
          />
          <p className="text-xs text-bone-dim">Contagem em visualizações de página.</p>
        </Card>
        <Card title="Origem / mídia">
          <BarList items={data.sourceMedium} unit="sessões" />
        </Card>
      </div>

      <Card title="Campanhas (UTM)">
        {data.campaigns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[30rem] text-left text-sm tabular-nums">
              <caption className="sr-only">Campanhas UTM por sessões</caption>
              <thead className="text-[11px] uppercase tracking-[0.16em] text-bone-dim">
                <tr>
                  <th scope="col" className="pb-3 pr-4 font-medium">Campanha</th>
                  <th scope="col" className="pb-3 pr-4 font-medium">Origem / mídia</th>
                  <th scope="col" className="pb-3 pr-4 text-right font-medium">Sessões</th>
                  <th scope="col" className="pb-3 text-right font-medium">Sessões engajadas</th>
                </tr>
              </thead>
              <tbody>
                {data.campaigns.map((c) => (
                  <tr key={`${c.name}|${c.sourceMedium}`} className="border-t border-hairline">
                    <th scope="row" className="py-2.5 pr-4 font-normal text-bone">{c.name}</th>
                    <td className="py-2.5 pr-4 text-bone-dim">{c.sourceMedium}</td>
                    <td className="py-2.5 pr-4 text-right text-bone">{int.format(c.sessions)}</td>
                    <td className="py-2.5 text-right text-bone-dim">{int.format(c.engagedSessions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-bone-dim">
            Nenhuma sessão com campanha UTM no período. Use a aba “Links UTM” para criar links de
            divulgação rastreáveis.
          </p>
        )}
      </Card>

      <div className="flex flex-col gap-1.5 text-xs leading-relaxed text-bone-dim">
        <p>
          Consultado em {fetchedAt} · os dados são atualizados a cada{" "}
          {data.period === "hoje" ? "5" : "15"} minutos.
        </p>
        {data.notes.thresholded ? (
          <p>O GA4 aplicou limite de privacidade a parte dos dados: números baixos podem estar ocultos.</p>
        ) : null}
        {data.notes.otherRow ? <p>Algumas linhas foram agrupadas pelo GA4 como “(other)”.</p> : null}
        {data.notes.sampled ? <p>Parte dos dados foi amostrada pelo GA4.</p> : null}
      </div>
    </div>
  );
}

export function DashboardView({ result }: { result: DashboardResult }) {
  if (result.status === "not_configured") {
    return (
      <StateCard eyebrow="Configuração pendente" title="Integração com o GA4 ainda não configurada">
        <p>
          O painel consulta a Google Analytics Data API pelo servidor. Nenhum número é exibido até a
          conexão estar configurada.
        </p>
        <p>
          Variáveis de ambiente pendentes (somente no servidor):{" "}
          {result.missing.map((name, i) => (
            <span key={name}>
              {i > 0 ? ", " : null}
              <code className="text-bone">{name}</code>
            </span>
          ))}
          .
        </p>
        <p>
          O passo a passo está em <code className="text-bone">docs/inteligencia-ga4.md</code>.
        </p>
      </StateCard>
    );
  }

  if (result.status === "error") {
    const text = ERROR_TEXT[result.kind];
    return (
      <StateCard eyebrow="Erro de conexão" title={text.title}>
        <p>{text.body}</p>
      </StateCard>
    );
  }

  if (result.status === "empty") {
    const today = result.data.period === "hoje";
    return (
      <StateCard
        eyebrow="Sem dados"
        title={today ? "Ainda não há dados de hoje" : "Ainda não há dados neste período"}
      >
        {today ? (
          <p>
            A conexão com o GA4 está funcionando, mas ainda não há sessões processadas hoje. Eventos
            recentes podem levar algumas horas para aparecer.
          </p>
        ) : (
          <>
            <p>
              A conexão com o GA4 está funcionando, mas não houve sessões registradas neste período
              nem no anterior. Os filtros de 7, 30 e 90 dias consideram apenas dias completos, até
              ontem.
            </p>
            <p>
              <Link
                href="/backstage-ft/inteligencia?periodo=hoje"
                className="text-bone underline decoration-brass/50 underline-offset-4 hover:decoration-brass"
              >
                Ver os dados de hoje
              </Link>
            </p>
          </>
        )}
        <p>
          Lembre-se: só são medidos visitantes que autorizam “Estatísticas” no aviso de cookies, nas
          páginas públicas do site.
        </p>
      </StateCard>
    );
  }

  return <Report data={result.data} />;
}
