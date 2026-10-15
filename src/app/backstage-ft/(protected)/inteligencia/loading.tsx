/** Esqueleto enquanto o servidor consulta o GA4 (ou troca de aba/período). */
export default function InteligenciaLoading() {
  const block = "rounded-xl border border-hairline bg-surface motion-safe:animate-pulse";
  return (
    <section
      aria-busy="true"
      aria-label="Carregando relatórios"
      className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 sm:px-8 2xl:max-w-[88rem]"
    >
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.32em] text-brass">Área administrativa</p>
          <h1 className="font-display text-4xl font-light text-bone sm:text-5xl">Inteligência</h1>
          <p className="text-sm text-bone-dim">Carregando…</p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`${block} h-28`} />
          ))}
        </div>
        <div className={`${block} h-72`} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className={`${block} h-60`} />
          <div className={`${block} h-60`} />
        </div>
      </div>
    </section>
  );
}
