import type {
  EventType,
  PublishStatus,
  VideoCategory,
  VideoProvider,
} from "@/types";

/** Rótulos legíveis em pt-BR para os enums do domínio. */

export const publishStatusLabels: Record<PublishStatus, string> = {
  published: "Publicado",
  draft: "Rascunho",
  archived: "Arquivado",
};

export const eventTypeLabels: Record<EventType, string> = {
  wedding: "Casamento",
  debut: "15 Anos",
  birthday: "Aniversário",
  corporate: "Corporativo",
  other: "Evento",
};

export const videoCategoryLabels: Record<VideoCategory, string> = {
  main_film: "Filme Principal",
  teaser: "Teaser",
  ceremony: "Cerimônia",
  speeches: "Discursos",
  party: "Festa",
  making_of: "Making Of",
  other: "Vídeo",
};

export const videoProviderLabels: Record<VideoProvider, string> = {
  youtube: "YouTube",
  bunny: "Bunny Stream",
  cloudflare: "Cloudflare Stream",
  other: "Outro",
};
