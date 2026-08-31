import { WHATSAPP_MESSAGES } from "@/config/site";
import { Wordmark } from "@/components/ui/Wordmark";
import { WhatsAppCTA } from "./WhatsAppCTA";

/**
 * Mini "Sobre nós" da home. Só conceitos já fornecidos — sem biografia,
 * anos de experiência, prêmios, números ou cidades inventados.
 *
 * Funciona SEM foto: o lado visual é um "quadro" tipográfico proposital
 * (não um espaço de imagem quebrado). Para adicionar uma foto real do casal
 * no futuro, basta trocar o conteúdo interno do painel por <Image />.
 */
export function HomeAboutSection() {
  return (
    <section id="sobre" className="scroll-mt-10">
      <div className="grid max-w-5xl items-center gap-10 md:grid-cols-[minmax(0,22rem)_1fr] md:gap-14">
        {/* Painel — lugar de uma futura foto do casal */}
        <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl border border-hairline bg-surface md:aspect-[4/5]">
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              backgroundImage: [
                "radial-gradient(110% 80% at 20% 10%, rgba(216,189,147,0.16), transparent 60%)",
                "radial-gradient(120% 120% at 85% 100%, rgba(120,88,58,0.28), transparent 55%)",
                "linear-gradient(160deg, #1d1712 0%, #0c0a08 100%)",
              ].join(","),
            }}
          />
          <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-white/5" />
          <div className="relative flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <Wordmark size="lg" />
            <p className="text-xs uppercase tracking-[0.28em] text-bone-dim">
              Dos dois lados da câmera
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <p className="text-xs uppercase tracking-[0.32em] text-brass">
            Sobre nós
          </p>
          <h2 className="font-display font-light leading-[1.05] text-bone [font-size:clamp(1.9rem,4.5vw,3rem)]">
            Felipe &amp; Tamires
          </h2>
          <div className="flex max-w-prose flex-col gap-4 text-sm leading-relaxed text-bone-dim sm:text-base">
            <p>
              Somos Felipe e Tamires. Ficamos dos dois lados da câmera para
              contar histórias de gente real.
            </p>
            <p>
              Os melhores registros acontecem quando vocês conseguem viver o
              momento de verdade — e quase esquecem que existe uma câmera por
              perto. É assim que buscamos construir filmes naturais e
              emocionais, capazes de devolver as sensações daquele dia.
            </p>
          </div>
          <div className="pt-1">
            <WhatsAppCTA
              message={WHATSAPP_MESSAGES.about}
              label="Conte pra gente sobre o seu evento"
              variant="secondary"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
