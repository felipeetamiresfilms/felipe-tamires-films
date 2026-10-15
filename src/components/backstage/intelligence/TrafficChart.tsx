"use client";

import { useId, useState } from "react";
import type { DailyPoint } from "@/lib/intelligence/types";

/**
 * Sessões por dia — série única (linha 2px + área suave), uma escala só.
 * Textos ficam em HTML (legíveis no celular); o SVG só desenha a forma.
 * Ponteiro/toque/teclado mostram um cursor com o dia e as três métricas,
 * cada uma rotulada (usuários, sessões e visualizações não se somam).
 * Uma tabela com todos os dias fica disponível para leitores de tela.
 */

const int = new Intl.NumberFormat("pt-BR");

type Granularity = "day" | "hour";

function shortDate(key: string, granularity: Granularity) {
  if (granularity === "hour") return `${Number(key)}h`;
  const [, m, d] = key.split("-");
  return `${d}/${m}`;
}

function longDate(key: string, granularity: Granularity) {
  if (granularity === "hour") {
    const h = Number(key);
    return `Das ${h}h às ${h + 1}h`;
  }
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${key}T00:00:00Z`));
}

function niceMax(value: number) {
  if (value <= 4) return 4;
  const exp = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * exp >= value) ?? 10;
  return step * exp;
}

export function TrafficChart({
  points,
  granularity = "day",
}: {
  points: DailyPoint[];
  /** "hour" = pontos por hora do dia (período "hoje"). */
  granularity?: Granularity;
}) {
  const unit = granularity === "hour" ? "hora" : "dia";
  const [active, setActive] = useState<number | null>(null);
  const tableId = useId();

  if (points.length === 0) return null;

  const max = niceMax(Math.max(...points.map((p) => p.sessions)));
  const n = points.length;
  const x = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const y = (v: number) => 100 - (v / max) * 100;

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.sessions)}`).join(" ");
  const area = `${line} L${x(n - 1)},100 L${x(0)},100 Z`;
  const ticks = [max, max / 2, 0];
  const xLabels = n > 2 ? [0, Math.floor((n - 1) / 2), n - 1] : points.map((_, i) => i);

  const pick = (clientX: number, rect: DOMRect) => {
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setActive(Math.round(ratio * (n - 1)));
  };

  const current = active !== null ? points[active] : null;

  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="sr-only">
        Sessões por {unit} no período. Tabela completa a seguir.
      </figcaption>
      <div className="flex gap-3">
        {/* eixo Y */}
        <div className="relative w-8 shrink-0 text-right text-[11px] tabular-nums text-bone-dim" aria-hidden="true">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-0 -translate-y-1/2"
              style={{ top: `${y(t)}%` }}
            >
              {int.format(t)}
            </span>
          ))}
        </div>

        <div
          role="img"
          aria-label={`Gráfico de sessões por ${unit}. Use as setas para percorrer os pontos.`}
          aria-describedby={tableId}
          tabIndex={0}
          className="relative h-44 flex-1 touch-pan-y rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brass/60 sm:h-56"
          onPointerMove={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
          onPointerDown={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
          onPointerLeave={() => setActive(null)}
          onBlur={() => setActive(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") setActive((a) => Math.min(n - 1, (a ?? -1) + 1));
            else if (e.key === "ArrowLeft") setActive((a) => Math.max(0, (a ?? n) - 1));
            else return;
            e.preventDefault();
          }}
        >
          {/* grade recessiva */}
          {ticks.map((t) => (
            <div
              key={t}
              aria-hidden="true"
              className={`absolute inset-x-0 border-t ${t === 0 ? "border-hairline" : "border-hairline/50 border-dashed"}`}
              style={{ top: `${y(t)}%` }}
            />
          ))}

          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
            aria-hidden="true"
          >
            <path d={area} className="fill-brass/10" />
            <path
              d={line}
              className="fill-none stroke-brass"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {current && active !== null ? (
            <>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 w-px bg-bone/30"
                style={{ left: `${x(active)}%` }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-brass"
                style={{ left: `${x(active)}%`, top: `${y(current.sessions)}%` }}
              />
              <div
                role="status"
                className={`pointer-events-none absolute top-0 z-10 w-44 rounded-lg border border-hairline bg-raised px-3 py-2.5 text-xs shadow-[0_12px_30px_-12px_rgba(0,0,0,0.8)] ${
                  x(active) > 55 ? "-translate-x-[calc(100%+10px)]" : "translate-x-[10px]"
                }`}
                style={{ left: `${x(active)}%` }}
              >
                <p className="mb-1.5 first-letter:uppercase text-bone">{longDate(current.date, granularity)}</p>
                <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 text-bone-dim">
                  <dt>Sessões</dt>
                  <dd className="tabular-nums text-bone">{int.format(current.sessions)}</dd>
                  <dt>Usuários</dt>
                  <dd className="tabular-nums text-bone">{int.format(current.users)}</dd>
                  <dt>Visualizações</dt>
                  <dd className="tabular-nums text-bone">{int.format(current.views)}</dd>
                </dl>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* eixo X */}
      <div className="relative ml-11 h-4 text-[11px] tabular-nums text-bone-dim" aria-hidden="true">
        {xLabels.map((i) => (
          <span
            key={i}
            className={`absolute ${i === 0 ? "" : i === n - 1 ? "-translate-x-full" : "-translate-x-1/2"}`}
            style={{ left: `${x(i)}%` }}
          >
            {shortDate(points[i].date, granularity)}
          </span>
        ))}
      </div>

      <details className="group text-xs text-bone-dim">
        <summary className="cursor-pointer select-none uppercase tracking-[0.2em] hover:text-bone">
          Ver tabela
        </summary>
        <div className="mt-3 max-h-64 overflow-auto rounded-lg border border-hairline">
          <table id={tableId} className="w-full text-left tabular-nums">
            <caption className="sr-only">Sessões, usuários e visualizações por {unit}</caption>
            <thead className="sticky top-0 bg-surface text-[11px] uppercase tracking-[0.16em] text-brass">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">{granularity === "hour" ? "Hora" : "Dia"}</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Sessões</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Usuários</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Visualizações</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.date} className="border-t border-hairline">
                  <th scope="row" className="px-3 py-1.5 font-normal text-bone">{shortDate(p.date, granularity)}</th>
                  <td className="px-3 py-1.5 text-right">{int.format(p.sessions)}</td>
                  <td className="px-3 py-1.5 text-right">{int.format(p.users)}</td>
                  <td className="px-3 py-1.5 text-right">{int.format(p.views)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
