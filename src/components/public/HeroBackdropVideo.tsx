"use client";

import { useEffect, useRef } from "react";

const DESKTOP_SRC = "/videos/hero.mp4";
/** Loop de ~10 s (destaques) recortado do hero.mp4 — bem mais leve para celular. */
const MOBILE_SRC = "/videos/hero-mobile.mp4";
/** Primeiro quadro do loop mobile: no celular, poster -> vídeo sem salto. */
const POSTER_SRC = "/videos/hero-poster.webp";
const MOBILE_QUERY = "(max-width: 767px)";

type NetworkInformationLike = { saveData?: boolean };

/**
 * Vídeo de fundo do hero da home. Arquivos locais em `public/videos/`.
 *
 * O HTML do servidor sai só com o poster (nenhum vídeo é baixado de cara).
 * No navegador escolhemos a fonte:
 *   - movimento reduzido ou economia de dados -> nenhum vídeo, fica o poster;
 *   - tela < 768px -> loop mobile;
 *   - demais -> hero.mp4 original.
 * Sem JS, também fica o poster.
 *
 * `muted` + `playsInline` => autoplay permitido no Safari/Chrome.
 * Decorativo: `aria-hidden`, sem controles. Fica sobre o <AbstractBackdrop />,
 * que serve de cor de base enquanto o poster carrega.
 */
export function HeroBackdropVideo({ className = "" }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const saveData =
      (navigator as Navigator & { connection?: NetworkInformationLike })
        .connection?.saveData === true;
    if (reducedMotion || saveData) return;

    // O React não garante o atributo `muted` no DOM — sem ele o autoplay
    // é bloqueado. Define pela propriedade antes de carregar.
    video.muted = true;
    video.src = window.matchMedia(MOBILE_QUERY).matches
      ? MOBILE_SRC
      : DESKTOP_SRC;
    // Autoplay recusado (ex.: modo de pouca energia do iOS): fica o poster.
    video.play().catch(() => {});
  }, []);

  return (
    <video
      ref={videoRef}
      aria-hidden="true"
      autoPlay
      muted
      loop
      playsInline
      preload="none"
      poster={POSTER_SRC}
      className={`absolute inset-0 h-full w-full object-cover ${className}`}
    />
  );
}
