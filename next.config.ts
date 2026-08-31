import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // O upload da capa (até 10 MB) passa por uma Server Action como
    // multipart/form-data. O limite padrão de 1 MB rejeitaria o arquivo;
    // 12 MB cobre o arquivo + o overhead das boundaries do multipart.
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  images: {
    // Restritivo de propósito: só as thumbnails públicas do YouTube passam
    // pelo otimizador. A capa é uma signed URL do Supabase (com `?token=`
    // que muda a cada hora) — `remotePatterns` não casa querystring dinâmica,
    // então ela é servida com `next/image unoptimized` (ver
    // src/components/watch/CoverImage.tsx).
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
      { protocol: "https", hostname: "img.youtube.com", pathname: "/vi/**" },
    ],
  },
};

export default nextConfig;
