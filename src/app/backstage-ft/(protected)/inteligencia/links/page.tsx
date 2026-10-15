import type { Metadata } from "next";
import { loadBackstageAccess } from "@/lib/admin/auth";
import { IntelligenceHeader } from "@/components/backstage/intelligence/IntelligenceHeader";
import { UtmBuilder } from "@/components/backstage/intelligence/UtmBuilder";

export const metadata: Metadata = { title: "Links UTM · Inteligência" };

export default async function LinksUtmPage() {
  const access = await loadBackstageAccess();
  if (access.state !== "ok") return null;

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 sm:px-8 2xl:max-w-[88rem]">
      <div className="rise flex flex-col gap-10">
        <IntelligenceHeader
          active="links"
          description="Gere links de divulgação com parâmetros UTM para identificar, nos relatórios, de onde vêm as visitas. Nada é salvo: o link é montado no seu navegador."
        />
        <UtmBuilder />
      </div>
    </section>
  );
}
