import type { Metadata } from "next";
import { WHATSAPP_MESSAGES } from "@/config/site";
import { OG_BASE } from "@/config/seo";
import { isPackageEventType } from "@/config/packages";
import { WhatsAppCTA } from "@/components/public/WhatsAppCTA";
import { PackagesExplorer } from "@/components/public/PackagesExplorer";

const DESCRIPTION =
  "Pacotes de produção audiovisual da Felipe & Tamires Films para casamento, 15 anos e aniversário — do essencial (Essência) à cobertura completa (Experiência). Sem preços fixos: cada orçamento é conversado.";

// `canonical` fixo em `/pacotes`: os estados `?evento=casamento|15-anos|
// aniversario` são a MESMA página (a seleção é client-side), não URLs
// indexáveis separadas.
export const metadata: Metadata = {
  title: "Pacotes de filmagem para casamento, 15 anos e aniversário",
  description: DESCRIPTION,
  alternates: { canonical: "/pacotes" },
  openGraph: {
    ...OG_BASE,
    type: "website",
    url: "/pacotes",
    title:
      "Pacotes de filmagem para casamento, 15 anos e aniversário · Felipe & Tamires Films",
    description: DESCRIPTION,
  },
};

export default async function PacotesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { evento } = await searchParams;
  const initialEvent = isPackageEventType(evento) ? evento : null;

  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 sm:px-8 sm:py-24 2xl:max-w-[88rem]">
      <div className="flex flex-col gap-16">
        <header data-reveal-stagger className="flex max-w-2xl flex-col gap-4">
          <span className="text-xs uppercase tracking-[0.32em] text-brass">
            Pacotes
          </span>
          <h1 className="font-display font-light leading-[1.05] text-bone [font-size:clamp(2.25rem,5vw,4rem)]">
            Um jeito de contar a sua história — do essencial ao completo.
          </h1>
          <p className="max-w-prose text-sm leading-relaxed text-bone-dim sm:text-base">
            Cada evento acontece uma vez só. Estes são os pacotes de filmagem
            que oferecemos para casamento, 15 anos e aniversário — três níveis
            que se somam, do registro dos momentos principais até a história
            inteira, sem cortes.
          </p>
        </header>

        <PackagesExplorer initialEvent={initialEvent} />

        <section
          data-reveal="soft"
          className="border-t border-hairline pt-12"
        >
          <div className="flex max-w-2xl flex-col gap-3">
            <h2 className="font-display text-2xl font-light leading-snug text-bone">
              Seu evento é diferente?
            </h2>
            <p className="text-sm leading-relaxed text-bone-dim sm:text-base">
              Cada história pede um olhar diferente. Conte pra gente o que você
              está planejando e vamos conversar sobre a melhor forma de
              registrá-la.
            </p>
            <div className="pt-3">
              <WhatsAppCTA
                message={WHATSAPP_MESSAGES.packagesOther}
                label="Falar com a gente"
                variant="secondary"
              />
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
