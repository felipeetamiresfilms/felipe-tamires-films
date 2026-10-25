import Image from "next/image";
import { WHATSAPP_MESSAGES } from "@/config/site";
import { WhatsAppCTA } from "./WhatsAppCTA";

/**
 * "Sobre nós" da home — reúne o antigo mini "Sobre nós" e o "Por trás dos
 * filmes" num só bloco, depois do catálogo: retrato do casal + texto, e as
 * duas fotos dos dois filmando. Só conceitos já fornecidos — sem biografia,
 * anos de experiência, prêmios, números ou cidades inventados.
 *
 * Fotos em `public/imgs/`: o retrato `felipe-e-tamires.jpg` (proporção
 * retrato funciona melhor ao trocar) e `*-filmando-1600.webp` (1600×900,
 * proporção original, sem filtros — as fotos são protagonistas).
 */
const PEOPLE = [
  {
    name: "Felipe",
    src: "/imgs/felipe-filmando-1600.webp",
    alt: "Felipe filmando um evento com a câmera no estabilizador e fone de comunicação",
  },
  {
    name: "Tamires",
    src: "/imgs/tamires-filmando-1600.webp",
    alt: "Tamires filmando um evento com a câmera no tripé",
  },
];

export function HomeAboutSection() {
  return (
    <section id="sobre" className="flex scroll-mt-10 flex-col gap-12 sm:gap-16">
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
          <h2 className="text-balance font-display font-light leading-[1.08] text-bone [font-size:clamp(1.9rem,4.5vw,3rem)]">
            Muito além das câmeras,{" "}
            <span className="italic text-brass-soft">
              duas pessoas apaixonadas por contar histórias.
            </span>
          </h2>
          <div className="flex max-w-prose flex-col gap-4 text-sm leading-relaxed text-bone-dim sm:text-base">
            <p>
              Somos Felipe e Tamires. Ficamos dos dois lados da câmera para
              contar histórias de gente real — e acreditamos que cada uma
              merece ser contada com sensibilidade, autenticidade e um olhar
              cinematográfico.
            </p>
            <p>
              Os melhores registros acontecem quando vocês conseguem viver o
              momento de verdade — e quase esquecem que existe uma câmera por
              perto. É assim que buscamos construir filmes naturais e
              emocionais, capazes de devolver as sensações daquele dia.
            </p>
            <p>
              Por trás de cada filme, existe o cuidado de quem entende que os
              momentos mais importantes não podem ser repetidos.
            </p>
          </div>
          <div className="pt-1">
            <WhatsAppCTA
              contactLocation="home_sobre"
              message={WHATSAPP_MESSAGES.about}
              label="Conte pra gente sobre o seu evento"
              variant="secondary"
            />
          </div>
        </div>
      </div>

      {/* Os dois em ação — mantém a âncora do antigo "Por trás dos filmes" */}
      <div
        id="por-tras-dos-filmes"
        className="grid scroll-mt-10 gap-8 md:grid-cols-2 md:gap-6 lg:gap-8"
      >
        {PEOPLE.map((person, i) => (
          <figure
            key={person.name}
            data-reveal="image"
            className={`flex flex-col gap-3 ${i === 1 ? "md:mt-12" : ""}`}
          >
            <div className="overflow-hidden rounded-xl border border-hairline bg-surface">
              <Image
                src={person.src}
                alt={person.alt}
                width={1600}
                height={900}
                sizes="(min-width: 1536px) 42rem, (min-width: 768px) 46vw, 100vw"
                className="h-auto w-full"
              />
            </div>
            <figcaption className="text-xs uppercase tracking-[0.32em] text-bone-dim">
              {person.name}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
