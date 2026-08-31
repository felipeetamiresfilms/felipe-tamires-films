import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import { formatDuration } from "@/lib/format";
import type {
  Client,
  Event,
  EventType,
  EventWithRelations,
  PublishStatus,
  Video,
  VideoCategory,
  VideoProvider,
} from "@/types";

/**
 * Camada de dados (repository).
 *
 *   Página  ->  este arquivo  ->  Supabase
 *
 * A página não conhece Supabase. Aqui as linhas cruas (snake_case) são
 * convertidas para os tipos de domínio (camelCase) na saída.
 */

// --- Linhas cruas do Postgres (uso interno deste arquivo) -------------------

interface ClientRow {
  id: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

interface EventRow {
  id: string;
  client_id: string;
  title: string;
  slug: string;
  event_type: string;
  event_date: string | null;
  location: string | null;
  description: string | null;
  cover_image_url: string | null;
  is_public: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

interface VideoRow {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  category: string;
  provider: string;
  provider_video_id: string | null;
  embed_url: string | null;
  download_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  sort_order: number;
  status: string;
  created_at: string;
  updated_at: string;
}

// --- Conversão linha -> domínio -------------------------------------------

function toClient(row: ClientRow): Client {
  return {
    id: row.id,
    displayName: row.display_name,
    email: row.email,
    phone: row.phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toEvent(row: EventRow): Event {
  return {
    id: row.id,
    clientId: row.client_id,
    title: row.title,
    slug: row.slug,
    eventType: row.event_type as EventType,
    eventDate: row.event_date,
    location: row.location,
    description: row.description,
    coverImageUrl: row.cover_image_url,
    isPublic: row.is_public,
    status: row.status as PublishStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toVideo(row: VideoRow): Video {
  return {
    id: row.id,
    eventId: row.event_id,
    title: row.title,
    description: row.description,
    category: row.category as VideoCategory,
    provider: row.provider as VideoProvider,
    providerVideoId: row.provider_video_id,
    embedUrl: row.embed_url,
    downloadUrl: row.download_url,
    thumbnailUrl: row.thumbnail_url,
    duration: row.duration_seconds,
    sortOrder: row.sort_order,
    status: row.status as PublishStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// --- API do repositório ---------------------------------------------------

/**
 * Busca um evento pelo slug (link privado), com o cliente e os vídeos.
 * Vídeos vêm ordenados por `sort_order` e só os `published`.
 * Retorna `null` se o evento não existir.
 *
 * O slug de alta entropia é o segredo de acesso: NÃO filtramos por
 * `is_public` aqui, senão o link privado do evento não abriria.
 *
 * Só devolve eventos `status = 'published'`. Um link de evento `draft` ou
 * `archived` cai em 404 — publicar/arquivar liga e desliga o portal do cliente.
 */
export async function getEventBySlug(
  slug: string,
): Promise<EventWithRelations | null> {
  const supabase = createAdminClient();

  const { data: eventRow, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle<EventRow>();

  if (eventError) throw eventError;
  if (!eventRow) return null;

  const [clientResult, videosResult] = await Promise.all([
    supabase
      .from("clients")
      .select("*")
      .eq("id", eventRow.client_id)
      .maybeSingle<ClientRow>(),
    supabase
      .from("videos")
      .select("*")
      .eq("event_id", eventRow.id)
      .eq("status", "published")
      .order("sort_order", { ascending: true })
      .returns<VideoRow[]>(),
  ]);

  if (clientResult.error) throw clientResult.error;
  if (videosResult.error) throw videosResult.error;
  if (!clientResult.data) return null;

  return {
    event: toEvent(eventRow),
    client: toClient(clientResult.data),
    videos: (videosResult.data ?? []).map(toVideo),
  };
}

// --- Experiência de visualização (/assistir/[slug]) ----------------------

const MEDIA_BUCKET = "event-media";

/**
 * Validade das signed URLs de imagem: 1 HORA.
 *
 * As imagens (capa + thumbnails) carregam uma vez, no load da página. 1h é
 * folgado para uma sessão de visualização e curto o suficiente para uma URL
 * vazada expirar rápido. A página é dinâmica (service_role, sem cache), então
 * cada acesso/refresh gera URLs novas. A service_role só é usada no servidor
 * para assinar — nunca vai para o navegador.
 */
const SIGNED_URL_TTL_SECONDS = 60 * 60;

/** Assina um objeto privado do Storage. Falha silenciosa -> `null` (fallback). */
async function signMediaObject(path: string): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

/**
 * Thumbnail do YouTube pela infra pública (sem YouTube Data API).
 * `hqdefault` existe para qualquer vídeo real; com `object-cover` as bordas
 * 4:3 são cortadas e o resultado fica 16:9 limpo.
 */
function youtubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/** Prioridade: thumb personalizada -> thumb do YouTube -> fallback CSS (`null`). */
function resolvePosterUrl(video: Video): string | null {
  if (video.thumbnailUrl) return video.thumbnailUrl;
  if (video.provider === "youtube" && video.providerVideoId) {
    return youtubeThumbnailUrl(video.providerVideoId);
  }
  return null;
}

export interface WatchVideo {
  id: string;
  title: string;
  description: string | null;
  category: VideoCategory;
  provider: VideoProvider;
  durationLabel: string | null;
  posterUrl: string | null;
  embedUrl: string | null;
  /** true quando dá para reproduzir de fato — hoje: YouTube com `embed_url`. */
  playable: boolean;
}

export interface WatchData {
  event: Event;
  client: Client;
  /** signed URL da capa, ou `null` (usar fallback cinematográfico). */
  coverUrl: string | null;
  videos: WatchVideo[];
  /** `main_film`, senão o primeiro vídeo — alvo do CTA "Assistir ao filme". */
  primaryVideoId: string | null;
}

/**
 * Dados prontos para a página de visualização: mesmo evento de
 * `getEventBySlug` (published-only) + signed URL da capa + poster resolvido
 * por vídeo. Retorna `null` -> 404.
 */
export async function getWatchData(slug: string): Promise<WatchData | null> {
  const base = await getEventBySlug(slug);
  if (!base) return null;

  const coverUrl = base.event.coverImageUrl
    ? await signMediaObject(base.event.coverImageUrl)
    : null;

  const videos: WatchVideo[] = base.videos.map((video) => ({
    id: video.id,
    title: video.title,
    description: video.description,
    category: video.category,
    provider: video.provider,
    durationLabel: formatDuration(video.duration),
    posterUrl: resolvePosterUrl(video),
    embedUrl: video.embedUrl,
    playable: video.provider === "youtube" && Boolean(video.embedUrl),
  }));

  const mainFilm = videos.find((video) => video.category === "main_film");

  return {
    event: base.event,
    client: base.client,
    coverUrl,
    videos,
    primaryVideoId: (mainFilm ?? videos[0])?.id ?? null,
  };
}
