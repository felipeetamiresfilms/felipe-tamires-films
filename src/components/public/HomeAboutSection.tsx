import Image from "next/image";
import { WHATSAPP_MESSAGES } from "@/config/site";
import { WhatsAppCTA } from "./WhatsAppCTA";

/**
 * Mini "Sobre nós" da home. Só conceitos já fornecidos — sem biografia,
 * anos de experiência, prêmios, números ou cidades inventados.
 *
 * A foto do casal fica em `public/imgs/felipe-e-tamires.jpg` e é servida
 * otimizada pelo next/image. Para trocá-la, substitua o arquivo (mesma
 * proporção retrato funciona melhor).
 */
export function HomeAboutSection() {
  return (
    <section id="sobre" className="scroll-mt-10">
      <div className="grid max-w-5xl items-center gap-10 md:grid-cols-[minmax(0,22rem)_1fr] md:gap-14">
        {/* Foto do casal */}
        <div
          data-reveal="image"
          className="relative mx-auto aspect-[4/5] w-full max-w-xs overflow-hidden rounded-xl border border-hairline bg-surface md:mx-0 md:max-w-none"
        >
          <Image
            src="/imgs/felipe-e-tamires.jpg"
            alt="Felipe e Tamires"
            fill
            sizes="(min-width: 768px) 22rem, 20rem"
            className="object-cover object-center"
          />
          {/* discreto tom de película sobre a foto */}
          <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/40 to-transparent" />
        </div>

        <div data-reveal-stagger className="flex flex-col gap-5">
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
