import "server-only";

import { createServerAuthClient } from "@/lib/supabase/server";
import { buildEventSlug, slugifyTitle } from "@/lib/admin/slug";
import type { ClientInput, EventInput } from "@/lib/admin/validation";
import type { PublishStatus } from "@/types";

/**
 * Escritas do painel. SEMPRE pela sessão autenticada + RLS.
 * Nunca usam service_role. As policies de INSERT/UPDATE (migration
 * 20260831120000) só deixam passar quem está em admin_users.
 *
 * Erros do Supabase sobem crus e são tratados pela Server Action, que devolve
 * uma mensagem amigável (nunca SQL/stack para o usuário).
 */

const UNIQUE_VIOLATION = "23505";

// --- Clientes ---------------------------------------------------------

export async function insertClient(input: ClientInput): Promise<{ id: string }> {
  const supabase = await createServerAuthClient();

  const { data, error } = await supabase
    .from("clients")
    .insert({
      display_name: input.displayName,
      email: input.email,
      phone: input.phone,
    })
    .select("id")
    .single();

  if (error) throw error;
  return { id: data.id as string };
}

export async function updateClient(
  id: string,
  input: ClientInput,
): Promise<void> {
  const supabase = await createServerAuthClient();

  const { data, error } = await supabase
    .from("clients")
    .update({
      display_name: input.displayName,
      email: input.email,
      phone: input.phone,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("client_not_found");
}

// --- Eventos --------------------------------------------------------

/** Confere que o cliente existe (FK + integridade antes de gravar o evento). */
export async function clientExists(id: string): Promise<boolean> {
  const supabase = await createServerAuthClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

/**
 * Cria o evento em `draft`, com slug gerado no servidor.
 * Gera candidatos até achar um livre (checagem + retry no `unique` do banco).
 */
export async function insertEvent(input: EventInput): Promise<{ id: string }> {
  const supabase = await createServerAuthClient();

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const slug = buildEventSlug(input.title);

    const { data: clash, error: clashError } = await supabase
      .from("events")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (clashError) throw clashError;
    if (clash) continue;

    const { data, error } = await supabase
      .from("events")
      .insert({
        client_id: input.clientId,
        title: input.title,
        slug,
        event_type: input.eventType,
        event_date: input.eventDate,
        location: input.location,
        description: input.description,
        status: "draft", // nunca publicado automaticamente
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === UNIQUE_VIOLATION) continue; // corrida no slug: novo candidato
      throw error;
    }
    return { id: data.id as string };
  }

  throw new Error("slug_generation_exhausted");
}

/** Atualiza os campos editáveis. NÃO toca em `slug` nem em `status`. */
export async function updateEvent(id: string, input: EventInput): Promise<void> {
  const supabase = await createServerAuthClient();

  const { data, error } = await supabase
    .from("events")
    .update({
      client_id: input.clientId,
      title: input.title,
      event_type: input.eventType,
      event_date: input.eventDate,
      location: input.location,
      description: input.description,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("event_not_found");
}

export interface EventStatusRow {
  id: string;
  title: string;
  status: PublishStatus;
  clientId: string;
  videoCount: number;
  /** Caminho do objeto da capa no bucket `event-media` (ou `null`). */
  coverImagePath: string | null;
  /** Portfólio público (Etapa 6). */
  isPublic: boolean;
  publicSlug: string | null;
  portfolioFeatured: boolean;
}

/** Lê o mínimo para transições de status, capa e portfólio. */
export async function getEventStatusRow(
  id: string,
): Promise<EventStatusRow | null> {
  const supabase = await createServerAuthClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, title, status, client_id, cover_image_url, is_public, public_slug, portfolio_featured, videos(count)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as {
    id: string;
    title: string;
    status: string;
    client_id: string;
    cover_image_url: string | null;
    is_public: boolean;
    public_slug: string | null;
    portfolio_featured: boolean;
    videos: { count: number }[] | null;
  };

  return {
    id: row.id,
    title: row.title,
    status: row.status as PublishStatus,
    clientId: row.client_id,
    videoCount: row.videos?.[0]?.count ?? 0,
    coverImagePath: row.cover_image_url,
    isPublic: row.is_public ?? false,
    publicSlug: row.public_slug,
    portfolioFeatured: row.portfolio_featured ?? false,
  };
}

/** Grava (ou limpa) o caminho da capa. Sessão autenticada + RLS. */
export async function setEventCoverPath(
  id: string,
  path: string | null,
): Promise<void> {
  const supabase = await createServerAuthClient();
  const { data, error } = await supabase
    .from("events")
    .update({ cover_image_url: path })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("event_not_found");
}

export async function setEventStatus(
  id: string,
  status: PublishStatus,
): Promise<void> {
  const supabase = await createServerAuthClient();
  const { data, error } = await supabase
    .from("events")
    .update({ status })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("event_not_found");
}

// --- Portfólio público (Etapa 6) ---------------------------------

/**
 * `public_slug` legível, único e ESTÁVEL. Sem entropia (não é segredo).
 * Reaproveita `slugifyTitle` (NFD, sem acento, [a-z0-9-], até 40 chars,
 * fallback "evento"). Colisão -> sufixo determinístico `-2`, `-3`, ...
 * NUNCA usa o slug privado como base.
 */
export async function generatePublicSlug(title: string): Promise<string> {
  const supabase = await createServerAuthClient();
  const base = slugifyTitle(title);

  for (let i = 0; i < 50; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const { data, error } = await supabase
      .from("events")
      .select("id")
      .eq("public_slug", candidate)
      .maybeSingle();
    if (error) throw error;
    if (!data) return candidate;
  }

  return `${base}-${Date.now().toString(36)}`;
}

/**
 * Liga/desliga o evento no portfólio. `publicSlug` só é gravado quando
 * passado (na 1ª ativação); depois nunca muda. Desativar mantém o slug.
 */
export async function setEventPublic(
  id: string,
  isPublic: boolean,
  publicSlug: string | null,
): Promise<void> {
  const supabase = await createServerAuthClient();
  const patch: Record<string, unknown> = { is_public: isPublic };
  if (publicSlug !== null) patch.public_slug = publicSlug;

  const { data, error } = await supabase
    .from("events")
    .update(patch)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("event_not_found");
}

export async function setEventFeatured(
  id: string,
  featured: boolean,
): Promise<void> {
  const supabase = await createServerAuthClient();
  const { data, error } = await supabase
    .from("events")
    .update({ portfolio_featured: featured })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("event_not_found");
}

/**
 * Liga/desliga um vídeo no portfólio, confirmando que ele pertence ao evento.
 * Ao ligar, o vídeo entra no fim da ordem do portfólio (`showcase_order`).
 */
export async function setVideoShowcase(
  eventId: string,
  videoId: string,
  enabled: boolean,
): Promise<void> {
  const supabase = await createServerAuthClient();
  const patch: Record<string, unknown> = { showcase_enabled: enabled };

  if (enabled) {
    const { data: last, error: lastError } = await supabase
      .from("videos")
      .select("showcase_order")
      .eq("event_id", eventId)
      .eq("showcase_enabled", true)
      .order("showcase_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastError) throw lastError;
    patch.showcase_order = (last?.showcase_order ?? 0) + 1;
  }

  const { data, error } = await supabase
    .from("videos")
    .update(patch)
    .eq("id", videoId)
    .eq("event_id", eventId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("video_not_found");
}

/** Move um vídeo do portfólio uma posição, trocando `showcase_order` com o
 *  vizinho (só entre os `showcase_enabled`). Mesma lógica de `moveVideoInEvent`. */
export async function moveShowcaseVideoInEvent(
  eventId: string,
  videoId: string,
  direction: "up" | "down",
): Promise<void> {
  const supabase = await createServerAuthClient();

  const { data, error } = await supabase
    .from("videos")
    .select("id, showcase_order, sort_order, created_at")
    .eq("event_id", eventId)
    .eq("showcase_enabled", true)
    .order("showcase_order", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as { id: string; showcase_order: number }[];
  const index = rows.findIndex((r) => r.id === videoId);
  if (index === -1) throw new Error("video_not_found");

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= rows.length) return;

  const current = rows[index];
  const neighbour = rows[target];

  if (current.showcase_order === neighbour.showcase_order) {
    const reindexed = rows.map((r, i) => ({ id: r.id, order: i + 1 }));
    [reindexed[index].order, reindexed[target].order] = [
      reindexed[target].order,
      reindexed[index].order,
    ];
    for (const item of reindexed) {
      const { error: upErr } = await supabase
        .from("videos")
        .update({ showcase_order: item.order })
        .eq("id", item.id)
        .eq("event_id", eventId);
      if (upErr) throw upErr;
    }
    return;
  }

  const swaps: Array<[string, number]> = [
    [current.id, neighbour.showcase_order],
    [neighbour.id, current.showcase_order],
  ];
  for (const [id, order] of swaps) {
    const { error: upErr } = await supabase
      .from("videos")
      .update({ showcase_order: order })
      .eq("id", id)
      .eq("event_id", eventId);
    if (upErr) throw upErr;
  }
}

// --- Vídeos --------------------------------------------------------

export interface VideoWriteFields {
  title: string;
  description: string | null;
  category: string;
  provider: string;
  providerVideoId: string | null;
  embedUrl: string | null;
  downloadUrl: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
}

function toVideoColumns(fields: VideoWriteFields) {
  return {
    title: fields.title,
    description: fields.description,
    category: fields.category,
    provider: fields.provider,
    provider_video_id: fields.providerVideoId,
    embed_url: fields.embedUrl,
    download_url: fields.downloadUrl,
    thumbnail_url: fields.thumbnailUrl,
    duration_seconds: fields.durationSeconds,
  };
}

/** Novo vídeo entra no fim da lista (`sort_order` = maior atual + 1). */
export async function insertVideo(
  eventId: string,
  fields: VideoWriteFields,
): Promise<{ id: string }> {
  const supabase = await createServerAuthClient();

  const { data: last, error: lastError } = await supabase
    .from("videos")
    .select("sort_order")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastError) throw lastError;

  const nextOrder = (last?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from("videos")
    .insert({
      ...toVideoColumns(fields),
      event_id: eventId,
      sort_order: nextOrder,
      status: "published", // padrão desta etapa
    })
    .select("id")
    .single();

  if (error) throw error;
  return { id: data.id as string };
}

/** Atualiza um vídeo, confirmando que ele pertence ao evento da URL. */
export async function updateVideoInEvent(
  eventId: string,
  videoId: string,
  fields: VideoWriteFields,
): Promise<void> {
  const supabase = await createServerAuthClient();

  const { data, error } = await supabase
    .from("videos")
    .update(toVideoColumns(fields))
    .eq("id", videoId)
    .eq("event_id", eventId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("video_not_found");
}

/**
 * Move um vídeo uma posição para cima/baixo trocando o `sort_order` com o
 * vizinho. Solução simples e robusta: sem drag-and-drop, sem reindex global.
 */
export async function moveVideoInEvent(
  eventId: string,
  videoId: string,
  direction: "up" | "down",
): Promise<void> {
  const supabase = await createServerAuthClient();

  const { data, error } = await supabase
    .from("videos")
    .select("id, sort_order, created_at")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as {
    id: string;
    sort_order: number;
    created_at: string;
  }[];
  const index = rows.findIndex((r) => r.id === videoId);
  if (index === -1) throw new Error("video_not_found");

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= rows.length) return; // já está na ponta

  const current = rows[index];
  const neighbour = rows[target];

  // Ordens iguais (banco mexido à mão): normaliza 1..n antes de trocar.
  if (current.sort_order === neighbour.sort_order) {
    const reindexed = rows.map((r, i) => ({ id: r.id, order: i + 1 }));
    [reindexed[index].order, reindexed[target].order] = [
      reindexed[target].order,
      reindexed[index].order,
    ];
    for (const item of reindexed) {
      const { error: upErr } = await supabase
        .from("videos")
        .update({ sort_order: item.order })
        .eq("id", item.id)
        .eq("event_id", eventId);
      if (upErr) throw upErr;
    }
    return;
  }

  const swaps: Array<[string, number]> = [
    [current.id, neighbour.sort_order],
    [neighbour.id, current.sort_order],
  ];
  for (const [id, order] of swaps) {
    const { error: upErr } = await supabase
      .from("videos")
      .update({ sort_order: order })
      .eq("id", id)
      .eq("event_id", eventId);
    if (upErr) throw upErr;
  }
}
