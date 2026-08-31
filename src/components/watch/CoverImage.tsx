import Image from "next/image";

/**
 * Capa do hero. `unoptimized` de propósito: a src é uma signed URL do
 * Supabase com `?token=` que muda a cada hora, e `remotePatterns` do
 * otimizador não casa querystring dinâmica. `unoptimized` emite um <img>
 * direto (sem passar pelo /_next/image e sem checagem de remotePatterns),
 * então nada precisa ser liberado no next.config para a capa.
 *
 * Server Component — passado como prop para <WatchClient> (que é client),
 * mantendo a imagem pesada fora do bundle de JS.
 */
export function CoverImage({ url, alt }: { url: string; alt: string }) {
  return (
    <Image
      src={url}
      alt={alt}
      fill
      priority
      unoptimized
      sizes="100vw"
      className="object-cover"
    />
  );
}
