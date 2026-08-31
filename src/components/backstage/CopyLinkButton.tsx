"use client";

import { useState, useSyncExternalStore } from "react";
import { subtleButtonClass } from "./form-ui";

/**
 * Copia o link ABSOLUTO de entrega do cliente.
 * A origem vem de `window.location.origin` — funciona em localhost e em
 * produção sem hardcode de domínio.
 *
 * `useSyncExternalStore` lê a origem sem descompasso de hidratação: no
 * servidor devolve "" e no browser o valor real.
 */
const noopSubscribe = () => () => {};

function useOrigin(): string {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => "",
  );
}

export function CopyLinkButton({ path }: { path: string }) {
  const origin = useOrigin();
  const [copied, setCopied] = useState(false);

  const absoluteUrl = origin ? `${origin}${path}` : path;

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard bloqueado: o texto ao lado fica visível para cópia manual.
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <code className="break-all rounded-lg border border-hairline bg-surface px-3 py-2 text-xs text-bone-dim">
          {absoluteUrl}
        </code>
        <button type="button" onClick={copy} className={subtleButtonClass}>
          {copied ? "Link copiado" : "Copiar link"}
        </button>
      </div>
      {copied ? (
        <span className="text-xs text-brass-soft">Link copiado.</span>
      ) : null}
    </div>
  );
}
