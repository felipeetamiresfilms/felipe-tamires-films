"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { loadBackstageAccess } from "@/lib/admin/auth";
import { createServerAuthClient } from "@/lib/supabase/server";
import {
  GENERIC_SAVE_ERROR,
  SESSION_EXPIRED_ERROR,
  zodFieldErrors,
  type FormState,
} from "@/lib/admin/form";
import {
  eventInputSchema,
  isUuid,
  videoInputSchema,
  type VideoInput,
} from "@/lib/admin/validation";
import {
  clientExists,
  getEventStatusRow,
  insertEvent,
  insertVideo,
  moveVideoInEvent,
  setEventCoverPath,
  setEventStatus,
  updateEvent,
  updateVideoInEvent,
  type VideoWriteFields,
} from "@/lib/admin/mutations";
import { normalizeYouTube } from "@/lib/admin/youtube";
import { parseDurationInput } from "@/lib/admin/duration";

const COVER_BUCKET = "event-media";
const MAX_COVER_BYTES = 10 * 1024 * 1024; // 10 MiB
const COVER_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
type CoverMime = (typeof COVER_MIME)[number];
const COVER_EXT: Record<CoverMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Sniff dos magic bytes — a extensão / `file.type` do browser NÃO são
 * confiáveis. Bloqueia SVG, GIF, HTML e qualquer coisa que não seja
 * exatamente JPEG / PNG / WEBP.
 */
function sniffImageMime(bytes: Uint8Array): CoverMime | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

// --- Helpers --------------------------------------------------------

async function requireAdmin(): Promise<FormState | null> {
  const access = await loadBackstageAccess();
  return access.state === "ok" ? null : { ok: false, error: SESSION_EXPIRED_ERROR };
}

function backToEvent(id: string, query: string): never {
  redirect(`/backstage-ft/eventos/${id}?${query}`);
}

function readEventForm(formData: FormData) {
  return eventInputSchema.safeParse({
    clientId: String(formData.get("clientId") ?? ""),
    title: String(formData.get("title") ?? ""),
    eventType: String(formData.get("eventType") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
    location: String(formData.get("location") ?? ""),
    description: String(formData.get("description") ?? ""),
  });
}

function readVideoForm(formData: FormData) {
  return videoInputSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    category: String(formData.get("category") ?? ""),
    provider: String(formData.get("provider") ?? ""),
    sourceUrl: String(formData.get("sourceUrl") ?? ""),
    embedUrl: String(formData.get("embedUrl") ?? ""),
    downloadUrl: String(formData.get("downloadUrl") ?? ""),
    thumbnailUrl: String(formData.get("thumbnailUrl") ?? ""),
    durationInput: String(formData.get("durationInput") ?? ""),
  });
}

type VideoResolution =
  | { ok: true; fields: VideoWriteFields }
  | { ok: false; error: string; fieldErrors: Record<string, string> };

/**
 * Regras específicas de vídeo depois da validação de forma:
 *  - provider youtube  -> exige URL, extrai o ID e padroniza o embed nocookie;
 *  - outros providers  -> usa a `embedUrl` informada (já validada como URL);
 *  - duração "12:35"   -> segundos.
 */
function resolveVideoFields(input: VideoInput): VideoResolution {
  const fieldErrors: Record<string, string> = {};

  let providerVideoId: string | null = null;
  let embedUrl: string | null = null;

  if (input.provider === "youtube") {
    if (!input.sourceUrl) {
      fieldErrors.sourceUrl = "Cole a URL do vídeo no YouTube.";
    } else {
      const normalized = normalizeYouTube(input.sourceUrl);
      if (!normalized) {
        fieldErrors.sourceUrl = "Não reconheci esse link do YouTube.";
      } else {
        providerVideoId = normalized.providerVideoId;
        embedUrl = normalized.embedUrl;
      }
    }
  } else {
    embedUrl = input.embedUrl;
  }

  let durationSeconds: number | null = null;
  if (input.durationInput) {
    const parsed = parseDurationInput(input.durationInput);
    if (parsed === null) {
      fieldErrors.durationInput = "Use algo como 12:35, 1:18 ou 1:02:05.";
    } else {
      durationSeconds = parsed;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "Confira os campos destacados.", fieldErrors };
  }

  return {
    ok: true,
    fields: {
      title: input.title,
      description: input.description,
      category: input.category,
      provider: input.provider,
      providerVideoId,
      embedUrl,
      downloadUrl: input.downloadUrl,
      thumbnailUrl: input.thumbnailUrl,
      durationSeconds,
    },
  };
}

// --- Evento: criar / editar --------------------------------------

export async function createEventAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = readEventForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Confira os campos destacados.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  let newId: string;
  try {
    if (!(await clientExists(parsed.data.clientId))) {
      return {
        ok: false,
        error: "Cliente não encontrado.",
        fieldErrors: { clientId: "Selecione um cliente válido." },
      };
    }
    ({ id: newId } = await insertEvent(parsed.data));
  } catch (err) {
    console.error("createEventAction", err);
    return { ok: false, error: GENERIC_SAVE_ERROR };
  }

  revalidatePath("/backstage-ft", "layout");
  redirect(`/backstage-ft/eventos/${newId}?ok=evento-criado`);
}

export async function updateEventAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return { ok: false, error: "Evento inválido." };

  const parsed = readEventForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Confira os campos destacados.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  try {
    if (!(await clientExists(parsed.data.clientId))) {
      return {
        ok: false,
        error: "Cliente não encontrado.",
        fieldErrors: { clientId: "Selecione um cliente válido." },
      };
    }
    await updateEvent(id, parsed.data);
  } catch (err) {
    console.error("updateEventAction", err);
    return { ok: false, error: GENERIC_SAVE_ERROR };
  }

  revalidatePath("/backstage-ft", "layout");
  redirect(`/backstage-ft/eventos/${id}?ok=evento-atualizado`);
}

// --- Evento: transições de status (forms simples) ----------------

export async function publishEventAction(formData: FormData): Promise<void> {
  const access = await loadBackstageAccess();
  if (access.state !== "ok") redirect("/backstage-ft/login");

  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) redirect("/backstage-ft/eventos");

  try {
    const row = await getEventStatusRow(id);
    if (!row) redirect("/backstage-ft/eventos");
    if (row.status !== "draft") backToEvent(id, "erro=estado");
    if (row.title.trim().length === 0) backToEvent(id, "erro=publicar");
    if (!isUuid(row.clientId) || !(await clientExists(row.clientId))) {
      backToEvent(id, "erro=publicar");
    }

    await setEventStatus(id, "published");
    revalidatePath("/backstage-ft", "layout");
    backToEvent(id, "ok=evento-publicado");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("publishEventAction", err);
    backToEvent(id, "erro=acao");
  }
}

export async function archiveEventAction(formData: FormData): Promise<void> {
  const access = await loadBackstageAccess();
  if (access.state !== "ok") redirect("/backstage-ft/login");

  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) redirect("/backstage-ft/eventos");

  try {
    const row = await getEventStatusRow(id);
    if (!row) redirect("/backstage-ft/eventos");
    if (row.status !== "published") backToEvent(id, "erro=estado");

    await setEventStatus(id, "archived");
    revalidatePath("/backstage-ft", "layout");
    backToEvent(id, "ok=evento-arquivado");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("archiveEventAction", err);
    backToEvent(id, "erro=acao");
  }
}

export async function restoreEventAction(formData: FormData): Promise<void> {
  const access = await loadBackstageAccess();
  if (access.state !== "ok") redirect("/backstage-ft/login");

  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) redirect("/backstage-ft/eventos");

  try {
    const row = await getEventStatusRow(id);
    if (!row) redirect("/backstage-ft/eventos");
    if (row.status !== "archived") backToEvent(id, "erro=estado");

    await setEventStatus(id, "draft");
    revalidatePath("/backstage-ft", "layout");
    backToEvent(id, "ok=evento-restaurado");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("restoreEventAction", err);
    backToEvent(id, "erro=acao");
  }
}

// --- Vídeos ------------------------------------------------------

export async function createVideoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const eventId = String(formData.get("eventId") ?? "");
  if (!isUuid(eventId)) return { ok: false, error: "Evento inválido." };

  const parsed = readVideoForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Confira os campos destacados.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const resolved = resolveVideoFields(parsed.data);
  if (!resolved.ok) {
    return { ok: false, error: resolved.error, fieldErrors: resolved.fieldErrors };
  }

  try {
    const event = await getEventStatusRow(eventId);
    if (!event) return { ok: false, error: "Evento não encontrado." };

    await insertVideo(eventId, resolved.fields);
  } catch (err) {
    console.error("createVideoAction", err);
    return { ok: false, error: GENERIC_SAVE_ERROR };
  }

  revalidatePath("/backstage-ft", "layout");
  redirect(`/backstage-ft/eventos/${eventId}?ok=video-adicionado`);
}

export async function updateVideoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const eventId = String(formData.get("eventId") ?? "");
  const videoId = String(formData.get("videoId") ?? "");
  if (!isUuid(eventId) || !isUuid(videoId)) {
    return { ok: false, error: "Vídeo inválido." };
  }

  const parsed = readVideoForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Confira os campos destacados.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const resolved = resolveVideoFields(parsed.data);
  if (!resolved.ok) {
    return { ok: false, error: resolved.error, fieldErrors: resolved.fieldErrors };
  }

  try {
    await updateVideoInEvent(eventId, videoId, resolved.fields);
  } catch (err) {
    if (err instanceof Error && err.message === "video_not_found") {
      return { ok: false, error: "Este vídeo não pertence a este evento." };
    }
    console.error("updateVideoAction", err);
    return { ok: false, error: GENERIC_SAVE_ERROR };
  }

  revalidatePath("/backstage-ft", "layout");
  redirect(`/backstage-ft/eventos/${eventId}?ok=video-atualizado`);
}

export async function moveVideoAction(formData: FormData): Promise<void> {
  const access = await loadBackstageAccess();
  if (access.state !== "ok") redirect("/backstage-ft/login");

  const eventId = String(formData.get("eventId") ?? "");
  const videoId = String(formData.get("videoId") ?? "");
  const direction = String(formData.get("direction") ?? "");

  if (!isUuid(eventId)) redirect("/backstage-ft/eventos");
  if (
    !isUuid(videoId) ||
    (direction !== "up" && direction !== "down")
  ) {
    backToEvent(eventId, "erro=acao");
  }

  try {
    await moveVideoInEvent(eventId, videoId, direction as "up" | "down");
    revalidatePath("/backstage-ft", "layout");
    backToEvent(eventId, "ok=video-movido");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("moveVideoAction", err);
    backToEvent(eventId, "erro=acao");
  }
}

// --- Capa do evento (upload no bucket privado event-media) -------

/**
 * Fluxo de troca seguro (secção 7 do briefing):
 *  1. valida (admin + evento + MIME + tamanho + magic bytes);
 *  2. sobe o novo arquivo num caminho gerado no SERVIDOR;
 *  3. só se o upload deu certo, aponta `cover_image_url` para o novo caminho;
 *  4. só então remove o objeto antigo (best-effort — se falhar é só lixo).
 * O evento nunca fica sem capa por falha intermediária.
 */
export async function setCoverAction(formData: FormData): Promise<void> {
  const access = await loadBackstageAccess();
  if (access.state !== "ok") redirect("/backstage-ft/login");

  const eventId = String(formData.get("eventId") ?? "");
  if (!isUuid(eventId)) redirect("/backstage-ft/eventos");

  const file = formData.get("cover");
  if (!(file instanceof File) || file.size === 0) {
    backToEvent(eventId, "erro=capa");
  }
  const upload = file as File;
  if (
    upload.size > MAX_COVER_BYTES ||
    !(COVER_MIME as readonly string[]).includes(upload.type)
  ) {
    backToEvent(eventId, "erro=capa");
  }

  try {
    const bytes = new Uint8Array(await upload.arrayBuffer());
    const sniffed = sniffImageMime(bytes);
    if (!sniffed || sniffed !== upload.type) {
      backToEvent(eventId, "erro=capa");
    }

    const event = await getEventStatusRow(eventId);
    if (!event) redirect("/backstage-ft/eventos");

    const supabase = await createServerAuthClient();
    const objectPath = `events/${eventId}/cover/${randomUUID()}.${COVER_EXT[sniffed as CoverMime]}`;

    const uploaded = await supabase.storage
      .from(COVER_BUCKET)
      .upload(objectPath, bytes, {
        contentType: sniffed as CoverMime,
        upsert: false,
      });
    if (uploaded.error) {
      console.error("setCoverAction upload", uploaded.error);
      backToEvent(eventId, "erro=capa");
    }

    await setEventCoverPath(eventId, objectPath);

    if (event.coverImagePath && event.coverImagePath !== objectPath) {
      // Best-effort: erro aqui deixa só um objeto órfão, não quebra o fluxo.
      await supabase.storage.from(COVER_BUCKET).remove([event.coverImagePath]);
    }

    revalidatePath("/backstage-ft", "layout");
    backToEvent(eventId, "ok=capa-atualizada");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("setCoverAction", err);
    backToEvent(eventId, "erro=capa");
  }
}

export async function removeCoverAction(formData: FormData): Promise<void> {
  const access = await loadBackstageAccess();
  if (access.state !== "ok") redirect("/backstage-ft/login");

  const eventId = String(formData.get("eventId") ?? "");
  if (!isUuid(eventId)) redirect("/backstage-ft/eventos");

  try {
    const event = await getEventStatusRow(eventId);
    if (!event) redirect("/backstage-ft/eventos");
    if (!event.coverImagePath) backToEvent(eventId, "ok=capa-removida");

    await setEventCoverPath(eventId, null);
    const supabase = await createServerAuthClient();
    await supabase.storage.from(COVER_BUCKET).remove([event.coverImagePath]);

    revalidatePath("/backstage-ft", "layout");
    backToEvent(eventId, "ok=capa-removida");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("removeCoverAction", err);
    backToEvent(eventId, "erro=acao");
  }
}

/** `redirect()` sinaliza via throw — precisamos deixar passar no catch. */
function isRedirectError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof (err as { digest?: unknown }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}
