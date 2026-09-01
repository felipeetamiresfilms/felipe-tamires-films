"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { videoCategoryLabels } from "@/lib/labels";
import type { WatchVideo } from "@/lib/events";
import { FilmPoster, PlayGlyph } from "./poster";

type Props = {
  video: WatchVideo;
  /** "feature" ocupa a linha inteira; "default" é um card de grade. */
  variant?: "feature" | "default";
  onOpen: (id: string, trigger: HTMLElement) => void;
};

export function FilmCard({ video, variant = "default", onOpen }: Props) {
  const [posterFailed, setPosterFailed] = useState(false);
  const isFeature = variant === "feature";
  const showImage = Boolean(video.posterUrl) && !posterFailed;

  return (
    <button
      type="button"
      onClick={(event) => onOpen(video.id, event.currentTarget)}
      aria-label={`Assistir: ${video.title}`}
      className={[
        "group block w-full overflow-hidden rounded-xl border border-hairline bg-surface text-left",
        "transition duration-300 ease-out hover:border-brass/40 motion-safe:hover:-translate-y-1",
        "focus-visible:border-brass/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brass/50",
        isFeature ? "sm:grid sm:grid-cols-[1.5fr_1fr]" : "",
      ].join(" ")}
    >
      <div
        className={[
          "relative w-full overflow-hidden",
          isFeature ? "aspect-video sm:h-full" : "aspect-video",
        ].join(" ")}
      >
        {showImage ? (
          <Image
            src={video.posterUrl as string}
            alt=""
            fill
            sizes={
              isFeature
                ? "(min-width: 640px) 55vw, 100vw"
                : "(min-width: 1536px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
            }
            className="object-cover transition-transform duration-[450ms] ease-out motion-safe:group-hover:scale-[1.035]"
            onError={() => setPosterFailed(true)}
          />
        ) : (
          <FilmPoster seedId={video.id} />
        )}

        <span className="absolute inset-0 bg-ink/10 transition-colors duration-300 group-hover:bg-transparent" />
        <span className="absolute inset-0 flex items-center justify-center">
          <PlayGlyph className={isFeature ? "h-16 w-16" : "h-14 w-14"} />
        </span>

        {video.durationLabel ? (
          <span className="absolute bottom-3 right-3 rounded bg-ink/70 px-2 py-0.5 text-xs font-medium tabular-nums text-bone/90">
            {video.durationLabel}
          </span>
        ) : null}
      </div>

      <div
        className={
          isFeature
            ? "flex flex-col justify-center gap-3 p-6"
            : "flex flex-col gap-2 p-5"
        }
      >
        <Badge>{videoCategoryLabels[video.category]}</Badge>
        <h3
          className={[
            "font-display font-light leading-tight text-bone",
            isFeature ? "text-2xl sm:text-3xl" : "text-lg",
          ].join(" ")}
        >
          {video.title}
        </h3>
        {isFeature && video.description ? (
          <p className="max-w-prose text-sm leading-relaxed text-bone-dim">
            {video.description}
          </p>
        ) : null}
      </div>
    </button>
  );
}
