"use client";

import { ANALYTICS_CONFIGURED } from "@/lib/analytics/config";
import { openConsentPreferences } from "@/lib/analytics/consent";

/**
 * Reabre o painel de preferências de cookies (rodapé, política). Some quando
 * não há ferramenta opcional configurada — não há o que preferir.
 */
export function ConsentPreferencesButton({
  className = "",
  children = "Preferências de cookies",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  if (!ANALYTICS_CONFIGURED) return null;
  return (
    <button
      type="button"
      onClick={openConsentPreferences}
      aria-haspopup="dialog"
      className={className}
    >
      {children}
    </button>
  );
}
