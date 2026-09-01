/** Classes compartilhadas dos CTAs públicos — identidade Felipe & Tamires. */

const base =
  "group inline-flex items-center justify-center gap-2.5 rounded-full px-7 py-3.5 text-sm font-medium uppercase tracking-[0.22em] transition duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/60 motion-safe:hover:-translate-y-px motion-safe:active:translate-y-0";

/** Ação principal — latão preenchido. */
export const ctaPrimaryClass = `${base} bg-brass text-ink hover:bg-brass-soft`;

/** Ação secundária — contorno discreto. */
export const ctaSecondaryClass = `${base} border border-brass/50 text-bone hover:border-brass`;
