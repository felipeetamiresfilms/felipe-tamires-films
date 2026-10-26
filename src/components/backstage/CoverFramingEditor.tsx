"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { setPartnerCoverFramingAction } from "@/app/backstage-ft/(protected)/curadoria/actions";
import {
  DEFAULT_FRAME_POINT,
  MAX_COVER_ZOOM,
  MIN_COVER_ZOOM,
  framePointVars,
  type CoverFramePoint,
  type CoverFraming,
} from "@/lib/cover-framing";
import { subtleButtonClass } from "./form-ui";
import { SubmitButton } from "./SubmitButton";

/**
 * Editor do enquadramento da capa do parceiro (hero de /recomendamos/[slug]).
 * Arrastar move a foto, o controle deslizante aplica zoom; desktop e mobile são
 * ajustados separadamente. Nada é recortado: o resultado vira `cover_framing`
 * (x/y/zoom) e o hero aplica com CSS — mesmo `object-cover` + `scale` daqui.
 *
 * Proporções das prévias = hero real (`min-h-[46svh]`, largura total) em telas
 * de referência: desktop 1440×900 e mobile 390×844.
 */
const FRAMES = {
  desktop: {
    label: "Desktop",
    width: 1440,
    height: 414,
    // Medidas do hero real em px, convertidas para % da largura (cqw).
    padX: 176,
    padBottom: 64,
    titlePx: 64,
  },
  mobile: {
    label: "Mobile",
    width: 390,
    height: 388,
    padX: 24,
    padBottom: 56,
    titlePx: 32,
  },
} as const;

type FrameKey = keyof typeof FRAMES;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function samePoint(a: CoverFramePoint, b: CoverFramePoint): boolean {
  return a.x === b.x && a.y === b.y && a.zoom === b.zoom;
}

export function CoverFramingEditor({
  partnerId,
  partnerName,
  categoryName,
  metaLine,
  imageUrl,
  initial,
}: {
  partnerId: string;
  partnerName: string;
  categoryName: string;
  metaLine: string;
  imageUrl: string;
  initial: CoverFraming | null;
}) {
  const saved: CoverFraming = initial ?? {
    desktop: DEFAULT_FRAME_POINT,
    mobile: DEFAULT_FRAME_POINT,
  };
  const [framing, setFraming] = useState<CoverFraming>(saved);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);

  const dirty =
    !samePoint(framing.desktop, saved.desktop) ||
    !samePoint(framing.mobile, saved.mobile);
  const isDefault =
    samePoint(framing.desktop, DEFAULT_FRAME_POINT) &&
    samePoint(framing.mobile, DEFAULT_FRAME_POINT);

  const setPoint = (key: FrameKey, point: CoverFramePoint) =>
    setFraming((prev) => ({ ...prev, [key]: point }));

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-bone-dim">
        Arraste a foto para posicionar e use o zoom para aproximar. A prévia
        mostra o formato real do topo da página pública; o arquivo original não
        é alterado.
        {natural ? (
          <span className="block pt-1 text-xs text-bone-dim/80">
            Foto {natural.h > natural.w ? "vertical" : "horizontal"} ·{" "}
            {natural.w}×{natural.h}px
          </span>
        ) : null}
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)] lg:items-start">
        {(Object.keys(FRAMES) as FrameKey[]).map((key) => (
          <FramePreview
            key={key}
            frameKey={key}
            point={framing[key]}
            onChange={(point) => setPoint(key, point)}
            natural={natural}
            onNatural={setNatural}
            imageUrl={imageUrl}
            partnerName={partnerName}
            categoryName={categoryName}
            metaLine={metaLine}
          />
        ))}
      </div>

      <p className="text-xs text-bone-dim/80">
        A área visível varia um pouco conforme o tamanho de cada tela — mantenha
        rostos e detalhes importantes longe das bordas.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <form action={setPartnerCoverFramingAction}>
          <input type="hidden" name="partnerId" value={partnerId} />
          <input type="hidden" name="framing" value={JSON.stringify(framing)} />
          <SubmitButton pendingLabel="Salvando…">Salvar enquadramento</SubmitButton>
        </form>

        {dirty ? (
          <button
            type="button"
            onClick={() => setFraming(saved)}
            className={subtleButtonClass}
          >
            Desfazer alterações
          </button>
        ) : null}

        {initial ? (
          <form action={setPartnerCoverFramingAction}>
            <input type="hidden" name="partnerId" value={partnerId} />
            <input type="hidden" name="intent" value="reset" />
            <SubmitButton variant="subtle" pendingLabel="Restaurando…">
              Restaurar enquadramento padrão
            </SubmitButton>
          </form>
        ) : (
          <button
            type="button"
            disabled={isDefault}
            onClick={() =>
              setFraming({ desktop: DEFAULT_FRAME_POINT, mobile: DEFAULT_FRAME_POINT })
            }
            className={subtleButtonClass}
          >
            Restaurar enquadramento padrão
          </button>
        )}

        {dirty ? (
          <span role="status" className="text-xs text-brass-soft">
            Alterações não salvas
          </span>
        ) : null}
      </div>
    </div>
  );
}

function FramePreview({
  frameKey,
  point,
  onChange,
  natural,
  onNatural,
  imageUrl,
  partnerName,
  categoryName,
  metaLine,
}: {
  frameKey: FrameKey;
  point: CoverFramePoint;
  onChange: (point: CoverFramePoint) => void;
  natural: { w: number; h: number } | null;
  onNatural: (size: { w: number; h: number }) => void;
  imageUrl: string;
  partnerName: string;
  categoryName: string;
  metaLine: string;
}) {
  const frame = FRAMES[frameKey];
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    start: CoverFramePoint;
    denX: number;
    denY: number;
  } | null>(null);
  const hintId = useId();
  const zoomId = useId();

  /**
   * Quantos px de tela a foto anda quando `object-position` varia 100%.
   * Com `object-cover` a sobra é `ov`; com `scale(z)` ancorado no próprio
   * ponto (x%), um ponto da foto se move `-(w·(z−1) + z·ov)/100` por 1%.
   * 0 = eixo sem sobra (foto já encaixa exatamente): não há o que mover.
   */
  function travel(width: number, height: number, zoom: number) {
    if (!natural) return { denX: width * zoom, denY: height * zoom };
    const cover = Math.max(width / natural.w, height / natural.h);
    const ovX = natural.w * cover - width;
    const ovY = natural.h * cover - height;
    return {
      denX: width * (zoom - 1) + zoom * ovX,
      denY: height * (zoom - 1) + zoom * ovY,
    };
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    frameRef.current.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      start: point,
      ...travel(rect.width, rect.height, point.zoom),
    };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.pointerId !== event.pointerId) return;
    const dx = event.clientX - d.startX;
    const dy = event.clientY - d.startY;
    onChange({
      ...d.start,
      x: d.denX > 0.5 ? round1(clamp(d.start.x - (dx * 100) / d.denX, 0, 100)) : d.start.x,
      y: d.denY > 0.5 ? round1(clamp(d.start.y - (dy * 100) / d.denY, 0, 100)) : d.start.y,
    });
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId === event.pointerId) drag.current = null;
  }

  // Setas movem a foto (mesmo sentido do arrastar); Shift = passo maior.
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 5 : 1;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      onChange({
        ...point,
        x: round1(clamp(point.x + move[0], 0, 100)),
        y: round1(clamp(point.y + move[1], 0, 100)),
      });
      return;
    }
    if (event.key === "+" || event.key === "=" || event.key === "-") {
      event.preventDefault();
      const delta = event.key === "-" ? -0.05 : 0.05;
      onChange({
        ...point,
        zoom: round2(clamp(point.zoom + delta, MIN_COVER_ZOOM, MAX_COVER_ZOOM)),
      });
    }
  }

  const cqw = (px: number) => `${((px / frame.width) * 100).toFixed(3)}cqw`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-xs uppercase tracking-[0.24em] text-bone-dim">
          {frame.label}
        </h3>
        <span className="text-xs tabular-nums text-bone-dim/80">
          {Math.round(point.x)}% · {Math.round(point.y)}%
        </span>
      </div>

      <div
        ref={frameRef}
        role="group"
        tabIndex={0}
        aria-roledescription="área de enquadramento"
        aria-label={`Prévia ${frame.label}: arraste a foto para enquadrar`}
        aria-describedby={hintId}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        className="relative isolate cursor-grab touch-none select-none overflow-hidden rounded-lg border border-hairline bg-ink outline-none focus-visible:ring-2 focus-visible:ring-brass active:cursor-grabbing"
        style={{
          aspectRatio: `${frame.width} / ${frame.height}`,
          containerType: "inline-size",
          ...framePointVars(point),
        }}
      >
        <div className="cover-frame-zoom absolute inset-0">
          <Image
            src={imageUrl}
            alt=""
            fill
            unoptimized
            draggable={false}
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="cover-frame-img pointer-events-none object-cover"
            onLoad={(e) => {
              const img = e.currentTarget;
              if (!natural && img.naturalWidth > 0) {
                onNatural({ w: img.naturalWidth, h: img.naturalHeight });
              }
            }}
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/10" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col"
          style={{
            paddingLeft: cqw(frame.padX),
            paddingRight: cqw(frame.padX),
            paddingBottom: cqw(frame.padBottom),
            gap: cqw(16),
          }}
        >
          <span
            className="uppercase tracking-[0.32em] text-brass"
            style={{ fontSize: cqw(12) }}
          >
            {categoryName}
          </span>
          <span
            className="font-display font-light leading-[1.03] text-bone"
            style={{ fontSize: cqw(frame.titlePx) }}
          >
            {partnerName}
          </span>
          {metaLine ? (
            <span
              className="uppercase tracking-[0.2em] text-bone-dim"
              style={{ fontSize: cqw(frameKey === "mobile" ? 14 : 16) }}
            >
              {metaLine}
            </span>
          ) : null}
        </div>
      </div>
      <p id={hintId} className="sr-only">
        Use as setas para mover a foto (Shift para passos maiores) e as teclas
        mais e menos para o zoom.
      </p>

      <div className="flex items-center gap-3">
        <label
          htmlFor={zoomId}
          className="text-xs uppercase tracking-[0.2em] text-bone-dim"
        >
          Zoom
        </label>
        <input
          id={zoomId}
          type="range"
          min={MIN_COVER_ZOOM}
          max={MAX_COVER_ZOOM}
          step={0.01}
          value={point.zoom}
          onChange={(e) =>
            onChange({ ...point, zoom: round2(Number(e.currentTarget.value)) })
          }
          aria-valuetext={`${point.zoom.toFixed(2)} vezes`}
          className="min-h-11 flex-1 accent-brass"
        />
        <span className="w-12 text-right text-xs tabular-nums text-bone-dim">
          {point.zoom.toFixed(2)}×
        </span>
      </div>
    </div>
  );
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
