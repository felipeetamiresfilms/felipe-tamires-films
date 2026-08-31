import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center sm:px-8">
      <div className="flex max-w-md flex-col items-center gap-5">
        <p className="text-xs uppercase tracking-[0.32em] text-brass">
          Página não encontrada
        </p>
        <h1 className="font-display text-4xl font-light text-bone sm:text-5xl">
          Este link não existe ou expirou.
        </h1>
        <p className="text-sm leading-relaxed text-bone-dim">
          Confira o endereço recebido. Se o problema continuar, fale com a
          Felipe &amp; Tamires Films.
        </p>
        <Link
          href="/"
          className="mt-2 rounded-full border border-brass/50 px-6 py-2.5 text-sm font-medium uppercase tracking-[0.24em] text-bone transition-colors hover:border-brass"
        >
          Voltar ao início
        </Link>
      </div>
    </section>
  );
}
