/**
 * Peças visuais compartilhadas dos formulários do painel.
 * Só classes/So markup — nada de estado aqui (o `SubmitButton` é à parte).
 */

// `text-base` (16px) evita o zoom automático do iOS ao focar o campo.
export const fieldClass =
  "w-full rounded-lg border border-hairline bg-surface px-4 py-3 text-base text-bone outline-none transition-colors placeholder:text-bone-dim/50 focus:border-brass/60";

export const labelClass =
  "flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.2em] text-bone-dim";

export const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-brass px-6 py-3 text-sm font-medium uppercase tracking-[0.22em] text-ink transition-colors hover:bg-brass-soft disabled:cursor-not-allowed disabled:opacity-60";

export const ghostButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-brass/50 px-6 py-3 text-sm font-medium uppercase tracking-[0.22em] text-bone transition-colors hover:border-brass";

export const subtleButtonClass =
  "inline-flex min-h-9 items-center justify-center rounded-full border border-hairline px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-bone-dim transition-colors hover:border-brass/50 hover:text-bone disabled:cursor-not-allowed disabled:opacity-40";

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span role="alert" className="text-xs font-normal normal-case tracking-normal text-brass-soft">
      {message}
    </span>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-brass/30 bg-raised/60 px-4 py-3 text-sm text-brass-soft"
    >
      {message}
    </p>
  );
}
