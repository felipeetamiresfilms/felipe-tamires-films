/**
 * Modelo de domínio da Felipe & Tamires Films.
 *
 * ESTRATÉGIA DE TIPOS (simples, sem duplicação confusa):
 * - Aqui ficam os tipos de DOMÍNIO, em camelCase, que a interface consome.
 * - As linhas cruas do Postgres (snake_case) são um detalhe do repositório:
 *   ficam como interfaces `*Row` locais em `src/lib/events.ts` e são
 *   convertidas para estes tipos logo na saída. Nada de `EventRow`/`EventData`/
 *   `EventModel` espalhados pelo app — só `Event`.
 *
 * Datas são strings ISO 8601 (formato retornado pelo Supabase/JSON).
 * Campos opcionais no banco são `T | null` (e não `T | undefined`), para
 * refletir exatamente o que o banco devolve.
 */

/** Provedor onde o vídeo está hospedado. A app guarda só a referência. */
export type VideoProvider = "youtube" | "bunny" | "cloudflare" | "other";

/** Categoria da peça audiovisual dentro de um evento. */
export type VideoCategory =
  | "main_film"
  | "teaser"
  | "ceremony"
  | "speeches"
  | "party"
  | "making_of"
  | "other";

/** Tipo de evento social atendido pela produtora. */
export type EventType =
  | "wedding"
  | "debut"
  | "birthday"
  | "corporate"
  | "other";

/** Estado de publicação de um evento ou vídeo. */
export type PublishStatus = "published" | "draft" | "archived";

export interface Client {
  id: string;
  /** Nome como aparece publicamente, ex.: "Ana & Marcos". */
  displayName: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  clientId: string;
  title: string;
  /** Identificador da URL pública: /assistir/[slug] (parte humana + sufixo aleatório). */
  slug: string;
  eventType: EventType;
  /** ISO 8601 (só data) — pode ser nula enquanto o evento não tem data fechada. */
  eventDate: string | null;
  location: string | null;
  description: string | null;
  coverImageUrl: string | null;
  isPublic: boolean;
  status: PublishStatus;
  createdAt: string;
  updatedAt: string;
  // `access_pin_hash` existe no banco mas NÃO é exposto no domínio: a página
  // pública nunca precisa dele.
}

export interface Video {
  id: string;
  eventId: string;
  title: string;
  description: string | null;
  category: VideoCategory;
  provider: VideoProvider;
  providerVideoId: string | null;
  embedUrl: string | null;
  downloadUrl: string | null;
  thumbnailUrl: string | null;
  /** Duração em segundos. */
  duration: number | null;
  sortOrder: number;
  status: PublishStatus;
  createdAt: string;
  updatedAt: string;
}

/** Evento com relações resolvidas — formato que a página de entrega consome. */
export interface EventWithRelations {
  event: Event;
  client: Client;
  videos: Video[];
}
