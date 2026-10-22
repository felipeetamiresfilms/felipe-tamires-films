import Image from "next/image";

/**
 * "Por trás dos filmes" — Felipe e Tamires trabalhando em eventos.
 * As fotos são protagonistas: proporção original (16:9), sem filtros nem
 * overlays. Só conceitos fornecidos — nada de prêmios, anos ou formações.
 *
 * Arquivos em `public/imgs/*-filmando-1600.webp` (1600×900), servidos
 * otimizados pelo next/image; width/height fixos evitam layout shift.
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

export function HomeBehindSection() {
  return (
    <section
      id="por-tras-dos-filmes"
      className="flex scroll-mt-10 flex-col gap-10 sm:gap-14"
    >
      <div data-reveal-stagger className="flex max-w-3xl flex-col gap-5">
        <p className="text-xs uppercase tracking-[0.32em] text-brass">
          Por trás dos filmes
        </p>
        <h2 className="font-display font-light leading-[1.08] text-bone [font-size:clamp(1.9rem,4.5vw,3rem)]">
          Muito além das câmeras,{" "}
          <span className="italic text-brass-soft">
            duas pessoas apaixonadas por contar histórias.
          </span>
        </h2>
        <div className="flex max-w-prose flex-col gap-4 text-sm leading-relaxed text-bone-dim sm:text-base">
          <p>
            Somos Felipe e Tamires. Acreditamos que cada história merece ser
            contada com sensibilidade, autenticidade e um olhar
            cinematográfico.
          </p>
          <p>
            Por trás de cada filme, existe o cuidado de quem entende que os
            momentos mais importantes não podem ser repetidos.
          </p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 md:gap-6 lg:gap-8">
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
