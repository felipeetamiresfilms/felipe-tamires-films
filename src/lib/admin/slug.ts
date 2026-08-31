import "server-only";

import { randomBytes } from "node:crypto";

/**
 * Slug privado do evento: `parte-legivel` + `-` + sufixo aleatório forte.
 *
 * O sufixo é o segredo de acesso ao link `/assistir/[slug]`, então:
 *  - é gerado com `crypto.randomBytes` (CSPRNG), NUNCA `Math.random()`;
 *  - usa um alfabeto de 32 símbolos seguros para URL (sem 0/1/l/o para não
 *    confundir na hora de ditar/copiar);
 *  - 12 símbolos × 5 bits = **60 bits** de entropia.
 *
 * A unicidade final é garantida por quem grava (checagem + `unique` no banco).
 */

// 32 símbolos -> exatamente 5 bits por caractere, distribuição uniforme.
const SUFFIX_ALPHABET = "23456789abcdefghijkmnpqrstuvwxyz";
const SUFFIX_LENGTH = 12;

export const SLUG_SUFFIX_ENTROPY_BITS = SUFFIX_LENGTH * 5; // 60

/** Sufixo aleatório criptograficamente seguro, compatível com URL. */
export function randomSlugSuffix(): string {
  const bytes = randomBytes(SUFFIX_LENGTH);
  let out = "";
  for (let i = 0; i < SUFFIX_LENGTH; i += 1) {
    // 5 bits por byte -> índice 0..31, cada símbolo igualmente provável.
    out += SUFFIX_ALPHABET[bytes[i] & 31];
  }
  return out;
}

/** Parte legível: minúsculas, sem acento, só [a-z0-9-]. */
export function slugifyTitle(input: string): string {
  const base = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove marcas de acento
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");

  return base || "evento";
}

/** Monta um slug candidato (ainda pode colidir — quem grava revalida). */
export function buildEventSlug(title: string): string {
  return `${slugifyTitle(title)}-${randomSlugSuffix()}`;
}
