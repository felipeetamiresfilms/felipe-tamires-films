import { Wordmark } from "@/components/ui/Wordmark";

/**
 * Home institucional provisória.
 * Serve apenas para validar a identidade visual — o CTA ainda não navega.
 */
export default function HomePage() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center sm:px-8">
      <div className="rise flex max-w-3xl flex-col items-center gap-8">
        <Wordmark size="lg" />

        <h1 className="font-display text-[clamp(2.5rem,7vw,5rem)] font-light leading-[1.05] tracking-[-0.01em] text-bone">
          Seus momentos.
          <br />
          <span className="italic text-brass-soft">Seus filmes.</span>
        </h1>

        <p className="max-w-xl text-base leading-relaxed text-bone-dim sm:text-lg">
          Guardamos o dia mais importante da sua história em forma de cinema —
          para reviver quando quiser, de onde quiser, quantas vezes quiser.
        </p>

        <div className="mt-2 flex flex-col items-center gap-3">
          <button
            type="button"
            aria-disabled="true"
            className="cursor-default rounded-full border border-brass/50 px-8 py-3 text-sm font-medium uppercase tracking-[0.24em] text-bone transition-colors hover:border-brass"
          >
            Acessar meu filme
          </button>
          <span className="text-xs uppercase tracking-[0.24em] text-bone-dim/80">
            Em breve · acesso por link privado
          </span>
        </div>
      </div>
    </section>
  );
}
