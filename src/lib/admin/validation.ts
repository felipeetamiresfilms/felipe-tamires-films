import { z } from "zod";
import type { EventType, PublishStatus, VideoCategory, VideoProvider } from "@/types";

/**
 * Schemas de validação SERVER-SIDE das operações de escrita do painel.
 *
 * Regras de projeto:
 *  - Nunca confiar em validação de browser/HTML.
 *  - `id`, `status`, `provider`, `event_type`, `category` vêm do formulário e
 *    PRECISAM casar exatamente com os enums do banco (senão a constraint
 *    `check` rejeitaria — validamos antes para dar erro amigável).
 *  - Textos têm tamanho máximo razoável para não deixar campo gigante entrar.
 *  - Strings vazias em campos opcionais viram `null` (é o que o banco espera).
 *
 * Uso conservador do Zod: só `string/object/refine/transform/safeParse`, para
 * não depender de APIs que mudam entre versões.
 */

// --- Enums do domínio (fonte única para <select> e validação) --------------

export const EVENT_TYPE_VALUES = [
  "wedding",
  "debut",
  "birthday",
  "corporate",
  "other",
] as const satisfies readonly EventType[];

export const VIDEO_CATEGORY_VALUES = [
  "main_film",
  "teaser",
  "ceremony",
  "speeches",
  "party",
  "making_of",
  "other",
] as const satisfies readonly VideoCategory[];

export const VIDEO_PROVIDER_VALUES = [
  "youtube",
  "bunny",
  "cloudflare",
  "other",
] as const satisfies readonly VideoProvider[];

// --- Blocos reutilizáveis -------------------------------------------------

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Aceita `null` (não informado no fluxo) mas rejeita string mal formada. */
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value.trim());
}

function nullIfBlank(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const requiredText = (max: number, label: string) =>
  z
    .string({ error: `Informe ${label}.` })
    .transform((v) => v.trim())
    .refine((v) => v.length > 0, `Informe ${label}.`)
    .refine((v) => v.length <= max, `${cap(label)} muito longo (máx. ${max}).`);

const optionalText = (max: number, label: string) =>
  z
    .string()
    .optional()
    .transform(nullIfBlank)
    .refine(
      (v) => v === null || v.length <= max,
      `${cap(label)} muito longo (máx. ${max}).`,
    );

const optionalUrl = (label: string) =>
  z
    .string()
    .optional()
    .transform(nullIfBlank)
    .refine((v) => v === null || v.length <= 600, `${cap(label)} muito longa.`)
    .refine((v) => v === null || isHttpUrl(v), `${cap(label)} inválida.`);

const uuidField = (label: string) =>
  z
    .string({ error: `Selecione ${label}.` })
    .transform((v) => v.trim())
    .refine((v) => UUID_RE.test(v), `Selecione ${label}.`);

const optionalCalendarDate = z
  .string()
  .optional()
  .transform(nullIfBlank)
  .refine(
    (v) => v === null || (DATE_RE.test(v) && !Number.isNaN(Date.parse(v))),
    "Data inválida.",
  );

function enumField<T extends string>(values: readonly T[], message: string) {
  return z
    .string({ error: message })
    .transform((v) => v.trim())
    .refine((v): v is T => (values as readonly string[]).includes(v), message);
}

function cap(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// --- Cliente -------------------------------------------------------------

export const clientInputSchema = z.object({
  displayName: requiredText(120, "o nome"),
  email: z
    .string()
    .optional()
    .transform(nullIfBlank)
    .refine((v) => v === null || v.length <= 200, "E-mail muito longo.")
    .refine(
      (v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "E-mail inválido.",
    ),
  phone: optionalText(40, "o telefone"),
});

export type ClientInput = z.infer<typeof clientInputSchema>;

// --- Evento -------------------------------------------------------------

export const eventInputSchema = z.object({
  clientId: uuidField("um cliente"),
  title: requiredText(160, "o título"),
  eventType: enumField(EVENT_TYPE_VALUES, "Tipo de evento inválido."),
  eventDate: optionalCalendarDate,
  location: optionalText(160, "o local"),
  description: optionalText(4000, "a descrição"),
});

export type EventInput = z.infer<typeof eventInputSchema>;

// --- Vídeo ------------------------------------------------------------

export const videoInputSchema = z.object({
  title: requiredText(160, "o título"),
  description: optionalText(4000, "a descrição"),
  category: enumField(VIDEO_CATEGORY_VALUES, "Categoria inválida."),
  provider: enumField(VIDEO_PROVIDER_VALUES, "Provedor inválido."),
  // URL/refe. bruta digitada (principal caminho para YouTube).
  sourceUrl: optionalText(600, "a URL do vídeo"),
  // Embed manual — usado para provedores que não sejam YouTube.
  embedUrl: optionalUrl("a URL de incorporação"),
  downloadUrl: optionalUrl("a URL de download"),
  thumbnailUrl: optionalUrl("a URL da miniatura"),
  // Entrada amigável de duração: "15:12", "1:18", "1:02:05".
  durationInput: optionalText(16, "a duração"),
});

export type VideoInput = z.infer<typeof videoInputSchema>;

// --- Parceiro (Nossa Curadoria) ------------------------------------------

const PARTNER_STATUS_VALUES = [
  "draft",
  "published",
  "archived",
] as const satisfies readonly PublishStatus[];

/** Aceita qualquer formatação digitada e guarda só dígitos (DDI+DDD+número). */
const optionalWhatsapp = z
  .string()
  .optional()
  .transform(nullIfBlank)
  .transform((v) => (v === null ? null : v.replace(/\D/g, "")))
  .refine(
    (v) => v === null || /^\d{10,15}$/.test(v),
    "Use só números com DDI e DDD, ex.: 5554999999999.",
  );

export const partnerInputSchema = z.object({
  categoryId: uuidField("uma categoria"),
  name: requiredText(160, "o nome"),
  shortDescription: optionalText(240, "a descrição curta"),
  description: optionalText(4000, "a descrição"),
  recommendationText: optionalText(2000, "por que indicamos"),
  location: optionalText(160, "a localização"),
  whatsappNumber: optionalWhatsapp,
  instagramUrl: optionalUrl("o Instagram"),
  websiteUrl: optionalUrl("o site"),
  featured: z.string().transform((v) => v === "true"),
  sortOrder: z
    .string()
    .transform((v) => (v.trim() === "" ? 0 : Number(v)))
    .refine(
      (v) => Number.isInteger(v) && v >= 0 && v <= 100000,
      "Ordem inválida.",
    ),
  status: enumField(PARTNER_STATUS_VALUES, "Status inválido."),
});

export type PartnerInput = z.infer<typeof partnerInputSchema>;
