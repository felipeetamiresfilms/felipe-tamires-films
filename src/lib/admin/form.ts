import type { z } from "zod";

/**
 * Estado padrão das ações de formulário do painel (usado com `useActionState`).
 *
 *  - `ok`          -> concluiu (na prática as ações fazem `redirect`, então o
 *                     cliente raramente vê `ok: true`; fica aqui por completude).
 *  - `error`       -> mensagem AMIGÁVEL de topo. Nunca SQL / stack / erro cru.
 *  - `fieldErrors` -> mensagem por campo (`name` do input -> texto).
 */
export type FormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export const EMPTY_FORM_STATE: FormState = { ok: false };

/**
 * Estado das ações do portal do cliente (Etapa 8). Carrega o `token` recém
 * gerado — que só existe logo após criar/regenerar e NUNCA é persistido.
 */
export type PortalFormState = {
  ok: boolean;
  error?: string;
  token?: string;
};

export const EMPTY_PORTAL_FORM_STATE: PortalFormState = { ok: false };

/** Converte os `issues` do Zod em `{ campo: mensagem }` (primeira por campo). */
export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in out)) {
      out[key] = issue.message;
    }
  }
  return out;
}

/** Mensagem genérica para falhas inesperadas de banco — sem vazar detalhes. */
export const GENERIC_SAVE_ERROR =
  "Não foi possível salvar agora. Confira os dados e tente de novo.";

export const SESSION_EXPIRED_ERROR =
  "Sua sessão expirou. Entre novamente para continuar.";
