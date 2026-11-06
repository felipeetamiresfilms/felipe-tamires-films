/**
 * Regras puras (sem I/O) para criar categorias da curadoria pelo backstage.
 * Ficam fora de `mutations.ts` (server-only) para poderem ser testadas.
 */

export const CATEGORY_NAME_MAX = 60;

/** Nome como será gravado: sem espaços nas pontas nem espaços repetidos. */
export function cleanCategoryName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

/**
 * Chave de comparação para impedir duplicatas: ignora maiúsculas/minúsculas,
 * espaços extras e acentos ("  dj " == "DJ", "Decoração" == "decoracao").
 */
export function categoryKey(name: string): string {
  return cleanCategoryName(name)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export type CategoryNameCheck =
  | { ok: true; name: string }
  | { ok: false; error: string };

export function validateCategoryName(raw: string): CategoryNameCheck {
  const name = cleanCategoryName(raw);
  if (name.length === 0) return { ok: false, error: "Informe o nome da categoria." };
  if (name.length > CATEGORY_NAME_MAX) {
    return {
      ok: false,
      error: `Nome muito longo (máx. ${CATEGORY_NAME_MAX} caracteres).`,
    };
  }
  // Precisa de ao menos uma letra/número para gerar um slug válido.
  if (!/[a-z0-9]/i.test(name.normalize("NFD").replace(/[̀-ͯ]/g, ""))) {
    return { ok: false, error: "Use ao menos uma letra ou número no nome." };
  }
  return { ok: true, name };
}

/** Procura uma categoria existente equivalente (mesma chave ou mesmo slug). */
export function findDuplicateCategory<T extends { name: string; slug: string }>(
  existing: readonly T[],
  name: string,
  slug: string,
): T | undefined {
  const key = categoryKey(name);
  return existing.find((c) => categoryKey(c.name) === key || c.slug === slug);
}
