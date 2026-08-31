import "server-only";

import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/server";
// `cache` dedupe as chamadas repetidas dentro do MESMO request
// (ex.: generateMetadata + página em /filmes/[slug]).
import { formatDuration } from "@/lib/format";
import type { WatchVideo } from "@/lib/events";
import type { EventType, VideoCategory, VideoProvider } from "@/types";

/**
 * Camada de dados do PORTFÓLIO PÚBLICO.
 *
 *   página pública  ->  este módulo (server-only)  ->  Supabase (service_role)
 *                   ->  DTO seguro                 ->  browser
 *
 * `anon` continua SEM acesso direto às tabelas. A leitura é server-side com
 * service_role (que já é usada no fluxo público de /assistir) e NUNCA
 * devolve objeto cru do banco — só os DTOs abaixo, com o mínimo para render.
 *
 * NUNCA sai daqui: `slug` privado, e-mail/telefone do cliente, `access_pin_hash`,
 * `download_url`, `client_id`, `id` do evento, `created_at`, `is_public`
 * interno, vídeos não liberados, ou qualquer coluna administrativa.
 */

const MEDIA_BUCKET = "event-media";

/**
 * Validade das signed URLs de capa no portfólio: 6 HORAS.
 *
 * Maior que a 1h do portal privado porque a página pública é mais
 * compartilhável/revisitada e a capa carrega uma vez só. 6h reduz
 * re-assinatura sem virar link permanente; a página é dinâmica (sem cache),
 * então um refresh gera URL nova de qualquer forma. Nunca é gravada no banco.
 */
const SIGNED_URL_TTL_SECONDS = 6 * 60 * 60;

async function signCover(path: string | null): Promise<string | null> {
  if (!path) return null;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
    return error ? null : data?.signedUrl ?? null;
  } catch {
    return null;
  }
}

/** Assina vários caminhos de uma vez -> Map<path, signedUrl>. */
async function signCovers(
  paths: Array<string | null>,
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const unique = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  if (unique.length === 0) return out;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUrls(unique, SIGNED_URL_TTL_SECONDS);
    for (const item of data ?? []) {
      if (item.path && item.signedUrl && !item.error) {
        out.set(item.path, item.signedUrl);
      }
    }
  } catch {
    // silencioso -> fallback visual
  }
  return out;
}

function youtubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Enquanto a migration 20260831160000 não foi aplicada, as colunas de
 * portfólio não existem. Nesse caso o portfólio simplesmente fica vazio
 * (home institucional, /filmes sem itens) em vez de derrubar a página.
 */
function isMissingPortfolioSchema(error: { code?: string } | null): boolean {
  if (error?.code === "42703") {
    console.warn(
      "[portfolio] colunas de portfólio ausentes — aplique a migration " +
        "supabase/migrations/20260831160000_public_portfolio.sql",
    );
    return true;
  }
  return false;
}

// --- DTOs públicos -----------------------------------------------------

export interface PublicPortfolioCard {
  publicSlug: string;
  title: string;
  eventType: EventType;
  eventDate: string | null;
  location: string | null;
  description: string | null;
  coverUrl: string | null;
  featured: boolean;
}

export interface PublicPortfolioEvent extends PublicPortfolioCard {
  /** Mesmo shape de WatchVideo (só campos seguros) -> reaproveita o player. */
  videos: WatchVideo[];
}

export interface PortfolioCategory {
  key: "weddings" | "debuts" | "events";
  label: string;
  events: PublicPortfolioCard[];
}

export interface PortfolioHome {
  /**
   * Hero da home. SOMENTE um evento `portfolio_featured` pode ocupá-lo.
   * `null` -> a home usa o hero institucional (nunca cai para "mais recente").
   */
  hero: PublicPortfolioCard | null;
  /** "Em destaque": outros eventos featured, sem o hero. */
  spotlight: PublicPortfolioCard[];
  /** Coleções por tipo (Casamentos / 15 Anos / Eventos) — só as não-vazias. */
  categories: PortfolioCategory[];
  /** "Histórias recentes": eventos públicos recentes, sem o hero. */
  recent: PublicPortfolioCard[];
}

const CATEGORY_ORDER = ["weddings", "debuts", "events"] as const;
type CategoryKey = (typeof CATEGORY_ORDER)[number];
const CATEGORY_LABEL: Record<CategoryKey, string> = {
  weddings: "Casamentos",
  debuts: "15 Anos",
  events: "Eventos",
};
function categoryKeyOf(eventType: string): CategoryKey {
  if (eventType === "wedding") return "weddings";
  if (eventType === "debut") return "debuts";
  return "events"; // birthday | corporate | other
}

// --- Linhas cruas (uso interno; NUNCA saem deste módulo) --------------

interface EventCardRow {
  id: string;
  public_slug: string | null;
  title: string;
  event_type: string;
  event_date: string | null;
  location: string | null;
  description: string | null;
  cover_image_url: string | null;
  portfolio_featured: boolean;
  created_at: string;
}

interface ShowcaseVideoRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  provider: string;
  provider_video_id: string | null;
  embed_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  showcase_order: number;
  sort_order: number;
}

const EVENT_CARD_COLUMNS =
  "id, public_slug, title, event_type, event_date, location, description, cover_image_url, portfolio_featured, created_at";

const SHOWCASE_VIDEO_COLUMNS =
  "id, title, description, category, provider, provider_video_id, embed_url, thumbnail_url, duration_seconds, showcase_order, sort_order";

function toCard(row: EventCardRow, coverUrl: string | null): PublicPortfolioCard {
  return {
    // não-nulo: o filtro da query exige public_slug preenchido
    publicSlug: row.public_slug as string,
    title: row.title,
    eventType: row.event_type as EventType,
    eventDate: row.event_date,
    location: row.location,
    description: row.description,
    coverUrl,
    featured: row.portfolio_featured,
  };
}

function toPublicVideo(row: ShowcaseVideoRow): WatchVideo {
  const poster =
    row.thumbnail_url ??
    (row.provider === "youtube" && row.provider_video_id
      ? youtubeThumbnailUrl(row.provider_video_id)
      : null);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category as VideoCategory,
    provider: row.provider as VideoProvider,
    durationLabel: formatDuration(row.duration_seconds),
    posterUrl: poster,
    embedUrl: row.embed_url,
    playable: row.provider === "youtube" && Boolean(row.embed_url),
  };
}

/** data desc (nulos por último) -> created_at desc. */
function byRecency(a: EventCardRow, b: EventCardRow): number {
  const da = a.event_date ?? "";
  const db = b.event_date ?? "";
  if (da !== db) return da < db ? 1 : -1;
  return a.created_at < b.created_at ? 1 : -1;
}

/**
 * Eventos elegíveis ao portfólio (secção 8):
 *   status = 'published' AND is_public AND public_slug not null
 *   AND >= 1 vídeo status='published' AND showcase_enabled
 * O `videos!inner` + filtros nos vídeos garantem a última condição.
 */
async function fetchEligibleEventCards(): Promise<EventCardRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("events")
    .select(`${EVENT_CARD_COLUMNS}, videos!inner(id)`)
    .eq("status", "published")
    .eq("is_public", true)
    .not("public_slug", "is", null)
    .eq("videos.status", "published")
    .eq("videos.showcase_enabled", true);

  if (error) {
    if (isMissingPortfolioSchema(error)) return [];
    throw error;
  }

  const seen = new Set<string>();
  const rows: EventCardRow[] = [];
  for (const raw of (data ?? []) as Array<EventCardRow & { videos: unknown }>) {
    if (seen.has(raw.id)) continue;
    seen.add(raw.id);
    rows.push(raw);
  }
  return rows.sort(byRecency);
}

// --- API ------------------------------------------------------------

/**
 * Home: hero (só featured) + "Em destaque" + coleções por tipo + recentes.
 *
 * Hero = o evento `portfolio_featured` mais recente (data desc, created_at
 * como desempate). SEM fallback: se nenhum evento estiver featured, `hero`
 * é `null` e a home mostra o hero institucional. Um evento apenas
 * `is_public` (sem featured) continua aparecendo nas coleções e em /filmes,
 * mas NUNCA no hero.
 */
export const getPortfolioHome = cache(async (): Promise<PortfolioHome> => {
  const all = await fetchEligibleEventCards();

  const covers = await signCovers(all.map((r) => r.cover_image_url));
  const card = (r: EventCardRow): PublicPortfolioCard =>
    toCard(r, r.cover_image_url ? covers.get(r.cover_image_url) ?? null : null);

  const featuredRows = all.filter((r) => r.portfolio_featured);
  const heroRow = featuredRows[0] ?? null; // já ordenado por recência
  const heroId = heroRow?.id ?? null;

  const spotlight = featuredRows
    .filter((r) => r.id !== heroId)
    .slice(0, 12)
    .map(card);

  const grouped: Record<CategoryKey, PublicPortfolioCard[]> = {
    weddings: [],
    debuts: [],
    events: [],
  };
  for (const r of all) grouped[categoryKeyOf(r.event_type)].push(card(r));
  const categories: PortfolioCategory[] = CATEGORY_ORDER.filter(
    (key) => grouped[key].length > 0,
  ).map((key) => ({ key, label: CATEGORY_LABEL[key], events: grouped[key] }));

  const recent = all
    .filter((r) => r.id !== heroId)
    .slice(0, 12)
    .map(card);

  return {
    hero: heroRow ? card(heroRow) : null,
    spotlight,
    categories,
    recent,
  };
});

/** Biblioteca pública `/filmes`. */
export const listPortfolioEvents = cache(
  async (): Promise<PublicPortfolioCard[]> => {
    const all = await fetchEligibleEventCards();
    const covers = await signCovers(all.map((r) => r.cover_image_url));
    return all.map((r) =>
      toCard(
        r,
        r.cover_image_url ? covers.get(r.cover_image_url) ?? null : null,
      ),
    );
  },
);

/** Página pública de um evento `/filmes/[publicSlug]`. `null` -> 404. */
export const getPortfolioEvent = cache(async function getPortfolioEvent(
  publicSlug: string,
): Promise<PublicPortfolioEvent | null> {
  const slug = publicSlug.trim().toLowerCase();
  if (!slug || slug.length > 80 || !/^[a-z0-9-]+$/.test(slug)) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      `${EVENT_CARD_COLUMNS}, videos!inner(${SHOWCASE_VIDEO_COLUMNS})`,
    )
    .eq("public_slug", slug)
    .eq("status", "published")
    .eq("is_public", true)
    .eq("videos.status", "published")
    .eq("videos.showcase_enabled", true)
    .maybeSingle();

  if (error) {
    if (isMissingPortfolioSchema(error)) return null;
    throw error;
  }
  if (!data) return null;

  const row = data as unknown as EventCardRow & {
    videos: ShowcaseVideoRow[] | null;
  };

  const videos = (row.videos ?? [])
    .slice()
    .sort((a, b) =>
      a.showcase_order !== b.showcase_order
        ? a.showcase_order - b.showcase_order
        : a.sort_order - b.sort_order,
    )
    .map(toPublicVideo);

  if (videos.length === 0) return null;

  const coverUrl = await signCover(row.cover_image_url);
  return { ...toCard(row, coverUrl), videos };
});
