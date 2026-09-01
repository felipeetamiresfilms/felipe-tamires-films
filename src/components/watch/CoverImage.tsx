import Image from "next/image";

/**
 * Capa do hero. `unoptimized` de propósito: a src é uma signed URL do
 * Supabase com `?token=` que muda a cada hora, e `remotePatterns` do
 * otimizador não casa querystring dinâmica. `unoptimized` emite um <img>
 * direto (sem passar pelo /_next/image e sem checagem de remotePatterns),
 * então nada precisa ser liberado no next.config para a capa.
 *
 * Server Component — passado como prop para <WatchClient> (que é client),
 * mantendo a imagem pesada fora do bundle de JS.
 *
 * `motion`:
 *   - "kenburns": escala lentíssima (~18s), quase imperceptível — usada na
 *     página pública de uma história. Não anima opacity, então não atrasa o LCP.
 *   - "fade": fade discreto de entrada (~0.5s) — usada nas capas privadas.
 *   - "none": sem animação.
 * Todas respeitam prefers-reduced-motion (o CSS fica sob `no-preference`).
 */
export function CoverImage({
  url,
  alt,
  motion = "none",
}: {
  url: string;
  alt: string;
  motion?: "kenburns" | "fade" | "none";
}) {
  const motionClass =
    motion === "kenburns"
      ? "cine-kenburns"
      : motion === "fade"
        ? "cine-cover-fade"
        : "";

  return (
    <Image
      src={url}
      alt={alt}
      fill
      priority
      unoptimized
      sizes="100vw"
      className={`object-cover ${motionClass}`.trim()}
    />
  );
}
