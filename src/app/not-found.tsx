export default function NotFound() {
  return (
    // `data-ftf-not-found`: a medição reporta esta tela como /404, sem o
    // caminho digitado (que poderia ser um link privado mal copiado).
    <section
      data-ftf-not-found
      className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center sm:px-8"
    >
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
        {/* <a> comum: este 404 também atende áreas privadas — voltar ao
            início é sempre um documento novo. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          className="mt-2 rounded-full border border-brass/50 px-6 py-2.5 text-sm font-medium uppercase tracking-[0.24em] text-bone transition-colors hover:border-brass"
        >
          Voltar ao início
        </a>
      </div>
    </section>
  );
}
