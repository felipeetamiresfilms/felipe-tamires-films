"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Badge } from "@/components/ui/Badge";
import { videoCategoryLabels } from "@/lib/labels";
import type { WatchVideo } from "@/lib/events";
import { FilmPoster } from "./poster";

/**
 * Player cinematográfico em overlay.
 *
 *  - o iframe SÓ existe enquanto há um vídeo aberto -> fechar desmonta o
 *    iframe e o áudio para na hora (secção 14);
 *  - ESC e clique no fundo fecham (secção 11/25);
 *  - trava o scroll do fundo enquanto aberto (secção 26);
 *  - foco vai para "Fechar" ao abrir; um trap simples mantém o Tab dentro;
 *  - `createPortal` para o <body> escapa de qualquer stacking context.
 *
 * Só YouTube reproduz de fato nesta etapa. Outros providers / vídeos sem
 * embed mostram um estado elegante em vez de um iframe arbitrário.
 */
export function PlayerModal({
  video,
  eventTitle,
  onClose,
}: {
  video: WatchVideo | null;
  eventTitle: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!video) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], iframe, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [video, onClose]);

  if (!video || typeof document === "undefined") return null;

  const iframeSrc =
    video.playable && video.embedUrl
      ? `${video.embedUrl}?autoplay=1&playsinline=1&rel=0`
      : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/92 backdrop-blur-sm motion-safe:animate-[fade_.2s_ease-out] sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${video.title} — ${eventTitle}`}
        className="flex w-full max-w-6xl flex-col overflow-hidden border-hairline bg-raised sm:rounded-2xl sm:border"
      >
        <div className="relative aspect-video w-full bg-ink">
          {iframeSrc ? (
            <iframe
              key={video.id}
              src={iframeSrc}
              title={video.title}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
              <FilmPoster seedId={video.id} />
              <p className="relative max-w-sm text-sm leading-relaxed text-bone-dim">
                Este filme ainda não está disponível para reprodução neste
                dispositivo.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-hairline px-5 py-4 sm:px-6">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Badge>{videoCategoryLabels[video.category]}</Badge>
            <p className="truncate font-display text-lg font-light text-bone">
              {video.title}
            </p>
            <p className="truncate text-xs uppercase tracking-[0.18em] text-bone-dim">
              {eventTitle}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-brass/50 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.22em] text-bone transition-colors hover:border-brass focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brass/60"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
