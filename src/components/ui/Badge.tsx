type BadgeProps = {
  children: React.ReactNode;
  className?: string;
};

/** Etiqueta discreta em versalete — categorias, tipo de evento, estados. */
export function Badge({ children, className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border border-hairline bg-raised/60",
        "px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-bone-dim",
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
