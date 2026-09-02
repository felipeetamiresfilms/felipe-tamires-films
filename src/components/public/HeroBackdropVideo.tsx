/**
 * Vídeo de fundo do hero da home. Arquivo local em `public/videos/`.
 *
 * `muted` + `loop` + `playsInline` => autoplay funciona sem JS e sem som.
 * Decorativo: `aria-hidden`, sem controles. Fica sobre o <AbstractBackdrop />,
 * que serve de cor de base enquanto o vídeo carrega.
 */
export function HeroBackdropVideo({ className = "" }: { className?: string }) {
  return (
    <video
      aria-hidden="true"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      className={`absolute inset-0 h-full w-full object-cover ${className}`}
    >
      <source src="/videos/hero.mp4" type="video/mp4" />
    </video>
  );
}
