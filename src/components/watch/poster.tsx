import type { CSSProperties } from "react";

/** Índice estável (0..1) derivado do id — varia o pôster gerado. */
function seedFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 1000) / 1000;
}

/**
 * Pôster cinematográfico gerado só com CSS — usado como fallback quando não
 * há thumbnail (custom nem YouTube) e atrás do estado "ainda não disponível".
 * Preto quente + luz de latão, coerente com a identidade.
 */
export function FilmPoster({ seedId }: { seedId: string }) {
  const seed = seedFromId(seedId);
  const style: CSSProperties = {
    backgroundImage: [
      `radial-gradient(120% 85% at ${15 + seed * 30}% 12%, rgba(216,189,147,0.20), transparent 60%)`,
      `radial-gradient(130% 120% at ${75 - seed * 25}% 95%, rgba(120,88,58,0.30), transparent 55%)`,
      "linear-gradient(160deg, #1d1712 0%, #0c0a08 100%)",
    ].join(","),
  };

  return (
    <div className="absolute inset-0" style={style} aria-hidden="true">
      <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/5" />
    </div>
  );
}

/** Botão visual de play (não interativo — o card/hero inteiro é o alvo). */
export function PlayGlyph({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={[
        "flex items-center justify-center rounded-full border border-bone/25 bg-ink/40",
        "backdrop-blur-sm transition-colors duration-300 group-hover:border-brass/70",
        className,
      ].join(" ")}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-1/2 w-1/2 translate-x-[6%] fill-bone"
        aria-hidden="true"
      >
        <path d="M8 5v14l11-7z" />
      </svg>
    </span>
  );
}
