import type { Metadata } from "next";
import { loadBackstageAccess } from "@/lib/admin/auth";
import { getDashboard } from "@/lib/intelligence/dashboard";
import { DEFAULT_PERIOD, PERIODS, type Period } from "@/lib/intelligence/types";
import { IntelligenceHeader } from "@/components/backstage/intelligence/IntelligenceHeader";
import { DashboardView, PeriodFilter } from "@/components/backstage/intelligence/DashboardView";

export const metadata: Metadata = { title: "Inteligência" };

// Sessão do painel (cookies) + dados por período: sempre por requisição.
// O cache dos números do GA4 fica na camada de dados (15 min).
export const dynamic = "force-dynamic";

function parsePeriod(value: string | string[] | undefined): Period {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "hoje") return "hoje";
  const n = Number(raw);
  return (PERIODS as readonly (string | number)[]).includes(n) ? (n as Period) : DEFAULT_PERIOD;
}

export default async function InteligenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string | string[] }>;
}) {
  // O layout já barra quem não é admin, mas layout e página renderizam em
  // paralelo: a página confere de novo ANTES de consultar o GA4.
  const access = await loadBackstageAccess();
  if (access.state !== "ok") return null;

  const period = parsePeriod((await searchParams).periodo);
  const result = await getDashboard(period);

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 sm:px-8 2xl:max-w-[88rem]">
      <div className="rise flex flex-col gap-10">
        <IntelligenceHeader
          active="relatorios"
          description="Tráfego e campanhas do site público, a partir do Google Analytics 4. Os números representam apenas visitantes que autorizaram “Estatísticas” no aviso de cookies; páginas privadas e o painel não são medidos."
        />
        {result.status !== "not_configured" ? <PeriodFilter period={period} /> : null}
        <DashboardView result={result} />
      </div>
    </section>
  );
}
