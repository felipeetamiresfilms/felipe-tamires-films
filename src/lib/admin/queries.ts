import "server-only";

import { createServerAuthClient } from "@/lib/supabase/server";
import type {
  EventType,
  PublishStatus,
  VideoCategory,
  VideoProvider,
} from "@/types";
import { isUuid } from "@/lib/admin/validation";

/**
 * Consultas do painel. Sempre pela SESSÃO AUTENTICADA + RLS.
 * Nunca usam service_role (esse é exclusivo do fluxo público /assistir/[slug]).
 */

export interface AdminStats {
  clients: number;
  events: number;
  videos: number;
}

export interface AdminEventItem {
  id: string;
  title: string;
  slug: string;
  eventType: EventType;
  eventDate: string | null;
  location: string | null;
  status: PublishStatus;
  clientId: string;
  clientName: string;
  videoCount: number;
  createdAt: string;
}

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createServerAuthClient();

  const [clients, events, videos] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("videos").select("*", { count: "exact", head: true }),
  ]);

  const firstError = clients.error ?? events.error ?? videos.error;
  if (firstError) throw firstError;

  return {
    clients: clients.count ?? 0,
    events: events.count ?? 0,
    videos: videos.count ?? 0,
  };
}

interface AdminEventRow {
  id: string;
  title: string;
  slug: string;
  event_type: string;
  event_date: string | null;
  location: string | null;
  status: string;
  client_id: string;
  created_at: string;
  clients: { display_name: string } | { display_name: string }[] | null;
  videos: { count: number }[] | null;
}

function firstRelation<T>(rel: T | T[] | null): T | null {
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

export async function getAdminEvents(): Promise<AdminEventItem[]> {
  const supabase = await createServerAuthClient();

  const { data, error } = await supabase
    .from("events")
    .select(
      "id, title, slug, event_type, event_date, location, status, client_id, created_at, clients(display_name), videos(count)",
    )
    .order("event_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as AdminEventRow[];

  return rows.map((row) => {
    const client = firstRelation(row.clients);
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      eventType: row.event_type as EventType,
      eventDate: row.event_date,
      location: row.location,
      status: row.status as PublishStatus,
      clientId: row.client_id,
      clientName: client?.display_name ?? "—",
      videoCount: row.videos?.[0]?.count ?? 0,
      createdAt: row.created_at,
    };
  });
}

// --- Clientes -----------------------------------------------------------

export interface AdminClientListItem {
  id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  eventCount: number;
  createdAt: string;
}

interface AdminClientRow {
  id: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  events: { count: number }[] | null;
}

export async function getAdminClients(): Promise<AdminClientListItem[]> {
  const supabase = await createServerAuthClient();

  const { data, error } = await supabase
    .from("clients")
    .select("id, display_name, email, phone, created_at, events(count)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as AdminClientRow[]).map((row) => ({
    id: row.id,
    displayName: row.display_name,
    email: row.email,
    phone: row.phone,
    eventCount: row.events?.[0]?.count ?? 0,
    createdAt: row.created_at,
  }));
}

export interface AdminClientOption {
  id: string;
  displayName: string;
}

export async function getAdminClientOptions(): Promise<AdminClientOption[]> {
  const supabase = await createServerAuthClient();

  const { data, error } = await supabase
    .from("clients")
    .select("id, display_name")
    .order("display_name", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as { id: string; display_name: string }[]).map((row) => ({
    id: row.id,
    displayName: row.display_name,
  }));
}

export interface AdminClientEventLink {
  id: string;
  title: string;
  slug: string;
  status: PublishStatus;
  eventType: EventType;
  eventDate: string | null;
  videoCount: number;
}

export interface AdminClientDetail {
  id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  events: AdminClientEventLink[];
}

export async function getAdminClientDetail(
  id: string,
): Promise<AdminClientDetail | null> {
  if (!isUuid(id)) return null;

  const supabase = await createServerAuthClient();

  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, display_name, email, phone, created_at, events(id, title, slug, status, event_type, event_date, videos(count))",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as {
    id: string;
    display_name: string;
    email: string | null;
    phone: string | null;
    created_at: string;
    events:
      | {
          id: string;
          title: string;
          slug: string;
          status: string;
          event_type: string;
          event_date: string | null;
          videos: { count: number }[] | null;
        }[]
      | null;
  };

  const events = (row.events ?? [])
    .map((e) => ({
      id: e.id,
      title: e.title,
      slug: e.slug,
      status: e.status as PublishStatus,
      eventType: e.event_type as EventType,
      eventDate: e.event_date,
      videoCount: e.videos?.[0]?.count ?? 0,
    }))
    .sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));

  return {
    id: row.id,
    displayName: row.display_name,
    email: row.email,
    phone: row.phone,
    createdAt: row.created_at,
    events,
  };
}

// --- Evento (detalhe operacional) + vídeos -----------------------------

export interface AdminVideoItem {
  id: string;
  title: string;
  description: string | null;
  category: VideoCategory;
  provider: VideoProvider;
  providerVideoId: string | null;
  embedUrl: string | null;
  downloadUrl: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  sortOrder: number;
  status: PublishStatus;
  /** Portfólio público (Etapa 6). */
  showcaseEnabled: boolean;
  showcaseOrder: number;
}

export interface AdminEventDetail {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  eventType: EventType;
  eventDate: string | null;
  location: string | null;
  status: PublishStatus;
  createdAt: string;
  clientId: string;
  clientName: string;
  /** Caminho do objeto da capa no bucket `event-media` (não é URL). */
  coverImagePath: string | null;
  /** Portfólio público (Etapa 6). */
  isPublic: boolean;
  publicSlug: string | null;
  portfolioFeatured: boolean;
  videos: AdminVideoItem[];
}

interface AdminVideoRow {
  id: string;
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
  showcase_enabled: boolean;
  showcase_order: number;
}

function toAdminVideo(row: AdminVideoRow): AdminVideoItem {
  return {
    id: row.id,
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
    showcaseEnabled: row.showcase_enabled ?? false,
    showcaseOrder: row.showcase_order ?? 0,
  };
}

const VIDEO_COLUMNS =
  "id, title, description, category, provider, provider_video_id, embed_url, download_url, thumbnail_url, duration_seconds, sort_order, status, showcase_enabled, showcase_order";

export async function getAdminEventDetail(
  id: string,
): Promise<AdminEventDetail | null> {
  if (!isUuid(id)) return null;

  const supabase = await createServerAuthClient();

  const { data, error } = await supabase
    .from("events")
    .select(
      `id, title, slug, description, event_type, event_date, location, status, created_at, client_id, cover_image_url, is_public, public_slug, portfolio_featured, clients(display_name), videos(${VIDEO_COLUMNS})`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    event_type: string;
    event_date: string | null;
    location: string | null;
    status: string;
    created_at: string;
    client_id: string;
    cover_image_url: string | null;
    is_public: boolean;
    public_slug: string | null;
    portfolio_featured: boolean;
    clients: { display_name: string } | { display_name: string }[] | null;
    videos: AdminVideoRow[] | null;
  };

  const client = firstRelation(row.clients);
  const videos = (row.videos ?? [])
    .map(toAdminVideo)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    eventType: row.event_type as EventType,
    eventDate: row.event_date,
    location: row.location,
    status: row.status as PublishStatus,
    createdAt: row.created_at,
    clientId: row.client_id,
    clientName: client?.display_name ?? "—",
    coverImagePath: row.cover_image_url,
    isPublic: row.is_public ?? false,
    publicSlug: row.public_slug,
    portfolioFeatured: row.portfolio_featured ?? false,
    videos,
  };
}

/**
 * Um vídeo, garantindo que ele pertence ao evento informado na URL.
 * Se `videoId` existir mas for de outro evento, retorna `null` (a página
 * chama `notFound()`), impedendo /eventos/A/videos/B.
 */
export async function getAdminVideoInEvent(
  eventId: string,
  videoId: string,
): Promise<AdminVideoItem | null> {
  if (!isUuid(eventId) || !isUuid(videoId)) return null;

  const supabase = await createServerAuthClient();

  const { data, error } = await supabase
    .from("videos")
    .select(VIDEO_COLUMNS)
    .eq("id", videoId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return toAdminVideo(data as unknown as AdminVideoRow);
}

// --- Portal do cliente (Etapa 8) --------------------------------------

export interface ClientPortalState {
  /** Já existe um `portal_token_hash`. */
  created: boolean;
  /** `portal_enabled` — o link está valendo. */
  enabled: boolean;
  createdAt: string | null;
}

/**
 * Estado do portal privado do cliente para o backstage.
 * NUNCA devolve o hash — só flags. Se a migration da Etapa 8 ainda não foi
 * aplicada (colunas ausentes -> 42703), devolve "não criado".
 */
export async function getClientPortalState(
  id: string,
): Promise<ClientPortalState> {
  const empty: ClientPortalState = {
    created: false,
    enabled: false,
    createdAt: null,
  };
  if (!isUuid(id)) return empty;

  const supabase = await createServerAuthClient();
  const { data, error } = await supabase
    .from("clients")
    .select("portal_token_hash, portal_enabled, portal_token_created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if ((error as { code?: string }).code === "42703") return empty;
    throw error;
  }

  const row = data as {
    portal_token_hash: string | null;
    portal_enabled: boolean | null;
    portal_token_created_at: string | null;
  } | null;

  return {
    created: Boolean(row?.portal_token_hash),
    enabled: Boolean(row?.portal_enabled),
    createdAt: row?.portal_token_created_at ?? null,
  };
}
