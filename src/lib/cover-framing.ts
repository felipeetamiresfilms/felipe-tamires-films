/**
 * Enquadramento NÃO destrutivo da capa de um parceiro (hero de
 * /recomendamos/[slug]). O arquivo original nunca é recortado: o ajuste é só
 * CSS — `object-position` (x/y em %) + `scale(zoom)` com origem no mesmo
 * ponto. Com `object-fit: cover`, zoom >= 1 e posição em 0–100% a imagem
 * sempre preenche o quadro, sem áreas vazias, vertical ou horizontal.
 *
 * Coluna `partners.cover_framing` (jsonb). `null` = enquadramento padrão
 * (centralizado, comportamento original).
 *
 * Módulo puro: usado no servidor (validação/render) e no editor do backstage.
 */

export interface CoverFramePoint {
  /** 0–100: `object-position` horizontal, em %. */
  x: number;
  /** 0–100: `object-position` vertical, em %. */
  y: number;
  /** 1–MAX_COVER_ZOOM. */
  zoom: number;
}

export interface CoverFraming {
  /** >= 640px (breakpoint `sm`). */
  desktop: CoverFramePoint;
  /** < 640px. */
  mobile: CoverFramePoint;
}

export const MIN_COVER_ZOOM = 1;
/** Acima disso a foto (servida sem otimização) começa a perder nitidez. */
export const MAX_COVER_ZOOM = 2.5;

export const DEFAULT_FRAME_POINT: CoverFramePoint = { x: 50, y: 50, zoom: 1 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parsePoint(raw: unknown): CoverFramePoint | null {
  if (!isPlainObject(raw)) return null;
  const keys = Object.keys(raw);
  if (keys.length !== 3) return null;
  const { x, y, zoom } = raw;
  if (
    typeof x !== "number" ||
    typeof y !== "number" ||
    typeof zoom !== "number" ||
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(zoom)
  ) {
    return null;
  }
  return {
    x: round2(clamp(x, 0, 100)),
    y: round2(clamp(y, 0, 100)),
    zoom: round2(clamp(zoom, MIN_COVER_ZOOM, MAX_COVER_ZOOM)),
  };
}

/**
 * Validação estrita (servidor e leitura do banco): só `{ desktop, mobile }`,
 * cada um com exatamente `{ x, y, zoom }` numéricos. Valores fora da faixa são
 * trazidos para dentro dela; qualquer outra forma -> `null` (padrão).
 */
export function parseCoverFraming(raw: unknown): CoverFraming | null {
  if (!isPlainObject(raw)) return null;
  const keys = Object.keys(raw);
  if (keys.length !== 2) return null;
  const desktop = parsePoint(raw.desktop);
  const mobile = parsePoint(raw.mobile);
  if (!desktop || !mobile) return null;
  return { desktop, mobile };
}

/** Variáveis CSS de um único ponto (prévia do editor). */
export function framePointVars(point: CoverFramePoint): Record<string, string> {
  return {
    "--cf-x": `${point.x}%`,
    "--cf-y": `${point.y}%`,
    "--cf-z": String(point.zoom),
  };
}

/**
 * Variáveis CSS do hero público: `.cover-framed` (globals.css) escolhe
 * mobile/desktop por media query — sem JS, sem salto de layout.
 */
export function coverFramingVars(framing: CoverFraming): Record<string, string> {
  return {
    "--cf-xm": `${framing.mobile.x}%`,
    "--cf-ym": `${framing.mobile.y}%`,
    "--cf-zm": String(framing.mobile.zoom),
    "--cf-xd": `${framing.desktop.x}%`,
    "--cf-yd": `${framing.desktop.y}%`,
    "--cf-zd": String(framing.desktop.zoom),
  };
}
