import { isPrivatePath, isTrackedPath } from "@/lib/analytics/routes";

/**
 * Gerador de links UTM — funções puras (rodam no navegador e no servidor).
 *
 * Destino: só páginas comerciais públicas do domínio oficial (mesma
 * allowlist da medição). Nada externo, nada privado. Parâmetros que já
 * existem no destino (ex.: `?evento=`) são preservados.
 *
 * Convenções: valores minúsculos, sem acento e sem espaços.
 *   orgânico -> utm_medium=social · anúncios Meta -> paid_social ·
 *   parceiros -> referral
 */

export const OFFICIAL_SITE_URL = "https://felipeetamiresfilms.com.br";

export const UTM_DESTINATIONS: { label: string; path: string }[] = [
  { label: "Início", path: "/" },
  { label: "Filmes", path: "/filmes" },
  { label: "Pacotes", path: "/pacotes" },
  { label: "Pacotes · Casamento", path: "/pacotes?evento=casamento" },
  { label: "Pacotes · 15 anos", path: "/pacotes?evento=15-anos" },
  { label: "Pacotes · Aniversário", path: "/pacotes?evento=aniversario" },
  { label: "Recomendamos", path: "/recomendamos" },
];

export type UtmPreset = {
  id: string;
  label: string;
  source: string;
  medium: string;
  content?: string;
};

export const UTM_PRESETS: UtmPreset[] = [
  { id: "instagram-bio", label: "Bio do Instagram", source: "instagram", medium: "social", content: "bio" },
  { id: "instagram-stories", label: "Stories", source: "instagram", medium: "social", content: "stories" },
  { id: "facebook", label: "Facebook", source: "facebook", medium: "social", content: "post" },
  { id: "whatsapp", label: "WhatsApp", source: "whatsapp", medium: "social", content: "mensagem" },
  { id: "meta-instagram", label: "Anúncio Meta · Instagram", source: "instagram", medium: "paid_social" },
  { id: "meta-facebook", label: "Anúncio Meta · Facebook", source: "facebook", medium: "paid_social" },
  { id: "parceria", label: "Parceria", source: "", medium: "referral" },
];

/** minúsculo, sem acento, espaços -> "_", só [a-z0-9._-]. */
export function normalizeUtmValue(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/([._-])\1+/g, "$1")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 100);
}

/** Heurística contra dados pessoais nos parâmetros (e-mail, telefone, CPF). */
export function looksPersonal(value: string): boolean {
  return /@/.test(value) || /\d(?:[\s.()-]*\d){7,}/.test(value) || /(^|[^a-z])cpf([^a-z]|$)/i.test(value);
}

export type UtmField = "destination" | "source" | "medium" | "campaign" | "content";

export type UtmInput = Record<UtmField, string>;

export type UtmResult = {
  url: string | null;
  errors: Partial<Record<UtmField, string>>;
  normalized: Record<Exclude<UtmField, "destination">, string>;
};

export function resolveDestination(
  input: string,
  base: string = OFFICIAL_SITE_URL,
): { url: URL } | { error: string } {
  const value = input.trim();
  if (!value) return { error: "Informe a página de destino." };
  if (value.startsWith("//")) return { error: "Use apenas páginas do site oficial." };
  let url: URL;
  try {
    url = new URL(value, base);
  } catch {
    return { error: "Endereço inválido." };
  }
  if (url.origin !== new URL(base).origin) {
    return { error: "Use apenas páginas do site oficial." };
  }
  if (isPrivatePath(url.pathname)) {
    return { error: "Áreas privadas não podem receber links de divulgação." };
  }
  if (!isTrackedPath(url.pathname)) {
    return { error: "Escolha uma página comercial pública (Início, Filmes, Pacotes ou Recomendamos)." };
  }
  return { url };
}

export function buildUtmUrl(input: UtmInput, base: string = OFFICIAL_SITE_URL): UtmResult {
  const normalized = {
    source: normalizeUtmValue(input.source),
    medium: normalizeUtmValue(input.medium),
    campaign: normalizeUtmValue(input.campaign),
    content: normalizeUtmValue(input.content),
  };
  const errors: UtmResult["errors"] = {};

  const destination = resolveDestination(input.destination, base);
  if ("error" in destination) errors.destination = destination.error;

  const required = { source: "a origem", medium: "o meio", campaign: "a campanha" } as const;
  for (const field of ["source", "medium", "campaign"] as const) {
    if (!normalized[field]) errors[field] = `Informe ${required[field]}.`;
  }
  for (const field of ["source", "medium", "campaign", "content"] as const) {
    if (looksPersonal(input[field])) {
      errors[field] = "Parece conter dado pessoal (e-mail, telefone ou documento). Não use dados de clientes.";
    }
  }

  if (Object.keys(errors).length > 0 || "error" in destination) {
    return { url: null, errors, normalized };
  }

  const url = destination.url;
  url.searchParams.set("utm_source", normalized.source);
  url.searchParams.set("utm_medium", normalized.medium);
  url.searchParams.set("utm_campaign", normalized.campaign);
  if (normalized.content) url.searchParams.set("utm_content", normalized.content);
  else url.searchParams.delete("utm_content");
  return { url: url.toString(), errors, normalized };
}
