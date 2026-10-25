/** Classes compartilhadas dos CTAs públicos — identidade Felipe & Tamires. */

const base =
  // < sm: corpo e tracking menores para rótulos longos ("Falar com Felipe &
  // Tamires") caberem numa linha em ~340px; se ainda quebrarem, centralizados.
  "group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full px-6 py-3.5 text-center text-balance text-[0.8125rem] font-medium uppercase leading-snug tracking-[0.14em] sm:px-7 sm:text-sm sm:tracking-[0.22em] transition duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/60 motion-safe:hover:-translate-y-px motion-safe:active:translate-y-0";

/** Ação principal — latão preenchido. */
export const ctaPrimaryClass = `${base} bg-brass text-ink hover:bg-brass-soft`;

/** Ação secundária — contorno discreto. */
export const ctaSecondaryClass = `${base} border border-brass/50 text-bone hover:border-brass`;
