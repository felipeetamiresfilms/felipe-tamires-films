type WordmarkProps = {
  /** "sm" para cabeçalho/rodapé, "lg" para telas de destaque */
  size?: "sm" | "lg";
  className?: string;
};

/**
 * Assinatura da marca "Felipe & Tamires Films".
 * O "&" recebe tratamento tipográfico (serifa em itálico, latão).
 */
export function Wordmark({ size = "sm", className = "" }: WordmarkProps) {
  const isLarge = size === "lg";

  return (
    <span
      className={[
        "inline-flex items-baseline gap-[0.3em] font-display font-light tracking-[0.02em] text-bone",
        isLarge ? "text-2xl sm:text-3xl" : "text-base",
        className,
      ].join(" ")}
    >
      <span>Felipe</span>
      <span className="italic text-brass" aria-hidden="true">
        &amp;
      </span>
      <span>Tamires</span>
      <span
        className={[
          "font-sans font-medium uppercase text-bone-dim",
          isLarge
            ? "ml-[0.35em] text-[0.5em] tracking-[0.42em]"
            : "ml-[0.25em] text-[0.62em] tracking-[0.36em]",
        ].join(" ")}
      >
        Films
      </span>
    </span>
  );
}
