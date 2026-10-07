import type { PrivateWatchVideo, WatchVideo } from "@/lib/events";

/**
 * Ação "Baixar filme" — SÓ existe na entrega privada.
 *
 * O portfólio público passa `WatchVideo` (sem `downloadUrl`), então aqui não
 * renderiza nada; vídeo sem link também não renderiza nada.
 *
 * Abre o link cadastrado (normalmente Google Drive) em nova aba, sem
 * reescrever a URL. `noreferrer` evita que o slug privado vá como Referer.
 */
export function DownloadLink({
  video,
  size = "sm",
}: {
  video: WatchVideo | PrivateWatchVideo;
  /** "lg" acompanha o CTA do hero; "sm" acompanha o "Fechar" do player. */
  size?: "sm" | "lg";
}) {
  const href = "downloadUrl" in video ? video.downloadUrl : null;
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Baixar filme: ${video.title} (abre em nova aba)`}
      className={[
        "inline-flex shrink-0 items-center gap-2 rounded-full border border-brass/50 font-medium uppercase text-bone transition-colors hover:border-brass focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brass/60",
        size === "lg"
          ? "px-6 py-3.5 text-sm tracking-[0.22em]"
          : "px-4 py-2.5 text-xs tracking-[0.22em]",
      ].join(" ")}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={size === "lg" ? "h-4 w-4 text-brass" : "h-3.5 w-3.5 text-brass"}
      >
        <path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10" />
      </svg>
      Baixar filme
    </a>
  );
}
