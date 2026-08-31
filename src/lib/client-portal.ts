import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { formatEventDate } from "@/lib/format";
import type { EventType } from "@/types";

/**
 * Biblioteca privada do cliente — camada de dados.
 *
 *   /meus-filmes/[token]  ->  este módulo (server-only)  ->  Supabase (service_role)
 *                         ->  DTO seguro                 ->  browser
 *
 * Acesso por LINK, sem login. `anon` continua sem acesso às tabelas.
 *
 * O token puro NUNCA é gravado — guardamos só o SHA-256 (`portal_token_hash`).
 * Se o banco vazar, os links não ficam prontos para uso: seria preciso um
 * ataque de pré-imagem no SHA-256 (inviável) ou adivinhar um token de 256
 * bits. SHA-256 puro (sem salt/KDF) é adequado aqui porque o token NÃO é
 * senha humana: é aleatório e de altíssima entropia, então não há
 * dicionário / rainbow table útil contra ele.
 */

const MEDIA_BUCKET = "event-media";

/** TTL das signed URLs de capa: 1h — igual a /assistir (entrega privada). */
const SIGNED_URL_TTL_SECONDS = 60 * 60;

const TOKEN_BYTES = 32; // 256 bits de entropia
// base64url de 32 bytes = 43 chars no alfabeto [A-Za-z0-9_-]
const TOKEN_SHAPE = /^[A-Za-z0-9_-]{40,64}$/;

/** Token forte e URL-safe. `crypto.randomBytes` — nunca `Math.random()`. */
export function generatePortalToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/** SHA-256 hex do token — o valor que vai para o banco. */
export function hashPortalToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Valida formato/tamanho ANTES de consultar o banco (secção 24). */
export function isPortalTokenShape(token: string): boolean {
  return TOKEN_SHAPE.test(token);
}

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

export interface ClientLibraryEvent {
  /** Slug privado do evento — OK aqui: a pessoa já está no espaço privado. */
  privateSlug: string;
  title: string;
  eventType: EventType;
  eventDateLabel: string | null;
  location: string | null;
  coverUrl: string | null;
}

export interface ClientLibrary {
  clientName: string;
  events: ClientLibraryEvent[];
}

interface ClientRow {
  id: string;
  display_name: string;
  portal_enabled: boolean;
}

interface EventRow {
  slug: string;
  title: string;
  event_type: string;
  event_date: string | null;
  location: string | null;
  cover_image_url: string | null;
}

/**
 * Resolve o cliente pelo hash do token e devolve seus eventos PUBLICADOS.
 * `null` -> 404 (token com formato inválido, sem cliente correspondente,
 * portal desativado, ou schema ainda sem os campos). Nunca revela se um
 * cliente existe.
 */
export async function getClientLibraryByToken(
  token: string,
): Promise<ClientLibrary | null> {
  if (!isPortalTokenShape(token)) return null;

  const supabase = createAdminClient();
  const tokenHash = hashPortalToken(token);

  const { data, error } = await supabase
    .from("clients")
    .select("id, display_name, portal_enabled")
    .eq("portal_token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    if ((error as { code?: string }).code === "42703") {
      console.warn(
        "[client-portal] colunas do portal ausentes — aplique a migration " +
          "supabase/migrations/20260831180000_client_portal.sql",
      );
      return null;
    }
    throw error;
  }

  const client = data as ClientRow | null;
  if (!client || !client.portal_enabled) return null;

  const { data: rows, error: eventsError } = await supabase
    .from("events")
    .select("slug, title, event_type, event_date, location, cover_image_url")
    .eq("client_id", client.id)
    .eq("status", "published")
    .order("event_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (eventsError) throw eventsError;

  const eventRows = (rows ?? []) as EventRow[];
  const covers = await signCovers(eventRows.map((r) => r.cover_image_url));

  return {
    clientName: client.display_name,
    events: eventRows.map((r) => ({
      privateSlug: r.slug,
      title: r.title,
      eventType: r.event_type as EventType,
      eventDateLabel: r.event_date ? formatEventDate(r.event_date) : null,
      location: r.location,
      coverUrl: r.cover_image_url
        ? covers.get(r.cover_image_url) ?? null
        : null,
    })),
  };
}
