"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import type { WatchVideo } from "@/lib/events";
import { FilmCard } from "./FilmCard";
import { PlayerModal } from "./PlayerModal";

type Props = {
  displayTitle: string;
  metaLine: string;
  /** <CoverImage> renderizado no servidor, ou null para o fallback CSS. */
  cover: ReactNode;
  videos: WatchVideo[];
  primaryVideoId: string | null;
};

export function WatchClient({
  displayTitle,
  metaLine,
  cover,
  videos,
  primaryVideoId,
}: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const open = useCallback((id: string, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setOpenId(id);
  }, []);

  const close = useCallback(() => {
    setOpenId(null);
    triggerRef.current?.focus();
    triggerRef.current = null;
  }, []);

  const openVideo = openId
    ? videos.find((video) => video.id === openId) ?? null
    : null;

  const feature =
    videos.find((video) => video.category === "main_film") ?? videos[0] ?? null;
  const rest = feature
    ? videos.filter((video) => video.id !== feature.id)
    : videos;
  const primary = primaryVideoId ?? feature?.id ?? null;

  return (
    <div className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="relative isolate flex min-h-[68svh] items-end overflow-hidden border-b border-hairline lg:min-h-[80vh]">
        {cover ? (
          <>
            {cover}
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/15" />
            <div className="absolute inset-0 bg-ink/20" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: [
                "radial-gradient(90% 60% at 20% 0%, rgba(216,189,147,0.16), transparent 60%)",
                "radial-gradient(120% 120% at 90% 100%, rgba(120,88,58,0.28), transparent 55%)",
                "linear-gradient(180deg, #14100c 0%, #0a0908 100%)",
              ].join(","),
            }}
          />
        )}

        <div className="relative mx-auto w-full max-w-6xl px-6 py-16 sm:px-8 sm:py-20 2xl:max-w-[88rem]">
          <div className="flex max-w-3xl flex-col gap-5">
            <Badge>Filme do evento</Badge>
            <h1 className="font-display font-light leading-[1.03] text-bone [font-size:clamp(2.5rem,7vw,6.5rem)]">
              {displayTitle}
            </h1>
            {metaLine ? (
              <p className="text-sm uppercase tracking-[0.22em] text-bone-dim sm:text-base">
                {metaLine}
              </p>
            ) : null}
            <p className="font-display font-light italic text-brass-soft [font-size:clamp(1.5rem,2.6vw,2.25rem)]">
              Reviva esse dia.
            </p>

            {primary ? (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={(event) => open(primary, event.currentTarget)}
                  className="inline-flex items-center gap-3 rounded-full bg-brass px-7 py-3.5 text-sm font-medium uppercase tracking-[0.22em] text-ink transition-colors hover:bg-brass-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/60"
                >
                  <span aria-hidden="true" className="text-base leading-none">
                    ▶
                  </span>
                  Assistir ao filme
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Coleção */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-8 sm:py-20 2xl:max-w-[88rem]">
        <div className="flex flex-col gap-10">
          <h2 className="text-xs uppercase tracking-[0.32em] text-brass">
            Seus filmes
          </h2>

          {videos.length === 0 ? (
            <p className="rounded-xl border border-hairline bg-surface p-6 text-sm text-bone-dim">
              Os filmes deste evento serão disponibilizados em breve.
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              {feature ? (
                <FilmCard video={feature} variant="feature" onOpen={open} />
              ) : null}
              {rest.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {rest.map((video) => (
                    <FilmCard key={video.id} video={video} onOpen={open} />
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>

      <PlayerModal video={openVideo} eventTitle={displayTitle} onClose={close} />
    </div>
  );
}
