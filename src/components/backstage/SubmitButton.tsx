"use client";

import { useFormStatus } from "react-dom";
import { primaryButtonClass, subtleButtonClass } from "./form-ui";

/**
 * Botão de envio que se desabilita sozinho enquanto a ação roda.
 * `variant="subtle"` para ações secundárias (publicar/arquivar/mover).
 */
export function SubmitButton({
  children,
  pendingLabel = "Salvando…",
  variant = "primary",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "subtle";
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={variant === "subtle" ? subtleButtonClass : primaryButtonClass}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
