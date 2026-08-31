/**
 * Normalização de referência do YouTube.
 *
 * Entrada aceita (o que o administrador costuma ter na mão):
 *   https://www.youtube.com/watch?v=XXXXXXXXXXX
 *   https://youtu.be/XXXXXXXXXXX
 *   https://www.youtube.com/embed/XXXXXXXXXXX
 *   https://www.youtube-nocookie.com/embed/XXXXXXXXXXX
 *   https://www.youtube.com/shorts/XXXXXXXXXXX
 *   https://www.youtube.com/live/XXXXXXXXXXX
 *   XXXXXXXXXXX  (o ID puro, 11 caracteres)
 *
 * Saída padronizada gravada no banco:
 *   provider_video_id = ID
 *   embed_url         = https://www.youtube-nocookie.com/embed/ID
 *
 * Nunca gravamos a URL digitada sem normalizar.
 */

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
]);

export interface NormalizedYouTube {
  providerVideoId: string;
  embedUrl: string;
}

function fromPath(pathname: string): string | null {
  const match = pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
  return match ? match[1] : null;
}

/** Retorna `null` quando não dá para extrair um ID de vídeo válido. */
export function normalizeYouTube(raw: string): NormalizedYouTube | null {
  const input = raw.trim();
  if (!input) return null;

  let id: string | null = null;

  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      id = url.pathname.slice(1).split("/")[0] || null;
    } else if (YOUTUBE_HOSTS.has(host)) {
      id = url.pathname === "/watch" ? url.searchParams.get("v") : fromPath(url.pathname);
    }
  } catch {
    // Não é URL: pode ser o ID puro.
    if (VIDEO_ID_RE.test(input)) id = input;
  }

  if (!id || !VIDEO_ID_RE.test(id)) return null;

  return {
    providerVideoId: id,
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
  };
}

/** URL "watch" canônica — usada para pré-preencher o formulário de edição. */
export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
