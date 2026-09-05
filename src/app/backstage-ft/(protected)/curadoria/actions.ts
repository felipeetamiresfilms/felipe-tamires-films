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
import { isUuid, partnerInputSchema } from "@/lib/admin/validation";
import {
  deletePartnerMedia,
  getPartnerMediaInPartner,
  getPartnerStatusRow,
  insertPartner,
  insertPartnerMedia,
  movePartnerMedia,
  partnerCategoryExists,
  setPartnerCoverPath,
  updatePartner,
  type PartnerVideoFields,
} from "@/lib/admin/mutations";
import { normalizeYouTube } from "@/lib/admin/youtube";

const PARTNER_BUCKET = "partner-media";
const MAX_MEDIA_BYTES = 10 * 1024 * 1024; // 10 MiB
const MEDIA_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
type MediaMime = (typeof MEDIA_MIME)[number];
const MEDIA_EXT: Record<MediaMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Sniff dos magic bytes — a extensão / `file.type` do browser NÃO são
 * confiáveis. Mesma checagem de `eventos/actions.ts` (bucket diferente).
 */
function sniffImageMime(bytes: Uint8Array): MediaMime | null {
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

// --- Helpers -------------------------------------------------------------

async function requireAdmin(): Promise<FormState | null> {
  const access = await loadBackstageAccess();
  return access.state === "ok"
    ? null
    : { ok: false, error: SESSION_EXPIRED_ERROR };
}

function backToPartner(id: string, query: string): never {
  redirect(`/backstage-ft/curadoria/${id}?${query}`);
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

function readPartnerForm(formData: FormData) {
  return partnerInputSchema.safeParse({
    categoryId: String(formData.get("categoryId") ?? ""),
    name: String(formData.get("name") ?? ""),
    shortDescription: String(formData.get("shortDescription") ?? ""),
    description: String(formData.get("description") ?? ""),
    recommendationText: String(formData.get("recommendationText") ?? ""),
    location: String(formData.get("location") ?? ""),
    whatsappNumber: String(formData.get("whatsappNumber") ?? ""),
    instagramUrl: String(formData.get("instagramUrl") ?? ""),
    websiteUrl: String(formData.get("websiteUrl") ?? ""),
    featured: formData.get("featured") === "on" ? "true" : "false",
    sortOrder: String(formData.get("sortOrder") ?? "0"),
    status: String(formData.get("status") ?? ""),
  });
}

type VideoResolution =
  | { fields: PartnerVideoFields; error?: undefined }
  | { fields: PartnerVideoFields; error: string };

/** Só YouTube nesta etapa. Campo vazio -> parceiro sem vídeo (não é erro). */
function resolvePartnerVideo(sourceUrl: string | null): VideoResolution {
  const empty: PartnerVideoFields = {
    videoProvider: null,
    videoProviderId: null,
    videoEmbedUrl: null,
  };
  if (!sourceUrl) return { fields: empty };

  const normalized = normalizeYouTube(sourceUrl);
  if (!normalized) {
    return { fields: empty, error: "Não reconheci esse link do YouTube." };
  }

  return {
    fields: {
      videoProvider: "youtube",
      videoProviderId: normalized.providerVideoId,
      videoEmbedUrl: normalized.embedUrl,
    },
  };
}

// --- Parceiro: criar / editar ---------------------------------------

export async function createPartnerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = readPartnerForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Confira os campos destacados.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const sourceUrl = String(formData.get("videoSourceUrl") ?? "").trim();
  const video = resolvePartnerVideo(sourceUrl || null);
  if (video.error) {
    return {
      ok: false,
      error: video.error,
      fieldErrors: { videoSourceUrl: video.error },
    };
  }

  let newId: string;
  try {
    if (!(await partnerCategoryExists(parsed.data.categoryId))) {
      return {
        ok: false,
        error: "Categoria não encontrada.",
        fieldErrors: { categoryId: "Selecione uma categoria válida." },
      };
    }
    ({ id: newId } = await insertPartner(parsed.data, video.fields));
  } catch (err) {
    console.error("createPartnerAction", err);
    return { ok: false, error: GENERIC_SAVE_ERROR };
  }

  revalidatePath("/backstage-ft", "layout");
  revalidatePath("/recomendamos");
  redirect(`/backstage-ft/curadoria/${newId}?ok=parceiro-criado`);
}

export async function updatePartnerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return { ok: false, error: "Parceiro inválido." };

  const parsed = readPartnerForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Confira os campos destacados.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const sourceUrl = String(formData.get("videoSourceUrl") ?? "").trim();
  const video = resolvePartnerVideo(sourceUrl || null);
  if (video.error) {
    return {
      ok: false,
      error: video.error,
      fieldErrors: { videoSourceUrl: video.error },
    };
  }

  try {
    if (!(await partnerCategoryExists(parsed.data.categoryId))) {
      return {
        ok: false,
        error: "Categoria não encontrada.",
        fieldErrors: { categoryId: "Selecione uma categoria válida." },
      };
    }
    await updatePartner(id, parsed.data, video.fields);
  } catch (err) {
    console.error("updatePartnerAction", err);
    return { ok: false, error: GENERIC_SAVE_ERROR };
  }

  revalidatePath("/backstage-ft", "layout");
  revalidatePath("/recomendamos");
  redirect(`/backstage-ft/curadoria/${id}?ok=parceiro-atualizado`);
}

// --- Capa do parceiro (upload no bucket público partner-media) ------

export async function setPartnerCoverAction(formData: FormData): Promise<void> {
  const access = await loadBackstageAccess();
  if (access.state !== "ok") redirect("/backstage-ft/login");

  const partnerId = String(formData.get("partnerId") ?? "");
  if (!isUuid(partnerId)) redirect("/backstage-ft/curadoria");

  const file = formData.get("cover");
  if (!(file instanceof File) || file.size === 0) {
    backToPartner(partnerId, "erro=capa");
  }
  const upload = file as File;
  if (
    upload.size > MAX_MEDIA_BYTES ||
    !(MEDIA_MIME as readonly string[]).includes(upload.type)
  ) {
    backToPartner(partnerId, "erro=capa");
  }

  try {
    const bytes = new Uint8Array(await upload.arrayBuffer());
    const sniffed = sniffImageMime(bytes);
    if (!sniffed || sniffed !== upload.type) {
      backToPartner(partnerId, "erro=capa");
    }

    const partner = await getPartnerStatusRow(partnerId);
    if (!partner) redirect("/backstage-ft/curadoria");

    const supabase = await createServerAuthClient();
    const objectPath = `partners/${partnerId}/cover/${randomUUID()}.${MEDIA_EXT[sniffed as MediaMime]}`;

    const uploaded = await supabase.storage
      .from(PARTNER_BUCKET)
      .upload(objectPath, bytes, {
        contentType: sniffed as MediaMime,
        upsert: false,
      });
    if (uploaded.error) {
      console.error("setPartnerCoverAction upload", uploaded.error);
      backToPartner(partnerId, "erro=capa");
    }

    await setPartnerCoverPath(partnerId, objectPath);

    if (partner.coverImagePath && partner.coverImagePath !== objectPath) {
      // Best-effort: erro aqui deixa só um objeto órfão, não quebra o fluxo.
      await supabase.storage.from(PARTNER_BUCKET).remove([partner.coverImagePath]);
    }

    revalidatePath("/backstage-ft", "layout");
    revalidatePath("/recomendamos");
    backToPartner(partnerId, "ok=capa-atualizada");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("setPartnerCoverAction", err);
    backToPartner(partnerId, "erro=capa");
  }
}

export async function removePartnerCoverAction(formData: FormData): Promise<void> {
  const access = await loadBackstageAccess();
  if (access.state !== "ok") redirect("/backstage-ft/login");

  const partnerId = String(formData.get("partnerId") ?? "");
  if (!isUuid(partnerId)) redirect("/backstage-ft/curadoria");

  try {
    const partner = await getPartnerStatusRow(partnerId);
    if (!partner) redirect("/backstage-ft/curadoria");
    if (!partner.coverImagePath) backToPartner(partnerId, "ok=capa-removida");

    await setPartnerCoverPath(partnerId, null);
    const supabase = await createServerAuthClient();
    await supabase.storage.from(PARTNER_BUCKET).remove([partner.coverImagePath]);

    revalidatePath("/backstage-ft", "layout");
    revalidatePath("/recomendamos");
    backToPartner(partnerId, "ok=capa-removida");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("removePartnerCoverAction", err);
    backToPartner(partnerId, "erro=acao");
  }
}

// --- Galeria de fotos ------------------------------------------------

export async function addPartnerMediaAction(formData: FormData): Promise<void> {
  const access = await loadBackstageAccess();
  if (access.state !== "ok") redirect("/backstage-ft/login");

  const partnerId = String(formData.get("partnerId") ?? "");
  if (!isUuid(partnerId)) redirect("/backstage-ft/curadoria");

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    backToPartner(partnerId, "erro=galeria");
  }
  const upload = file as File;
  if (
    upload.size > MAX_MEDIA_BYTES ||
    !(MEDIA_MIME as readonly string[]).includes(upload.type)
  ) {
    backToPartner(partnerId, "erro=galeria");
  }

  try {
    const bytes = new Uint8Array(await upload.arrayBuffer());
    const sniffed = sniffImageMime(bytes);
    if (!sniffed || sniffed !== upload.type) {
      backToPartner(partnerId, "erro=galeria");
    }

    const supabase = await createServerAuthClient();
    const objectPath = `partners/${partnerId}/gallery/${randomUUID()}.${MEDIA_EXT[sniffed as MediaMime]}`;

    const uploaded = await supabase.storage
      .from(PARTNER_BUCKET)
      .upload(objectPath, bytes, {
        contentType: sniffed as MediaMime,
        upsert: false,
      });
    if (uploaded.error) {
      console.error("addPartnerMediaAction upload", uploaded.error);
      backToPartner(partnerId, "erro=galeria");
    }

    await insertPartnerMedia(partnerId, objectPath, null);

    revalidatePath("/backstage-ft", "layout");
    revalidatePath("/recomendamos");
    backToPartner(partnerId, "ok=foto-adicionada");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("addPartnerMediaAction", err);
    backToPartner(partnerId, "erro=galeria");
  }
}

export async function removePartnerMediaAction(formData: FormData): Promise<void> {
  const access = await loadBackstageAccess();
  if (access.state !== "ok") redirect("/backstage-ft/login");

  const partnerId = String(formData.get("partnerId") ?? "");
  const mediaId = String(formData.get("mediaId") ?? "");
  if (!isUuid(partnerId)) redirect("/backstage-ft/curadoria");
  if (!isUuid(mediaId)) backToPartner(partnerId, "erro=acao");

  try {
    const media = await getPartnerMediaInPartner(partnerId, mediaId);
    if (!media) backToPartner(partnerId, "erro=acao");

    await deletePartnerMedia(partnerId, mediaId);

    const supabase = await createServerAuthClient();
    await supabase.storage.from(PARTNER_BUCKET).remove([media.storagePath]);

    revalidatePath("/backstage-ft", "layout");
    revalidatePath("/recomendamos");
    backToPartner(partnerId, "ok=foto-removida");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("removePartnerMediaAction", err);
    backToPartner(partnerId, "erro=acao");
  }
}

export async function movePartnerMediaAction(formData: FormData): Promise<void> {
  const access = await loadBackstageAccess();
  if (access.state !== "ok") redirect("/backstage-ft/login");

  const partnerId = String(formData.get("partnerId") ?? "");
  const mediaId = String(formData.get("mediaId") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!isUuid(partnerId)) redirect("/backstage-ft/curadoria");
  if (!isUuid(mediaId) || (direction !== "up" && direction !== "down")) {
    backToPartner(partnerId, "erro=acao");
  }

  try {
    await movePartnerMedia(partnerId, mediaId, direction as "up" | "down");
    revalidatePath("/backstage-ft", "layout");
    backToPartner(partnerId, "ok=foto-movida");
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("movePartnerMediaAction", err);
    backToPartner(partnerId, "erro=acao");
  }
}
