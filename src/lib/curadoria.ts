import "server-only";

import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Camada de dados de NOSSA CURADORIA (/recomendamos).
 *
 *   página pública  ->  este módulo (server-only)  ->  Supabase (service_role)
 *                   ->  DTO seguro                 ->  browser
 *
 * Mesma estratégia de `src/lib/portfolio.ts`: `anon` continua sem acesso
 * direto às tabelas `partners`/`partner_categories`/`partner_media` — a
 * leitura pública é server-side com service_role e NUNCA devolve linha crua
 * do banco, só os DTOs abaixo.
 *
 * NUNCA sai daqui: `id` interno, `category_id`, `created_at`/`updated_at`,
 * parceiros draft/archived, ou qualquer coluna administrativa.
 */

const MEDIA_BUCKET = "partner-media";

/**
 * Enquanto a migration 20260905120000 não foi aplicada, as tabelas da
 * curadoria não existem. Nesse caso a área simplesmente fica vazia (estado
 * institucional) em vez de derrubar a página — mesmo padrão de `portfolio.ts`.
 *
 * `42703`/`42P01` são os SQLSTATE crus do Postgres (coluna/tabela ausente).
 * `PGRST205` é o código PRÓPRIO do PostgREST quando a tabela inteira nem
 * está no cache de schema dele — é o que acontece de fato aqui (tabela nova,
 * sem nenhuma coluna reconhecida ainda).
 */
function isMissingCurationSchema(error: { code?: string } | null): boolean {
  if (
    error?.code === "42703" ||
    error?.code === "42P01" ||
    error?.code === "PGRST205"
  ) {
    console.warn(
      "[curadoria] tabelas/colunas ausentes — aplique a migration " +
        "supabase/migrations/20260905120000_partner_curation.sql",
    );
    return true;
  }
  return false;
}

/** `partner-media` é um bucket PÚBLICO: URL direta, sem assinatura. */
function publicUrl(path: string | null): string | null {
  if (!path) return null;
  const supabase = createAdminClient();
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data?.publicUrl ?? null;
}

function firstRelation<T>(rel: T | T[] | null): T | null {
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

// --- DTOs públicos -------------------------------------------------------

export interface PublicPartnerCard {
  slug: string;
  name: string;
  categoryName: string;
  categorySlug: string;
  location: string | null;
  coverUrl: string | null;
}

export interface PublicPartnerGalleryItem {
  url: string;
  altText: string | null;
}

export interface PublicPartnerDetail extends PublicPartnerCard {
  shortDescription: string | null;
  description: string | null;
  recommendationText: string | null;
  whatsappNumber: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
  videoEmbedUrl: string | null;
  gallery: PublicPartnerGalleryItem[];
}

export interface PublicCurationCategory {
  slug: string;
  name: string;
  partners: PublicPartnerCard[];
}

// --- Linhas cruas (uso interno; NUNCA saem deste módulo) ------------------

interface PartnerCardRow {
  slug: string;
  name: string;
  location: string | null;
  cover_image_path: string | null;
  sort_order: number;
  created_at: string;
  partner_categories:
    | { name: string; slug: string }
    | { name: string; slug: string }[]
    | null;
}

const CARD_COLUMNS =
  "slug, name, location, cover_image_path, sort_order, created_at, partner_categories(name, slug)";

function toCard(row: PartnerCardRow): PublicPartnerCard {
  const category = firstRelation(row.partner_categories);
  return {
    slug: row.slug,
    name: row.name,
    categoryName: category?.name ?? "",
    categorySlug: category?.slug ?? "",
    location: row.location,
    coverUrl: publicUrl(row.cover_image_path),
  };
}

// --- API -------------------------------------------------------------

/** Categorias ativas com ao menos um parceiro publicado, cada uma com seus
 *  parceiros ordenados. Categorias sem parceiro publicado ficam de fora
 *  (seção 17 do briefing). */
export const listCurationCategories = cache(
  async (): Promise<PublicCurationCategory[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("partner_categories")
      .select(`slug, name, sort_order, partners!inner(${CARD_COLUMNS})`)
      .eq("status", "active")
      .eq("partners.status", "published")
      .order("sort_order", { ascending: true });

    if (error) {
      if (isMissingCurationSchema(error)) return [];
      throw error;
    }

    const rows = (data ?? []) as unknown as {
      slug: string;
      name: string;
      partners: PartnerCardRow[];
    }[];

    return rows
      .filter((row) => row.partners.length > 0)
      .map((row) => ({
        slug: row.slug,
        name: row.name,
        partners: row.partners
          .slice()
          .sort((a, b) =>
            a.sort_order !== b.sort_order
              ? a.sort_order - b.sort_order
              : a.created_at < b.created_at
                ? 1
                : -1,
          )
          .map(toCard),
      }));
  },
);

/** Até `limit` parceiros em destaque e publicados — seção da home. */
export const getFeaturedPartners = cache(
  async (limit = 4): Promise<PublicPartnerCard[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("partners")
      .select(CARD_COLUMNS)
      .eq("status", "published")
      .eq("featured", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (isMissingCurationSchema(error)) return [];
      throw error;
    }

    return ((data ?? []) as unknown as PartnerCardRow[]).map(toCard);
  },
);

/** Página pública `/recomendamos/[slug]`. `null` -> 404. */
export const getPartnerBySlug = cache(
  async (slug: string): Promise<PublicPartnerDetail | null> => {
    const clean = slug.trim().toLowerCase();
    if (!clean || clean.length > 80 || !/^[a-z0-9-]+$/.test(clean)) return null;

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("partners")
      .select(
        `${CARD_COLUMNS}, short_description, description, recommendation_text, whatsapp_number, instagram_url, website_url, video_embed_url, partner_media(storage_path, alt_text, sort_order)`,
      )
      .eq("slug", clean)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
      if (isMissingCurationSchema(error)) return null;
      throw error;
    }
    if (!data) return null;

    const row = data as unknown as PartnerCardRow & {
      short_description: string | null;
      description: string | null;
      recommendation_text: string | null;
      whatsapp_number: string | null;
      instagram_url: string | null;
      website_url: string | null;
      video_embed_url: string | null;
      partner_media:
        | { storage_path: string; alt_text: string | null; sort_order: number }[]
        | null;
    };

    const gallery = (row.partner_media ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((m) => ({ url: publicUrl(m.storage_path), altText: m.alt_text }))
      .filter((item): item is PublicPartnerGalleryItem => Boolean(item.url));

    return {
      ...toCard(row),
      shortDescription: row.short_description,
      description: row.description,
      recommendationText: row.recommendation_text,
      whatsappNumber: row.whatsapp_number,
      instagramUrl: row.instagram_url,
      websiteUrl: row.website_url,
      videoEmbedUrl: row.video_embed_url,
      gallery,
    };
  },
);
