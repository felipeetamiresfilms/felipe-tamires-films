"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { loadBackstageAccess } from "@/lib/admin/auth";
import {
  GENERIC_SAVE_ERROR,
  SESSION_EXPIRED_ERROR,
  zodFieldErrors,
  type FormState,
  type PortalFormState,
} from "@/lib/admin/form";
import { clientInputSchema, isUuid } from "@/lib/admin/validation";
import {
  deleteClient,
  deleteClientWithAcervo,
  insertClient,
  setClientPortalEnabled,
  setClientPortalToken,
  updateClient,
} from "@/lib/admin/mutations";
import {
  getClientAcervoSummary,
  getClientPortalState,
} from "@/lib/admin/queries";
import { createServerAuthClient } from "@/lib/supabase/server";
import { generatePortalToken, hashPortalToken } from "@/lib/client-portal";

function readClientForm(formData: FormData) {
  return clientInputSchema.safeParse({
    displayName: String(formData.get("displayName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  });
}

export async function createClientAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const access = await loadBackstageAccess();
  if (access.state !== "ok") {
    return { ok: false, error: SESSION_EXPIRED_ERROR };
  }

  const parsed = readClientForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Confira os campos destacados.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  let newId: string;
  try {
    ({ id: newId } = await insertClient(parsed.data));
  } catch (err) {
    console.error("createClientAction", err);
    return { ok: false, error: GENERIC_SAVE_ERROR };
  }

  revalidatePath("/backstage-ft", "layout");
  redirect(`/backstage-ft/clientes/${newId}?ok=cliente-criado`);
}

export async function updateClientAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const access = await loadBackstageAccess();
  if (access.state !== "ok") {
    return { ok: false, error: SESSION_EXPIRED_ERROR };
  }

  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) {
    return { ok: false, error: "Cliente inválido." };
  }

  const parsed = readClientForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Confira os campos destacados.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  try {
    await updateClient(id, parsed.data);
  } catch (err) {
    console.error("updateClientAction", err);
    return { ok: false, error: GENERIC_SAVE_ERROR };
  }

  revalidatePath("/backstage-ft", "layout");
  redirect(`/backstage-ft/clientes/${id}?ok=cliente-atualizado`);
}

const DESTRUCTIVE_CONFIRM_WORD = "EXCLUIR";
const DESTRUCTIVE_CONFIRM_ERROR =
  'Digite EXCLUIR (em letras maiúsculas) no campo para confirmar a exclusão do cliente e de todo o acervo.';
const RACE_GOT_EVENTS_ERROR =
  "Este cliente passou a ter eventos vinculados agora há pouco. Recarregue a página e use a exclusão completa.";

/**
 * Exclusão de cliente (Etapas 9 e 10). Dois caminhos, decididos pela contagem
 * REAL de eventos (lida no servidor — nunca do browser):
 *
 *  - Cliente VAZIO  -> confirmação simples (checkbox `confirm=on`). DELETE
 *    direto na linha via sessão autenticada + RLS ("clients admin delete").
 *
 *  - Cliente COM ACERVO -> confirmação forte: o admin digita "EXCLUIR" no
 *    campo `confirm`. Chama a RPC transacional `delete_client_with_acervo`
 *    (cliente + eventos + vídeos por CASCADE, tudo ou nada). Depois, e só se
 *    o banco deu certo, limpa as capas do bucket `event-media` em best-effort.
 *
 * Nunca usa service_role. A FK events.client_id segue ON DELETE RESTRICT —
 * o acervo só some por esta operação explícita.
 */
export async function deleteClientAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const access = await loadBackstageAccess();
  if (access.state !== "ok") {
    return { ok: false, error: SESSION_EXPIRED_ERROR };
  }

  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) {
    return { ok: false, error: "Cliente inválido." };
  }

  let summary;
  try {
    summary = await getClientAcervoSummary(id);
  } catch (err) {
    console.error("deleteClientAction/summary", err);
    return { ok: false, error: GENERIC_SAVE_ERROR };
  }

  if (!summary.exists) {
    return { ok: false, error: "Cliente não encontrado." };
  }

  const confirm = String(formData.get("confirm") ?? "");

  // --- Cliente vazio: fluxo simples (checkbox) ---------------------------
  if (summary.eventCount === 0) {
    if (confirm !== "on") {
      return {
        ok: false,
        error: "Marque a confirmação para excluir este cliente.",
      };
    }

    try {
      await deleteClient(id);
    } catch (err) {
      if ((err as { code?: string }).code === "23503") {
        return { ok: false, error: RACE_GOT_EVENTS_ERROR };
      }
      console.error("deleteClientAction/simple", err);
      return { ok: false, error: GENERIC_SAVE_ERROR };
    }

    revalidatePath("/backstage-ft", "layout");
    redirect("/backstage-ft/clientes?ok=cliente-excluido");
  }

  // --- Cliente com acervo: fluxo destrutivo (digitar EXCLUIR) -----------
  if (confirm.trim() !== DESTRUCTIVE_CONFIRM_WORD) {
    return { ok: false, error: DESTRUCTIVE_CONFIRM_ERROR };
  }

  try {
    await deleteClientWithAcervo(id);
  } catch (err) {
    console.error("deleteClientAction/acervo", err);
    return { ok: false, error: GENERIC_SAVE_ERROR };
  }

  // Banco OK. Limpeza das capas no Storage é best-effort: se falhar, NÃO
  // reverte nada — um objeto órfão é menos grave que exclusão parcial.
  if (summary.coverPaths.length > 0) {
    try {
      const supabase = await createServerAuthClient();
      await supabase.storage.from("event-media").remove(summary.coverPaths);
    } catch (err) {
      console.error("deleteClientAction/storage-cleanup", err);
    }
  }

  revalidatePath("/backstage-ft", "layout");
  redirect("/backstage-ft/clientes?ok=cliente-excluido");
}

// --- Portal do cliente (Etapa 8) --------------------------------------

/**
 * Cria OU regenera o acesso do cliente. Gera um token forte, grava só o
 * hash e liga o portal; devolve o token EM MEMÓRIA (via `useActionState`)
 * para o admin copiar UMA vez — nada é redirecionado nem persistido em
 * texto puro. Regenerar (já existe hash) exige o checkbox `confirm`.
 */
export async function issueClientPortalAction(
  _prev: PortalFormState,
  formData: FormData,
): Promise<PortalFormState> {
  const access = await loadBackstageAccess();
  if (access.state !== "ok") {
    return { ok: false, error: SESSION_EXPIRED_ERROR };
  }

  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) {
    return { ok: false, error: "Cliente inválido." };
  }

  let state;
  try {
    state = await getClientPortalState(id);
  } catch (err) {
    console.error("issueClientPortalAction/state", err);
    return { ok: false, error: GENERIC_SAVE_ERROR };
  }

  if (state.created && formData.get("confirm") !== "on") {
    return {
      ok: false,
      error: "Confirme a operação — o link atual deixará de funcionar na hora.",
    };
  }

  const token = generatePortalToken();
  try {
    await setClientPortalToken(id, hashPortalToken(token));
  } catch (err) {
    console.error("issueClientPortalAction", err);
    return { ok: false, error: GENERIC_SAVE_ERROR };
  }

  revalidatePath("/backstage-ft", "layout");
  return { ok: true, token };
}

export async function disableClientPortalAction(
  _prev: PortalFormState,
  formData: FormData,
): Promise<PortalFormState> {
  const access = await loadBackstageAccess();
  if (access.state !== "ok") {
    return { ok: false, error: SESSION_EXPIRED_ERROR };
  }

  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) {
    return { ok: false, error: "Cliente inválido." };
  }

  try {
    await setClientPortalEnabled(id, false);
  } catch (err) {
    console.error("disableClientPortalAction", err);
    return { ok: false, error: GENERIC_SAVE_ERROR };
  }

  revalidatePath("/backstage-ft", "layout");
  return { ok: true };
}
