import { CONTACT_LOCATION_LABELS } from "@/lib/analytics/contact";
import { getContacts } from "@/lib/intelligence/contacts";
import type { ContactsData, ContactsResult, Period } from "@/lib/intelligence/types";
import { BarList } from "./BarList";
import { Card, ERROR_TEXT, StateCard } from "./DashboardView";

/**
 * "Conversões e contatos" — cliques nos botões de WhatsApp do site
 * (`contact_click`). Carrega à parte do painel de tráfego (Suspense): uma
 * falha aqui não derruba o restante. Nenhum número sem vir da Data API.
 */

const int = new Intl.NumberFormat("pt-BR");
const rate = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });

function SectionHeader() {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-display text-3xl font-light text-bone">Conversões e contatos</h2>
      <p className="max-w-3xl text-sm leading-relaxed text-bone-dim">
        Cliques nos botões que abrem o WhatsApp da FTF. Um clique indica intenção de contato — não
        confirma que a mensagem foi enviada.
      </p>
    </div>
  );
}

export function ContactsSkeleton() {
  const block = "rounded-xl border border-hairline bg-surface motion-safe:animate-pulse";
  return (
    <div aria-busy="true" aria-label="Carregando contatos" className="flex flex-col gap-6">
      <SectionHeader />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${block} h-28`} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={`${block} h-60`} />
        <div className={`${block} h-60`} />
      </div>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-hairline bg-surface p-4 sm:p-5">
      <p className="text-[11px] uppercase leading-snug tracking-[0.18em] text-bone-dim">{label}</p>
      <p className="font-display text-3xl font-light tabular-nums text-bone sm:text-4xl">{value}</p>
      <p className="text-xs text-bone-dim">{hint}</p>
    </div>
  );
}

function CollectionNotes({ data }: { data: ContactsData }) {
  return (
    <div className="flex flex-col gap-1.5 text-xs leading-relaxed text-bone-dim">
      <p>
        A coleta de cliques começou com a publicação do rastreamento: dias anteriores não têm
        cliques registrados, então períodos que os incluem mostram uma taxa menor que a real. O GA4
        pode levar algumas horas (às vezes até 48 h) para processar eventos.
      </p>
      <p>
        Só são medidos visitantes que autorizaram “Estatísticas” no aviso de cookies. Contagens de
        sessões do GA4 são aproximadas.
      </p>
      {data.notes.thresholded ? (
        <p>O GA4 aplicou limite de privacidade a parte dos dados: números baixos podem estar ocultos.</p>
      ) : null}
      {data.notes.otherRow ? <p>Algumas linhas foram agrupadas pelo GA4 como “(other)”.</p> : null}
      {data.notes.sampled ? <p>Parte dos dados foi amostrada pelo GA4.</p> : null}
    </div>
  );
}

function ContactsReport({ data }: { data: ContactsData }) {
  const kpis = [
    { label: "Cliques para contato", value: int.format(data.clicks), hint: "eventos contact_click" },
    { label: "Sessões com contato", value: int.format(data.contactSessions), hint: "sessões com ao menos 1 clique" },
    {
      label: "Taxa de contato",
      value: data.contactRate === null ? "—" : rate.format(data.contactRate),
      hint:
        data.contactRate === null
          ? "sem sessões no período"
          : `${int.format(data.contactSessions)} de ${int.format(data.totalSessions)} sessões`,
    },
    {
      label: "Principal origem",
      value: data.topSource?.label ?? "—",
      hint: data.topSource ? `${int.format(data.topSource.sessions)} sessões com contato` : "sem dados",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {kpis.map((k) => (
          <Kpi key={k.label} {...k} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Contatos por origem">
          <BarList
            items={data.bySource.map((r) => ({ label: r.label, value: r.sessions }))}
            unit="sessões com contato"
          />
          <p className="text-xs text-bone-dim">Em sessões com contato, pela origem da sessão.</p>
        </Card>
        <Card title="Contatos por página">
          <BarList
            items={data.byPage.map((r) => ({
              label: r.label,
              value: r.clicks,
              hint: `${int.format(r.sessions)} ${r.sessions === 1 ? "sessão" : "sessões"}`,
            }))}
            unit="cliques"
            showShare={false}
          />
          <p className="text-xs text-bone-dim">
            Em cliques, pela página onde o botão foi tocado. Uma sessão pode aparecer em mais de uma
            página.
          </p>
        </Card>
        <Card title="Contatos por botão">
          {data.byButton.status === "ok" ? (
            <>
              <BarList
                items={data.byButton.rows.map((r) => ({
                  label: CONTACT_LOCATION_LABELS[r.location] ?? r.location,
                  value: r.clicks,
                }))}
                unit="cliques"
              />
              <p className="text-xs text-bone-dim">
                Em cliques. “(not set)” = cliques anteriores ao registro da dimensão no GA4.
              </p>
            </>
          ) : (
            <p className="text-sm leading-relaxed text-bone-dim">
              Relatório indisponível: registre a dimensão personalizada{" "}
              <code className="text-bone">contact_location</code> (escopo Evento) no GA4. Ver{" "}
              <code className="text-bone">docs/analytics-gtm.md</code>.
            </p>
          )}
        </Card>
        <Card title="Contatos por campanha (UTM)">
          {data.byCampaign.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-sm tabular-nums">
                <caption className="sr-only">Campanhas UTM com cliques para contato</caption>
                <thead className="text-[11px] uppercase tracking-[0.16em] text-bone-dim">
                  <tr>
                    <th scope="col" className="pb-3 pr-4 font-medium">Campanha</th>
                    <th scope="col" className="pb-3 pr-4 text-right font-medium">Cliques</th>
                    <th scope="col" className="pb-3 text-right font-medium">Sessões com contato</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byCampaign.map((c) => (
                    <tr key={`${c.label}|${c.sourceMedium}`} className="border-t border-hairline">
                      <th scope="row" className="py-2.5 pr-4 font-normal text-bone">
                        {c.label}
                        <span className="block text-xs text-bone-dim">{c.sourceMedium}</span>
                      </th>
                      <td className="py-2.5 pr-4 text-right text-bone">{int.format(c.clicks)}</td>
                      <td className="py-2.5 text-right text-bone-dim">{int.format(c.sessions)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-bone-dim">Nenhum clique de contato veio de campanha UTM no período.</p>
          )}
        </Card>
      </div>

      <CollectionNotes data={data} />
    </div>
  );
}

export function ContactsView({ result }: { result: ContactsResult }) {
  if (result.status === "not_configured") return null;

  let body: React.ReactNode;
  if (result.status === "error") {
    const text = ERROR_TEXT[result.kind];
    body = (
      <StateCard eyebrow="Erro de conexão" title={text.title}>
        <p>{text.body}</p>
      </StateCard>
    );
  } else if (result.status === "empty") {
    body = (
      <StateCard eyebrow="Sem cliques" title="Ainda não há cliques de contato registrados neste período.">
        <p>
          Isso não indica falha: a coleta só começa depois que o rastreamento é publicado no site e
          configurado no GTM, e conta apenas visitantes que autorizaram “Estatísticas”.
        </p>
        {result.data.period === "hoje" ? (
          <p>Eventos de hoje podem levar algumas horas para aparecer no GA4.</p>
        ) : null}
      </StateCard>
    );
  } else {
    body = <ContactsReport data={result.data} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader />
      {body}
    </div>
  );
}

/** Busca e renderiza — usado dentro de <Suspense> na página. */
export async function ContactsSection({ period }: { period: Period }) {
  return <ContactsView result={await getContacts(period)} />;
}
